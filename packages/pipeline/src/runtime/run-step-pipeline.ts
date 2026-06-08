import {
	createPipelineExecutionState,
	createReferenceResolution,
	resolveStepInput,
	resolveStepInputs,
	StepInputResolutionError,
} from "../definition";
import {
	completePipelineRunStatus,
	createPipelineRunEvent,
	createPipelineRunStatus,
	persistPipelineRunEvent,
	updatePipelineRunStatus,
} from "../persistence";
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
	const referenceResolution = createReferenceResolution(options.resolveReference);
	const events: PipelineRunEvent[] = [];
	let status = createPipelineRunStatus({
		createdAt,
		definition,
		outDir: options.status?.outDir,
		pipelineId: definition.id,
		runDir: options.status?.runDir,
		runId: options.runId,
		sourcePath: options.status?.sourcePath,
	});

	await options.persistence?.writeStatus(status);

	// Steps run in declaration order; each reads prior outputs via its inputs.
	for (const step of definition.steps) {
		const startedAt = now();
		status = markStepStarted(state, status, step.id, startedAt);
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
			const inputs = await resolveStepInputs(step.inputs, state, referenceResolution);
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
			status = markStepCompleted(state, status, step.id, completedAt, output);
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
			status = markStepFailed(state, status, step.id, failedAt, stepError);
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
	status = completePipelineRunStatus(status, completedAt);
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
	if (step.usesAI === true) {
		if (!options.agent) {
			throw new StepInputResolutionError(`agent.${step.id}`);
		}
		return options.agent({ context, inputs, step });
	}
	if (step.usesAI === false) {
		return step.execute(inputs, context);
	}
	throw new StepInputResolutionError("execute.unknown");
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
						rule.from.stepIds.map((stepId) => [stepId, state.steps[stepId]?.outputs?.result]),
					)
				: resolveStepInput(rule.from, state);
	}

	return artifacts;
}

/**
 * Each step transition writes two representations that must stay in lock-step:
 * the execution-state entry (`state.steps[id]`, working memory for inputs/feedback)
 * and the persisted run status (`status.stages[id]`, the observable snapshot).
 * The mark* helpers update both together so they cannot drift; the run-status
 * transition itself lives in @cx/pipeline persistence.
 */
function applyStepStatus(
	status: PipelineRunStatus,
	stage: string,
	eventStatus: PipelineRunEvent["status"],
	timestamp: string,
	error?: PipelineRunStatus["error"],
): PipelineRunStatus {
	return updatePipelineRunStatus({
		error,
		event: {
			pipelineId: status.pipelineId,
			runId: status.runId,
			stage,
			status: eventStatus,
			timestamp,
		},
		status,
		timestamp,
	});
}

function markStepStarted(
	state: PipelineExecutionState,
	status: PipelineRunStatus,
	stepId: string,
	timestamp: string,
): PipelineRunStatus {
	state.steps[stepId] = { ...state.steps[stepId], startedAt: timestamp, status: "running" };
	return applyStepStatus(status, stepId, "started", timestamp);
}

function markStepCompleted(
	state: PipelineExecutionState,
	status: PipelineRunStatus,
	stepId: string,
	timestamp: string,
	output: unknown,
): PipelineRunStatus {
	state.steps[stepId] = {
		...state.steps[stepId],
		completedAt: timestamp,
		outputs: { result: output },
		status: "completed",
	};
	return applyStepStatus(status, stepId, "completed", timestamp);
}

function markStepFailed(
	state: PipelineExecutionState,
	status: PipelineRunStatus,
	stepId: string,
	timestamp: string,
	error: NonNullable<PipelineRunStatus["error"]>,
): PipelineRunStatus {
	state.steps[stepId] = {
		...state.steps[stepId],
		completedAt: timestamp,
		error,
		status: "failed",
	};
	return applyStepStatus(status, stepId, "failed", timestamp, error);
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
	const event = createPipelineRunEvent({
		eventId: input.createEventId(),
		event: {
			pipelineId: input.status.pipelineId,
			runId: input.status.runId,
			stage: input.stage,
			status: input.type,
			timestamp: input.timestamp,
		},
		timestamp: input.timestamp,
	});
	input.events.push(event);
	await persistPipelineRunEvent({
		adapter: input.options.persistence,
		event,
		status: input.status,
	});
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
