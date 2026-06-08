import { randomUUID } from "node:crypto";

import {
	createScreenGenerationStageLayers,
	getScreenGenerationStageLayer,
	getScreenGenerationStageMessage,
	type PipelineStageId,
	type ScreenGenerationLayer,
} from "@cx/pipeline";

export type ScreenInferenceLayer = ScreenGenerationLayer;

export type ScreenInferenceLifecycleStatus =
	| "applied"
	| "applying"
	| "approved"
	| "failed"
	| "queued"
	| "running"
	| "waiting-review";

export type ScreenInferenceLayerStatus = "completed" | "failed" | "pending" | "running" | "skipped";

export type ScreenInferenceRunStatus = {
	createdAt: string;
	currentLayer?: ScreenInferenceLayer;
	currentMessage?: string;
	currentStage?: PipelineStageId;
	error?: {
		code: string;
		message: string;
	};
	layers: ScreenInferenceStatusLayer[];
	runId: string;
	schemaVersion: "screen-inference-run-status.v0.1";
	status: ScreenInferenceLifecycleStatus;
	updatedAt: string;
};

export type ScreenInferenceStatusLayer = {
	artifacts: string[];
	completedAt?: string;
	label: "Compose" | "Revise" | "Understand";
	layer: ScreenInferenceLayer;
	previewArtifact?: string;
	stages: string[];
	startedAt?: string;
	status: ScreenInferenceLayerStatus;
	summary?: {
		description?: string;
		errorCount?: number;
		title?: string;
		warningCount?: number;
	};
};

export type ScreenInferenceRunManifest = {
	runId?: string;
	sourcePath?: string;
	stageLayers?: Array<{
		artifacts?: string[];
		label?: string;
		layer?: string;
		stages?: string[];
	}>;
	summary?: {
		errorCount?: number;
		ok?: boolean;
		validationOk?: boolean;
		warningCount?: number;
	};
	[key: string]: unknown;
};

export type ScreenInferenceRunResponse = {
	manifest?: ScreenInferenceRunManifest;
	status: ScreenInferenceRunStatus;
};

export type ScreenInferenceRunCreateResponse = ScreenInferenceRunResponse & {
	runId: string;
	statusUrl: string;
};

export const SCREEN_INFERENCE_LAYERS: ScreenInferenceStatusLayer[] =
	createScreenGenerationStageLayers().map((layer) => ({
		artifacts: layer.artifacts,
		label: layer.label,
		layer: layer.layer,
		previewArtifact: layer.previewArtifact ? `artifacts/${layer.previewArtifact}` : undefined,
		stages: layer.stages,
		status: "pending",
	}));

export function createScreenInferenceRunId(screenId: string, date = new Date()): string {
	const timestamp = date.toISOString().replace(/\D/g, "").slice(0, 17);
	const safeScreenId = screenId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "screen";
	return `web-${safeScreenId}-${timestamp}-${randomUUID().slice(0, 8)}`;
}

export function createScreenInferenceStatus(input: {
	createdAt?: string;
	error?: ScreenInferenceRunStatus["error"];
	now?: string;
	runId: string;
	status: ScreenInferenceLifecycleStatus;
}): ScreenInferenceRunStatus {
	const now = input.now ?? new Date().toISOString();
	return {
		createdAt: input.createdAt ?? now,
		currentLayer: readCurrentLayer(input.status),
		error: input.error,
		layers: createLayersForStatus(input.status, now, input.error),
		runId: input.runId,
		schemaVersion: "screen-inference-run-status.v0.1",
		status: input.status,
		updatedAt: now,
	};
}

export function createScreenInferenceProgressStatus(input: {
	createdAt?: string;
	now?: string;
	runId: string;
	stage: PipelineStageId;
}): ScreenInferenceRunStatus {
	const now = input.now ?? new Date().toISOString();
	const currentLayer = readLayerForStage(input.stage);
	return {
		createdAt: input.createdAt ?? now,
		currentLayer,
		currentMessage: readMessageForStage(input.stage),
		currentStage: input.stage,
		layers: createLayersForStage(input.stage, now),
		runId: input.runId,
		schemaVersion: "screen-inference-run-status.v0.1",
		status: "running",
		updatedAt: now,
	};
}

export function createWaitingReviewStatus(input: {
	createdAt?: string;
	manifest?: ScreenInferenceRunManifest;
	now?: string;
	runId: string;
}): ScreenInferenceRunStatus {
	const now = input.now ?? new Date().toISOString();
	const summary = input.manifest?.summary;
	return {
		createdAt: input.createdAt ?? now,
		layers: SCREEN_INFERENCE_LAYERS.map((layer) => ({
			...layer,
			completedAt: now,
			startedAt: input.createdAt ?? now,
			status: "completed" as const,
			summary:
				layer.layer === "revise"
					? {
							errorCount: summary?.errorCount ?? 0,
							title: summary?.ok ? "Ready for review" : "Completed with issues",
							warningCount: summary?.warningCount ?? 0,
						}
					: undefined,
		})),
		runId: input.runId,
		schemaVersion: "screen-inference-run-status.v0.1",
		status: "waiting-review",
		updatedAt: now,
	};
}

export function createFailedScreenInferenceStatus(input: {
	createdAt?: string;
	error?: ScreenInferenceRunStatus["error"];
	now?: string;
	runId: string;
	stage?: PipelineStageId;
}): ScreenInferenceRunStatus {
	const now = input.now ?? new Date().toISOString();

	return {
		createdAt: input.createdAt ?? now,
		currentLayer: input.stage ? readLayerForStage(input.stage) : undefined,
		currentMessage: input.stage ? readMessageForStage(input.stage) : undefined,
		currentStage: input.stage,
		error: input.error,
		layers: input.stage
			? createFailedLayersForStage(input.stage, now, input.error)
			: createLayersForStatus("failed", now, input.error),
		runId: input.runId,
		schemaVersion: "screen-inference-run-status.v0.1",
		status: "failed",
		updatedAt: now,
	};
}

function createLayersForStatus(
	status: ScreenInferenceLifecycleStatus,
	now: string,
	error?: ScreenInferenceRunStatus["error"],
): ScreenInferenceStatusLayer[] {
	if (status === "queued") return SCREEN_INFERENCE_LAYERS.map((layer) => ({ ...layer }));
	if (status === "running") {
		return SCREEN_INFERENCE_LAYERS.map((layer) => ({
			...layer,
			startedAt: layer.layer === "understand" ? now : undefined,
			status: layer.layer === "understand" ? "running" : "pending",
		}));
	}
	if (status === "failed") {
		return SCREEN_INFERENCE_LAYERS.map((layer) => ({
			...layer,
			completedAt: layer.layer === "understand" ? now : undefined,
			startedAt: layer.layer === "understand" ? now : undefined,
			status: layer.layer === "understand" ? "failed" : "skipped",
			summary:
				layer.layer === "understand"
					? {
							description: error?.message,
							title: "Inference failed",
						}
					: undefined,
		}));
	}
	return SCREEN_INFERENCE_LAYERS.map((layer) => ({
		...layer,
		completedAt: now,
		startedAt: now,
		status: "completed",
	}));
}

function readCurrentLayer(
	status: ScreenInferenceLifecycleStatus,
): ScreenInferenceLayer | undefined {
	if (status === "running") return "understand";
	return undefined;
}

function createFailedLayersForStage(
	stage: PipelineStageId,
	now: string,
	error?: ScreenInferenceRunStatus["error"],
): ScreenInferenceStatusLayer[] {
	const failedLayer = readLayerForStage(stage);
	const failedIndex = SCREEN_INFERENCE_LAYERS.findIndex((layer) => layer.layer === failedLayer);

	return SCREEN_INFERENCE_LAYERS.map((layer, index) => ({
		...layer,
		completedAt: index <= failedIndex ? now : undefined,
		startedAt: index <= failedIndex ? now : undefined,
		status: index < failedIndex ? "completed" : index === failedIndex ? "failed" : "skipped",
		summary:
			index === failedIndex
				? {
						description: error?.message,
						title: "Inference failed",
					}
				: undefined,
	}));
}

function createLayersForStage(stage: PipelineStageId, now: string): ScreenInferenceStatusLayer[] {
	const currentLayer = readLayerForStage(stage);
	const currentIndex = SCREEN_INFERENCE_LAYERS.findIndex((layer) => layer.layer === currentLayer);
	return SCREEN_INFERENCE_LAYERS.map((layer, index) => ({
		...layer,
		completedAt: index < currentIndex ? now : undefined,
		startedAt: index <= currentIndex ? now : undefined,
		status: index < currentIndex ? "completed" : index === currentIndex ? "running" : "pending",
		summary:
			index === currentIndex
				? {
						description: readMessageForStage(stage),
						title: stage,
					}
				: undefined,
	}));
}

function readLayerForStage(stage: PipelineStageId): ScreenInferenceLayer {
	return getScreenGenerationStageLayer(stage);
}

function readMessageForStage(stage: PipelineStageId): string {
	return getScreenGenerationStageMessage(stage);
}
