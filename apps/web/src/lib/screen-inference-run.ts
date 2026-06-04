export type ScreenInferenceLayer = "compose" | "revise" | "understand";

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

export const SCREEN_INFERENCE_LAYERS: ScreenInferenceStatusLayer[] = [
	{
		artifacts: ["source-spec.json", "screen-intent.json"],
		label: "Understand",
		layer: "understand",
		stages: ["read-source", "parse-source", "derive-screen-intent"],
		status: "pending",
	},
	{
		artifacts: [
			"composition-plan.json",
			"decoration-plan.json",
			"pattern-selection.json",
			"agent-result.json",
			"component-proposal.json",
		],
		label: "Compose",
		layer: "compose",
		previewArtifact: "artifacts/agent-result.json",
		stages: [
			"plan-composition",
			"derive-decoration-plan",
			"select-pattern",
			"generate-render-tree",
			"propose-components",
		],
		status: "pending",
	},
	{
		artifacts: ["validation-report.json", "quality-review.json", "final-result.json"],
		label: "Revise",
		layer: "revise",
		previewArtifact: "artifacts/final-result.json",
		stages: [
			"validate-render-tree",
			"review-quality",
			"revise-render-tree-if-invalid",
			"validate-render-tree-after-revision",
			"write-artifacts",
		],
		status: "pending",
	},
];

export function createScreenInferenceRunId(screenId: string, date = new Date()): string {
	const timestamp = date.toISOString().replace(/\D/g, "").slice(0, 14);
	const safeScreenId = screenId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "screen";
	return `web-${safeScreenId}-${timestamp}`;
}

export function createScreenInferenceStatus(input: {
	error?: ScreenInferenceRunStatus["error"];
	now?: string;
	runId: string;
	status: ScreenInferenceLifecycleStatus;
}): ScreenInferenceRunStatus {
	const now = input.now ?? new Date().toISOString();
	return {
		createdAt: now,
		currentLayer: readCurrentLayer(input.status),
		error: input.error,
		layers: createLayersForStatus(input.status, now, input.error),
		runId: input.runId,
		schemaVersion: "screen-inference-run-status.v0.1",
		status: input.status,
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
