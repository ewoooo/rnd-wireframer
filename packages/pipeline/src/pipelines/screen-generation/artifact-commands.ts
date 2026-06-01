import path from "node:path";
import type { SideEffectCommand } from "@cx/pipeline/types";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";

export type GenerationSmokeArtifactInput = {
	agentInput: unknown;
	agentResult: unknown;
	compositionPlanAgentInput?: unknown;
	compositionPlanAgentResult?: unknown;
	compositionPlanRunnerRequest?: unknown;
	componentProposalAgentInput?: unknown;
	componentProposalAgentResult?: unknown;
	componentProposalRunnerRequest?: unknown;
	componentProposalValidationReport?: unknown;
	componentProposal?: unknown;
	designCritique?: unknown;
	decorationPlan?: unknown;
	designContextBundleSelection?: unknown;
	designSkillSelection?: unknown;
	finalResult: unknown;
	generationSkillCatalog?: unknown;
	initialValidationReport?: unknown;
	outDir: string;
	parseCommandResult: unknown;
	patternLayerCandidates?: unknown;
	patternSelectionAgentInput?: unknown;
	patternSelectionAgentResult?: unknown;
	patternSelectionRunnerRequest?: unknown;
	qualityReviewAgentInput?: unknown;
	qualityReviewAgentResult?: unknown;
	qualityReviewRunnerRequest?: unknown;
	revisionDecision?: unknown;
	revisionAgentInput?: unknown;
	revisionAgentResult?: unknown;
	revisionRunnerRequest?: unknown;
	renderTreeGenerationSkill?: unknown;
	runnerRequest: unknown;
	screenIntentAgentInput?: unknown;
	screenIntentAgentResult?: unknown;
	screenIntentRunnerRequest?: unknown;
	sourceSpec: unknown;
	validationReport: unknown;
};

/**
 * Result artifacts kept as standalone files (per-stage outputs + render target).
 * All other intermediate data (agent inputs, runner requests, candidates, skills,
 * decision/selection scaffolding) is consolidated into a single trace.json.
 * Consumers read these via manifest pointers, not hardcoded names.
 */
export const ARTIFACT_FILES = {
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

export const ARTIFACT_LAYER_GROUPS = {
	understand: {
		artifacts: [ARTIFACT_FILES.sourceSpec, ARTIFACT_FILES.screenIntent],
		traceKeys: ["parseResult", "screenIntent"],
	},
	compose: {
		artifacts: [
			ARTIFACT_FILES.compositionPlan,
			ARTIFACT_FILES.decorationPlan,
			ARTIFACT_FILES.patternSelection,
			ARTIFACT_FILES.agentResult,
			ARTIFACT_FILES.componentProposal,
		],
		traceKeys: [
			"composition",
			"designSkillSelection",
			"patternLayerCandidates",
			"patternSelection",
			"designContextBundleSelection",
			"generation",
			"generationSkillCatalog",
			"renderTreeGenerationSkill",
			"componentProposal",
		],
	},
	revise: {
		artifacts: [
			ARTIFACT_FILES.validationReport,
			ARTIFACT_FILES.qualityReview,
			ARTIFACT_FILES.finalResult,
			ARTIFACT_FILES.pipelineResult,
		],
		traceKeys: ["initialValidationReport", "qualityReview", "revisionDecision", "revision"],
	},
} as const;

export function createGenerationSmokeArtifactCommands(
	input: GenerationSmokeArtifactInput,
): SideEffectCommand[] {
	return [
		// Per-stage result artifacts (standalone files).
		createWriteCommand(
			"write-source-spec",
			input.outDir,
			ARTIFACT_FILES.sourceSpec,
			input.sourceSpec,
		),
		createWriteCommand(
			"write-screen-intent",
			input.outDir,
			ARTIFACT_FILES.screenIntent,
			input.screenIntentAgentResult,
		),
		createWriteCommand(
			"write-composition-plan",
			input.outDir,
			ARTIFACT_FILES.compositionPlan,
			input.compositionPlanAgentResult,
		),
		createWriteCommand(
			"write-decoration-plan",
			input.outDir,
			ARTIFACT_FILES.decorationPlan,
			input.decorationPlan,
		),
		createWriteCommand(
			"write-pattern-selection",
			input.outDir,
			ARTIFACT_FILES.patternSelection,
			input.patternSelectionAgentResult,
		),
		createWriteCommand(
			"write-agent-result",
			input.outDir,
			ARTIFACT_FILES.agentResult,
			input.agentResult,
		),
		createWriteCommand(
			"write-final-result",
			input.outDir,
			ARTIFACT_FILES.finalResult,
			input.finalResult,
		),
		createWriteCommand(
			"write-validation-report",
			input.outDir,
			ARTIFACT_FILES.validationReport,
			input.validationReport,
		),
		createWriteCommand(
			"write-quality-review",
			input.outDir,
			ARTIFACT_FILES.qualityReview,
			input.qualityReviewAgentResult ?? input.designCritique,
		),
		createWriteCommand(
			"write-component-proposal",
			input.outDir,
			ARTIFACT_FILES.componentProposal,
			input.componentProposal ?? input.componentProposalAgentResult,
		),
		// Consolidated debug trace (inputs, runner requests, intermediate scaffolding).
		createWriteCommand("write-trace", input.outDir, ARTIFACT_FILES.trace, buildTrace(input)),
	];
}

function buildTrace(input: GenerationSmokeArtifactInput): Record<string, unknown> {
	return {
		layers: ARTIFACT_LAYER_GROUPS,
		parseResult: input.parseCommandResult,
		screenIntent: {
			input: input.screenIntentAgentInput,
			runnerRequest: input.screenIntentRunnerRequest,
		},
		composition: {
			input: input.compositionPlanAgentInput,
			runnerRequest: input.compositionPlanRunnerRequest,
		},
		designSkillSelection: input.designSkillSelection,
		patternLayerCandidates: input.patternLayerCandidates,
		patternSelection: {
			input: input.patternSelectionAgentInput,
			runnerRequest: input.patternSelectionRunnerRequest,
		},
		designContextBundleSelection: input.designContextBundleSelection,
		generation: {
			input: input.agentInput,
			runnerRequest: input.runnerRequest,
		},
		generationSkillCatalog: input.generationSkillCatalog,
		renderTreeGenerationSkill: input.renderTreeGenerationSkill,
		initialValidationReport: input.initialValidationReport,
		qualityReview: {
			input: input.qualityReviewAgentInput,
			runnerRequest: input.qualityReviewRunnerRequest,
		},
		revisionDecision: input.revisionDecision,
		revision: {
			input: input.revisionAgentInput,
			runnerRequest: input.revisionRunnerRequest,
		},
		componentProposal: {
			input: input.componentProposalAgentInput,
			runnerRequest: input.componentProposalRunnerRequest,
			validationReport: input.componentProposalValidationReport,
		},
	};
}

export function createGenerationSmokeManifestCommand(input: {
	manifest: SmokeRunManifest;
	runDir: string;
}): SideEffectCommand {
	return createWriteCommand(
		"write-smoke-run-manifest",
		input.runDir,
		"manifest.json",
		input.manifest,
	);
}

export function createGenerationSmokePipelineResultCommands(input: {
	outDir: string;
	pipelineResult: unknown;
}): SideEffectCommand[] {
	return [
		createWriteCommand(
			"write-pipeline-result",
			input.outDir,
			ARTIFACT_FILES.pipelineResult,
			input.pipelineResult,
		),
	];
}

function createWriteCommand(
	id: string,
	outDir: string,
	fileName: string,
	content: unknown,
): SideEffectCommand {
	return {
		id,
		input: {
			content: content ?? null,
			targetPath: path.join(outDir, fileName),
		},
		operation: "versioned-artifact-write",
	};
}
