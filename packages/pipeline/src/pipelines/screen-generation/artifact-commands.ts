import path from "node:path";
import type { SideEffectCommand } from "@cx/pipeline/types";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";

export type GenerationSmokeArtifactInput = {
	agentInput: unknown;
	agentResult: unknown;
	compositionPlanAgentInput?: unknown;
	compositionPlanAgentResult?: unknown;
	compositionPlanRunnerRequest?: unknown;
	designContextBundleSelection?: unknown;
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

export function createGenerationSmokeArtifactCommands(
	input: GenerationSmokeArtifactInput,
): SideEffectCommand[] {
	return [
		createWriteCommand(
			"write-parse-result",
			input.outDir,
			"01-parse-result.json",
			input.parseCommandResult,
		),
		createWriteCommand("write-source-spec", input.outDir, "02-source-spec.json", input.sourceSpec),
		createWriteCommand(
			"write-screen-intent-agent-input",
			input.outDir,
			"03-screen-intent-agent-input.json",
			input.screenIntentAgentInput,
		),
		createWriteCommand(
			"write-screen-intent-agent-runner-request",
			input.outDir,
			"04-screen-intent-agent-runner-request.json",
			input.screenIntentRunnerRequest,
		),
		createWriteCommand(
			"write-screen-intent-agent-result",
			input.outDir,
			"05-screen-intent-agent-result.json",
			input.screenIntentAgentResult,
		),
		createWriteCommand(
			"write-pattern-layer-candidates",
			input.outDir,
			"06-pattern-layer-candidates.json",
			input.patternLayerCandidates,
		),
		createWriteCommand(
			"write-composition-plan-agent-input",
			input.outDir,
			"07-composition-plan-agent-input.json",
			input.compositionPlanAgentInput,
		),
		createWriteCommand(
			"write-composition-plan-agent-runner-request",
			input.outDir,
			"08-composition-plan-agent-runner-request.json",
			input.compositionPlanRunnerRequest,
		),
		createWriteCommand(
			"write-composition-plan-agent-result",
			input.outDir,
			"09-composition-plan-agent-result.json",
			input.compositionPlanAgentResult,
		),
		createWriteCommand(
			"write-pattern-selection-agent-input",
			input.outDir,
			"10-pattern-selection-agent-input.json",
			input.patternSelectionAgentInput,
		),
		createWriteCommand(
			"write-pattern-selection-agent-runner-request",
			input.outDir,
			"11-pattern-selection-agent-runner-request.json",
			input.patternSelectionRunnerRequest,
		),
		createWriteCommand(
			"write-pattern-selection-agent-result",
			input.outDir,
			"12-pattern-selection-agent-result.json",
			input.patternSelectionAgentResult,
		),
		createWriteCommand(
			"write-design-context-bundle-selection",
			input.outDir,
			"13-design-context-bundle-selection.json",
			input.designContextBundleSelection,
		),
		createWriteCommand(
			"write-generation-skill-catalog",
			input.outDir,
			"14-generation-skill-catalog.json",
			input.generationSkillCatalog,
		),
		createWriteCommand(
			"write-render-tree-generation-skill",
			input.outDir,
			"15-render-tree-generation-skill.json",
			input.renderTreeGenerationSkill,
		),
		createWriteCommand("write-agent-input", input.outDir, "16-agent-input.json", input.agentInput),
		createWriteCommand(
			"write-agent-runner-request",
			input.outDir,
			"17-agent-runner-request.json",
			input.runnerRequest,
		),
		createWriteCommand(
			"write-agent-result",
			input.outDir,
			"18-agent-result.json",
			input.agentResult,
		),
		createWriteCommand(
			"write-initial-validation-report",
			input.outDir,
			"19-initial-validation-report.json",
			input.initialValidationReport,
		),
		createWriteCommand(
			"write-quality-review-agent-input",
			input.outDir,
			"20-quality-review-agent-input.json",
			input.qualityReviewAgentInput,
		),
		createWriteCommand(
			"write-quality-review-agent-runner-request",
			input.outDir,
			"21-quality-review-agent-runner-request.json",
			input.qualityReviewRunnerRequest,
		),
		createWriteCommand(
			"write-quality-review-agent-result",
			input.outDir,
			"22-quality-review-agent-result.json",
			input.qualityReviewAgentResult,
		),
		createWriteCommand(
			"write-revision-decision",
			input.outDir,
			"23-revision-decision.json",
			input.revisionDecision,
		),
		createWriteCommand(
			"write-revision-agent-input",
			input.outDir,
			"24-revision-agent-input.json",
			input.revisionAgentInput,
		),
		createWriteCommand(
			"write-revision-agent-runner-request",
			input.outDir,
			"25-revision-agent-runner-request.json",
			input.revisionRunnerRequest,
		),
		createWriteCommand(
			"write-revision-agent-result",
			input.outDir,
			"26-revision-agent-result.json",
			input.revisionAgentResult,
		),
		createWriteCommand("write-final-result", input.outDir, "final-result.json", input.finalResult),
		createWriteCommand(
			"write-validation-report",
			input.outDir,
			"27-validation-report.json",
			input.validationReport,
		),
	];
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
			"28-pipeline-result.json",
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
