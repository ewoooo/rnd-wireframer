import type { AgentTaskKind } from "@cx/agent/contract";
import { contract, refInput, stepOutput } from "../../definition";
import type { OutputContract, PipelineStageId, StepInputRef } from "../../public/types";

export const SCREEN_GENERATION_PIPELINE_ID = "screen-generation" as const;

export type ScreenGenerationLayer = "compose" | "revise" | "understand";
export type ScreenGenerationStageKind = "ai" | "deterministic" | "effect" | "validation";

type BaseScreenGenerationStageDescriptor = {
	id: PipelineStageId;
	inputs?: Record<string, StepInputRef>;
	layer: ScreenGenerationLayer;
	message: string;
	output: OutputContract;
	skipPolicy?: ScreenGenerationStageSkipPolicy;
};

export type ScreenGenerationStageSkipPolicy =
	| "continue-after-parse-failure"
	| "requires-revision-request"
	| "requires-revision-result";

export type ScreenGenerationAiStageDescriptor = BaseScreenGenerationStageDescriptor & {
	kind: "ai";
	taskKind: AgentTaskKind;
};

export type ScreenGenerationNonAiStageDescriptor = BaseScreenGenerationStageDescriptor & {
	kind: Exclude<ScreenGenerationStageKind, "ai">;
	taskKind?: never;
};

export type ScreenGenerationStageDescriptor =
	| ScreenGenerationAiStageDescriptor
	| ScreenGenerationNonAiStageDescriptor;

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

const refs = {
	componentCatalogs: refInput("componentCatalogs"),
	designContextBundles: refInput("designContextBundles"),
	layoutCatalogs: refInput("layoutCatalogs"),
	skillBundles: refInput("skillBundles"),
};

export const SCREEN_GENERATION_STAGE_DESCRIPTORS = [
	{
		id: "read-source",
		kind: "effect",
		layer: "understand",
		message: "Reading source…",
		output: contract("source-file"),
	},
	{
		id: "parse-source",
		inputs: { source: stepOutput("read-source", "result") },
		kind: "deterministic",
		layer: "understand",
		message: "Parsing markdown source…",
		output: contract("source-spec-parse-result"),
	},
	{
		id: "derive-screen-intent",
		inputs: { source: stepOutput("parse-source", "result") },
		kind: "ai",
		layer: "understand",
		message: "Understanding screen intent…",
		output: contract("screen-intent"),
		taskKind: "screen-intent",
	},
	{
		id: "plan-composition",
		inputs: {
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		kind: "ai",
		layer: "compose",
		message: "Planning composition…",
		output: contract("composition-plan-result"),
		taskKind: "composition-planning",
	},
	{
		id: "derive-decoration-plan",
		inputs: {
			composition: stepOutput("plan-composition", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		kind: "deterministic",
		layer: "compose",
		message: "Decorating sections…",
		output: contract("decoration-plan-result"),
	},
	{
		id: "select-pattern",
		inputs: {
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: refs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		kind: "ai",
		layer: "compose",
		message: "Selecting layout patterns…",
		output: contract("pattern-selection"),
		taskKind: "pattern-selection",
	},
	{
		id: "generate-render-tree",
		inputs: {
			componentCatalogs: refs.componentCatalogs,
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: refs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			pattern: stepOutput("select-pattern", "result"),
			skillBundles: refs.skillBundles,
			source: stepOutput("parse-source", "result"),
		},
		kind: "ai",
		layer: "compose",
		message: "Generating UI draft…",
		output: contract("screen-generation-agent-result"),
		taskKind: "screen-generation",
	},
	{
		id: "validate-render-tree",
		inputs: {
			componentCatalogs: refs.componentCatalogs,
			target: stepOutput("generate-render-tree", "result"),
		},
		kind: "validation",
		layer: "revise",
		message: "Validating render tree…",
		output: contract("validation-report"),
	},
	{
		id: "propose-components",
		inputs: {
			candidate: stepOutput("generate-render-tree", "result"),
			componentCatalogs: refs.componentCatalogs,
			designContextBundles: refs.designContextBundles,
			validation: stepOutput("validate-render-tree", "result"),
		},
		kind: "ai",
		layer: "revise",
		message: "Checking component proposals…",
		output: contract("component-proposal"),
		taskKind: "component-proposal",
	},
	{
		id: "review-quality",
		inputs: {
			candidate: stepOutput("generate-render-tree", "result"),
			componentCatalogs: refs.componentCatalogs,
			designContextBundles: refs.designContextBundles,
			validation: stepOutput("validate-render-tree", "result"),
		},
		kind: "ai",
		layer: "revise",
		message: "Reviewing quality…",
		output: contract("quality-inspection"),
		taskKind: "quality-review",
	},
	{
		id: "revise-render-tree-if-invalid",
		inputs: {
			componentCatalogs: refs.componentCatalogs,
			designContextBundles: refs.designContextBundles,
			generation: stepOutput("generate-render-tree", "result"),
			quality: stepOutput("review-quality", "result"),
			validation: stepOutput("validate-render-tree", "result"),
		},
		kind: "ai",
		layer: "revise",
		message: "Revising draft if needed…",
		output: contract("screen-generation-agent-result"),
		skipPolicy: "requires-revision-request",
		taskKind: "screen-revision",
	},
	{
		id: "validate-render-tree-after-revision",
		inputs: {
			componentCatalogs: refs.componentCatalogs,
			target: stepOutput("revise-render-tree-if-invalid", "result"),
		},
		kind: "validation",
		layer: "revise",
		message: "Validating revised draft…",
		output: contract("validation-report"),
		skipPolicy: "requires-revision-result",
	},
	{
		id: "write-artifacts",
		kind: "effect",
		layer: "revise",
		message: "Writing review artifacts…",
		output: contract("pipeline-artifact-write-result"),
		skipPolicy: "continue-after-parse-failure",
	},
] as const satisfies readonly ScreenGenerationStageDescriptor[];

export const SCREEN_GENERATION_LAYER_ORDER = ["understand", "compose", "revise"] as const;

export const SCREEN_GENERATION_LAYER_LABELS = {
	compose: "Compose",
	revise: "Revise",
	understand: "Understand",
} as const satisfies Record<ScreenGenerationLayer, string>;

const SCREEN_GENERATION_LAYER_ARTIFACTS = {
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

const SCREEN_GENERATION_LAYER_TRACE_KEYS = {
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
	revise: [
		"initialValidationReport",
		"componentProposal",
		"qualityReview",
		"revisionDecision",
		"revision",
	],
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

export function getScreenGenerationStageOrder(): PipelineStageId[] {
	return SCREEN_GENERATION_STAGE_DESCRIPTORS.map((stage) => stage.id);
}

export function getScreenGenerationStageDescriptor(
	stageId: PipelineStageId,
): ScreenGenerationStageDescriptor {
	const descriptor = SCREEN_GENERATION_STAGE_DESCRIPTORS.find((stage) => stage.id === stageId);
	if (!descriptor) throw new Error(`Unknown screen-generation stage: ${stageId}`);
	return descriptor;
}

export function getScreenGenerationStagesByKind(
	kind: ScreenGenerationStageKind,
): PipelineStageId[] {
	return SCREEN_GENERATION_STAGE_DESCRIPTORS.filter((stage) => stage.kind === kind).map(
		(stage) => stage.id,
	);
}

export function isScreenGenerationAiStageDescriptor(stageId: PipelineStageId | string): boolean {
	return SCREEN_GENERATION_STAGE_DESCRIPTORS.some(
		(stage) => stage.id === stageId && stage.kind === "ai",
	);
}

export function getScreenGenerationStageLayer(stageId: PipelineStageId): ScreenGenerationLayer {
	return getScreenGenerationStageDescriptor(stageId).layer;
}

export function getScreenGenerationStageMessage(stageId: PipelineStageId): string {
	return getScreenGenerationStageDescriptor(stageId).message;
}

export function createScreenGenerationStageLayers(
	artifact: (fileName: string) => string = (fileName) => fileName,
): ScreenGenerationStageLayerGroup[] {
	return SCREEN_GENERATION_LAYER_ORDER.map((layer) => ({
		artifacts: SCREEN_GENERATION_LAYER_ARTIFACTS[layer].map(artifact),
		label: SCREEN_GENERATION_LAYER_LABELS[layer],
		layer,
		previewArtifact: readPreviewArtifact(layer, artifact),
		stages: SCREEN_GENERATION_STAGE_DESCRIPTORS.filter((stage) => stage.layer === layer).map(
			(stage) => stage.id,
		),
		traceKeys: [...SCREEN_GENERATION_LAYER_TRACE_KEYS[layer]],
	}));
}

function readPreviewArtifact(
	layer: ScreenGenerationLayer,
	artifact: (fileName: string) => string,
): string | undefined {
	if (layer === "compose") return artifact(SCREEN_GENERATION_ARTIFACT_FILES.agentResult);
	if (layer === "revise") return artifact(SCREEN_GENERATION_ARTIFACT_FILES.finalResult);
	return undefined;
}
