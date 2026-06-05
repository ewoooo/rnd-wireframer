// 파이프라인 스테이지 식별자. 원래 @cx/pipeline 에서 가져오던 타입을 로컬 union 으로
// 대체한다(보기 전용 단계에서는 파이프라인 패키지 의존을 두지 않는다).
export type PipelineStageId =
	| "read-source"
	| "parse-source"
	| "derive-screen-intent"
	| "plan-composition"
	| "derive-decoration-plan"
	| "select-pattern"
	| "generate-render-tree"
	| "propose-components"
	| "validate-render-tree"
	| "review-quality"
	| "revise-render-tree-if-invalid"
	| "validate-render-tree-after-revision"
	| "write-artifacts";

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

// ── Review 계약(원래 @cx/schema). 보기 전용 단계에서 필요한 최소 형태만 로컬 정의 ──
export type ReviewSummary = { errorCount?: number; warningCount?: number };
export type ValidationReportContract = { ok?: boolean; summary?: ReviewSummary };
export type QualityInspectionContract = {
	summary?: ReviewSummary;
	findings?: Array<{ code: string; message: string }>;
};
export type NewScreenReviewData = {
	quality?: QualityInspectionContract;
	status?: ScreenInferenceRunStatus;
	validation?: ValidationReportContract;
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
