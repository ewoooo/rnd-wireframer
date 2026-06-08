import type { DesignContextBundleRef } from "@cx/schema";

export type InferencePlanningStageKind =
	| "source-ingest"
	| "generation"
	| "quality-review"
	| "preview"
	| "apply";

export type InferencePlanningNextAction =
	| "request-generation"
	| "request-review"
	| "request-preview"
	| "request-apply"
	| "request-retry"
	| "stop";

export type InferencePlanningIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
};

export type InferencePlanningDecision = {
	action: InferencePlanningNextAction;
	issues: InferencePlanningIssue[];
	stage: InferencePlanningStageKind;
};

export type DesignContextBundleSelection = {
	bundleRefs: DesignContextBundleRef[];
	rationale: string;
};

export type BuildGenerationNextActionInput = {
	initialValidationReport?: unknown;
	qualityInspection?: unknown;
	retryCount: number;
	validationReport?: unknown;
};

export type GenerationNextAction =
	| { action: "request-human-review"; reason: string }
	| { action: "request-revision"; reason: string; target: "contract" | "quality" }
	| { action: "stop"; reason: string }
	| { action: "write-artifacts"; reason: string };
