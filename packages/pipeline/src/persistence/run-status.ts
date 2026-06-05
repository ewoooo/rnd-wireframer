import type {
	PipelineId,
	PipelinePersistenceAdapter,
	PipelineProgressEvent,
	PipelineRunEvent,
	PipelineRunStatus,
	PipelineStageId,
	StepPipelineDefinition,
} from "../public/types";

export type CreatePipelineRunStatusInput = {
	createdAt: string;
	definition: StepPipelineDefinition;
	outDir?: string;
	pipelineId: PipelineId | string;
	runDir?: string;
	runId: string;
	sourcePath?: string;
};

export type UpdatePipelineRunStatusInput = {
	error?: PipelineRunStatus["error"];
	event: PipelineProgressEvent;
	status: PipelineRunStatus;
	timestamp: string;
};

export function createPipelineRunStatus(input: CreatePipelineRunStatusInput): PipelineRunStatus {
	return {
		createdAt: input.createdAt,
		outDir: input.outDir,
		pipelineId: input.pipelineId,
		runDir: input.runDir,
		runId: input.runId,
		schemaVersion: "pipeline-run-status.v0.1",
		sourcePath: input.sourcePath,
		stageOrder: input.definition.steps.map((step) => step.id),
		stages: Object.fromEntries(
			input.definition.steps.map((step) => [
				step.id,
				{
					status: "pending" as const,
				},
			]),
		) as PipelineRunStatus["stages"],
		status: "queued",
		updatedAt: input.createdAt,
	};
}

export function updatePipelineRunStatus(input: UpdatePipelineRunStatusInput): PipelineRunStatus {
	const currentStage = input.event.stage;
	const stages = { ...input.status.stages };
	const previousStage = stages[currentStage] ?? { status: "pending" as const };
	const stageStatus = readStageRunStatus(input.event.status);

	stages[currentStage] = {
		...previousStage,
		completedAt:
			input.event.status === "completed" || input.event.status === "failed"
				? input.timestamp
				: previousStage.completedAt,
		startedAt: input.event.status === "started" ? input.timestamp : previousStage.startedAt,
		status: stageStatus,
	};

	return {
		...input.status,
		completedAt: input.event.status === "failed" ? input.timestamp : input.status.completedAt,
		currentStage,
		error: input.error ?? input.status.error,
		stages,
		status: input.event.status === "failed" ? "failed" : "running",
		updatedAt: input.timestamp,
	};
}

export function completePipelineRunStatus(
	status: PipelineRunStatus,
	timestamp: string,
): PipelineRunStatus {
	return {
		...status,
		completedAt: timestamp,
		currentStage: undefined,
		status: "completed",
		updatedAt: timestamp,
	};
}

export function skipPipelineRunStatus(
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

export async function persistPipelineRunEvent(input: {
	adapter?: PipelinePersistenceAdapter;
	event: PipelineRunEvent;
	status: PipelineRunStatus;
}): Promise<void> {
	if (!input.adapter) return;
	await input.adapter.writeStatus(input.status);
	await input.adapter.appendEvent(input.event);
}

export function createPipelineRunEvent(input: {
	eventId: string;
	event: PipelineProgressEvent;
	timestamp: string;
	type?: PipelineRunEvent["type"];
}): PipelineRunEvent {
	return {
		eventId: input.eventId,
		pipelineId: input.event.pipelineId,
		runId: input.event.runId,
		stage: input.event.stage,
		status: input.event.status,
		timestamp: input.timestamp,
		type: input.type ?? "stage",
	};
}

const EVENT_STATUS_TO_STAGE_STATUS = {
	completed: "completed",
	failed: "failed",
	started: "running",
} as const satisfies Record<
	PipelineProgressEvent["status"],
	PipelineRunStatus["stages"][PipelineStageId]["status"]
>;

function readStageRunStatus(
	status: PipelineProgressEvent["status"],
): PipelineRunStatus["stages"][PipelineStageId]["status"] {
	return EVENT_STATUS_TO_STAGE_STATUS[status];
}
