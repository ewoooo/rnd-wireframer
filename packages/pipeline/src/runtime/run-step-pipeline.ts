import {
	createPipelineExecutionState,
	resolveStepInput,
	resolveStepInputs,
	StepInputResolutionError,
} from "../definition";
import type {
	PipelineArtifactRule,
	PipelineExecutionState,
	PipelineRunEvent,
	PipelineRunStatus,
	PipelineStep,
	RunStepPipelineOptions,
	StepPipelineDefinition,
	StepPipelineRunResult,
} from "../public/types";

export async function runStepPipeline(
	definition: StepPipelineDefinition,
	options: RunStepPipelineOptions,
): Promise<StepPipelineRunResult> {
	const now = options.now ?? (() => new Date().toISOString());
	const createEventId = options.createEventId ?? createSequentialEventId();
	const createdAt = now();
	const state = createPipelineExecutionState({
		input: options.input,
		refs: options.refs,
		steps: Object.fromEntries(
			definition.steps.map((step) => [step.id, { status: "pending" as const }]),
		),
	});
	const events: PipelineRunEvent[] = [];
	let status = createInitialStepPipelineStatus({
		createdAt,
		definition,
		outDir: options.status?.outDir,
		runDir: options.status?.runDir,
		runId: options.runId,
		sourcePath: options.status?.sourcePath,
	});

	await options.persistence?.writeStatus(status);

	for (const step of definition.steps) {
		if (step.skipWhen && (await step.skipWhen(state))) {
			const skippedAt = now();
			state.steps[step.id] = {
				...state.steps[step.id],
				completedAt: skippedAt,
				status: "skipped",
			};
			status = updateSkippedStepStatus(status, step.id, skippedAt);
			await options.persistence?.writeStatus(status);
			continue;
		}

		const startedAt = now();
		state.steps[step.id] = {
			...state.steps[step.id],
			startedAt,
			status: "running",
		};
		status = updateStepStatus(status, step.id, "started", startedAt);
		await emitStepEvent({
			createEventId,
			events,
			options,
			stage: step.id,
			status,
			timestamp: startedAt,
			type: "started",
		});

		try {
			const inputs = resolveStepInputs(step.inputs, state);
			const output = await executeStep(
				step,
				inputs,
				{
					pipelineId: definition.id,
					runId: options.runId,
				},
				options,
			);
			const completedAt = now();
			state.steps[step.id] = {
				...state.steps[step.id],
				completedAt,
				output,
				status: "completed",
			};
			status = updateStepStatus(status, step.id, "completed", completedAt);
			await emitStepEvent({
				createEventId,
				events,
				options,
				stage: step.id,
				status,
				timestamp: completedAt,
				type: "completed",
			});
		} catch (error) {
			const failedAt = now();
			const stepError = normalizeStepError(error);
			state.steps[step.id] = {
				...state.steps[step.id],
				completedAt: failedAt,
				error: stepError,
				status: "failed",
			};
			status = updateStepStatus(status, step.id, "failed", failedAt, stepError);
			await emitStepEvent({
				createEventId,
				events,
				options,
				stage: step.id,
				status,
				timestamp: failedAt,
				type: "failed",
			});
			throw error;
		}
	}

	const completedAt = now();
	status = {
		...status,
		completedAt,
		currentStage: undefined,
		status: "completed",
		updatedAt: completedAt,
	};
	await options.persistence?.writeStatus(status);

	return {
		artifacts: await resolveArtifacts(definition.artifacts ?? [], state),
		events,
		runId: options.runId,
		state,
		status,
	};
}

async function executeStep(
	step: PipelineStep,
	inputs: Record<string, unknown>,
	context: { pipelineId: string; runId: string },
	options: RunStepPipelineOptions,
): Promise<unknown> {
	if (step.usesAI) {
		if (!options.agent) {
			throw new StepInputResolutionError(`agent.${step.id}`);
		}
		return options.agent({ context, inputs, step });
	}
	return step.execute(inputs, context);
}

async function resolveArtifacts(
	rules: PipelineArtifactRule[],
	state: PipelineExecutionState,
): Promise<Record<string, unknown>> {
	const artifacts: Record<string, unknown> = {};

	for (const rule of rules) {
		if (rule.when && !(await rule.when(state))) continue;
		artifacts[rule.id] =
			rule.from.kind === "step-collection"
				? Object.fromEntries(
						rule.from.stepIds.map((stepId) => [stepId, state.steps[stepId]?.output]),
					)
				: resolveStepInput(rule.from, state);
	}

	return artifacts;
}

function createInitialStepPipelineStatus(input: {
	createdAt: string;
	definition: StepPipelineDefinition;
	outDir?: string;
	runDir?: string;
	runId: string;
	sourcePath?: string;
}): PipelineRunStatus {
	return {
		createdAt: input.createdAt,
		outDir: input.outDir,
		pipelineId: input.definition.id,
		runDir: input.runDir,
		runId: input.runId,
		schemaVersion: "pipeline-run-status.v0.1",
		sourcePath: input.sourcePath,
		stageOrder: input.definition.steps.map((step) => step.id),
		stages: Object.fromEntries(
			input.definition.steps.map((step) => [step.id, { status: "pending" as const }]),
		),
		status: "queued",
		updatedAt: input.createdAt,
	};
}

function updateStepStatus(
	status: PipelineRunStatus,
	stage: string,
	eventStatus: PipelineRunEvent["status"],
	timestamp: string,
	error?: PipelineRunStatus["error"],
): PipelineRunStatus {
	const previous = status.stages[stage] ?? { status: "pending" as const };
	const stageStatus =
		eventStatus === "started" ? "running" : eventStatus === "failed" ? "failed" : "completed";

	return {
		...status,
		completedAt: eventStatus === "failed" ? timestamp : status.completedAt,
		currentStage: stage,
		error: error ?? status.error,
		stages: {
			...status.stages,
			[stage]: {
				...previous,
				completedAt:
					eventStatus === "completed" || eventStatus === "failed"
						? timestamp
						: previous.completedAt,
				startedAt: eventStatus === "started" ? timestamp : previous.startedAt,
				status: stageStatus,
			},
		},
		status: eventStatus === "failed" ? "failed" : "running",
		updatedAt: timestamp,
	};
}

function updateSkippedStepStatus(
	status: PipelineRunStatus,
	stage: string,
	timestamp: string,
): PipelineRunStatus {
	const previous = status.stages[stage] ?? { status: "pending" as const };

	return {
		...status,
		currentStage: stage,
		stages: {
			...status.stages,
			[stage]: {
				...previous,
				completedAt: timestamp,
				status: "skipped",
			},
		},
		status: "running",
		updatedAt: timestamp,
	};
}

async function emitStepEvent(input: {
	createEventId: () => string;
	events: PipelineRunEvent[];
	options: RunStepPipelineOptions;
	stage: string;
	status: PipelineRunStatus;
	timestamp: string;
	type: PipelineRunEvent["status"];
}) {
	const event: PipelineRunEvent = {
		eventId: input.createEventId(),
		pipelineId: input.status.pipelineId,
		runId: input.status.runId,
		stage: input.stage,
		status: input.type,
		timestamp: input.timestamp,
		type: "stage",
	};
	input.events.push(event);
	await input.options.persistence?.writeStatus(input.status);
	await input.options.persistence?.appendEvent(event);
	await input.options.onEvent?.(event);
}

function normalizeStepError(error: unknown): NonNullable<PipelineRunStatus["error"]> {
	if (error instanceof StepInputResolutionError) {
		return {
			code: error.code,
			message: error.message,
		};
	}
	if (error instanceof Error) {
		return {
			code: "pipeline.step_failed",
			message: error.message,
		};
	}
	return {
		code: "pipeline.step_failed",
		message: String(error),
	};
}

function createSequentialEventId(): () => string {
	let index = 0;
	return () => {
		index += 1;
		return `step-event-${index}`;
	};
}
