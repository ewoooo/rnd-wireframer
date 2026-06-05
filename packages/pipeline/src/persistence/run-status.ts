import type {
	PipelineDefinition,
	PipelineId,
	PipelinePersistenceAdapter,
	PipelineProgressEvent,
	PipelineRunEvent,
	PipelineRunStatus,
	PipelineStageId,
} from "../public/types";

export type CreatePipelineRunStatusInput = {
	createdAt: string;
	definition: PipelineDefinition;
	outDir?: string;
	pipelineId: PipelineId;
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

export function createPipelineRunStatus(
	input: CreatePipelineRunStatusInput,
): PipelineRunStatus {
	return {
		createdAt: input.createdAt,
		outDir: input.outDir,
		pipelineId: input.pipelineId,
		runDir: input.runDir,
		runId: input.runId,
		schemaVersion: "pipeline-run-status.v0.1",
		sourcePath: input.sourcePath,
		stageOrder: [...input.definition.stages],
		stages: Object.fromEntries(
			input.definition.stages.map((stage) => [
				stage,
				{
					status: "pending" as const,
				},
			]),
		) as PipelineRunStatus["stages"],
		status: "queued",
		updatedAt: input.createdAt,
	};
}

export function updatePipelineRunStatus(
	input: UpdatePipelineRunStatusInput,
): PipelineRunStatus {
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

function readStageRunStatus(
	status: PipelineProgressEvent["status"],
): PipelineRunStatus["stages"][PipelineStageId]["status"] {
	if (status === "started") return "running";
	if (status === "failed") return "failed";
	return "completed";
}
