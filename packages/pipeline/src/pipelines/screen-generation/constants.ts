import type { PipelineStageId } from "../../public/types";

/**
 * Pure, dependency-free vocabulary for the screen-generation preset (a leaf
 * module). Stage metadata + run functions live in `steps.ts`; the constants
 * here are shared by both `steps.ts` and `artifact-commands.ts` without creating
 * an import cycle.
 */

export const SCREEN_GENERATION_PIPELINE_ID = "screen-generation" as const;

export type ScreenGenerationLayer = "compose" | "revise" | "understand";
export type ScreenGenerationStageKind = "ai" | "deterministic" | "effect" | "validation";

export const SCREEN_GENERATION_ARTIFACT_FILES = {
	agentResult: "agent-result.json",
	componentProposal: "component-proposal.json",
	compositionPlan: "composition-plan.json",
	decorationPlan: "decoration-plan.json",
	finalResult: "final-result.json",
	patternSelection: "pattern-selection.json",
	pipelineResult: "pipeline-result.json",
	qualityReview: "quality-review.json",
	screenIntent: "screen-intent.json",
	sourceSpec: "source-spec.json",
	trace: "trace.json",
	validationReport: "validation-report.json",
} as const;

export const SCREEN_GENERATION_LAYER_ORDER = ["understand", "compose", "revise"] as const;

export const SCREEN_GENERATION_LAYER_LABELS = {
	compose: "Compose",
	revise: "Revise",
	understand: "Understand",
} as const satisfies Record<ScreenGenerationLayer, string>;

export const SCREEN_GENERATION_LAYER_ARTIFACTS = {
	compose: [
		SCREEN_GENERATION_ARTIFACT_FILES.compositionPlan,
		SCREEN_GENERATION_ARTIFACT_FILES.decorationPlan,
		SCREEN_GENERATION_ARTIFACT_FILES.patternSelection,
		SCREEN_GENERATION_ARTIFACT_FILES.agentResult,
	],
	revise: [
		SCREEN_GENERATION_ARTIFACT_FILES.validationReport,
		SCREEN_GENERATION_ARTIFACT_FILES.componentProposal,
		SCREEN_GENERATION_ARTIFACT_FILES.qualityReview,
		SCREEN_GENERATION_ARTIFACT_FILES.finalResult,
		SCREEN_GENERATION_ARTIFACT_FILES.pipelineResult,
	],
	understand: [
		SCREEN_GENERATION_ARTIFACT_FILES.sourceSpec,
		SCREEN_GENERATION_ARTIFACT_FILES.screenIntent,
	],
} as const satisfies Record<ScreenGenerationLayer, readonly string[]>;

export const SCREEN_GENERATION_LAYER_TRACE_KEYS = {
	compose: [
		"composition",
		"designSkillSelection",
		"patternLayerCandidates",
		"patternSelection",
		"designContextBundleSelection",
		"generation",
		"generationSkillCatalog",
		"renderTreeGenerationSkill",
	],
	revise: ["initialValidationReport", "componentProposal", "qualityReview"],
	understand: ["parseResult", "screenIntent"],
} as const satisfies Record<ScreenGenerationLayer, readonly string[]>;

export type ScreenGenerationStageLayerGroup = {
	artifacts: string[];
	label: (typeof SCREEN_GENERATION_LAYER_LABELS)[ScreenGenerationLayer];
	layer: ScreenGenerationLayer;
	previewArtifact?: string;
	stages: PipelineStageId[];
	traceKeys: string[];
};

export function readScreenGenerationPreviewArtifact(
	layer: ScreenGenerationLayer,
	artifact: (fileName: string) => string,
): string | undefined {
	if (layer === "compose") return artifact(SCREEN_GENERATION_ARTIFACT_FILES.agentResult);
	if (layer === "revise") return artifact(SCREEN_GENERATION_ARTIFACT_FILES.finalResult);
	return undefined;
}
