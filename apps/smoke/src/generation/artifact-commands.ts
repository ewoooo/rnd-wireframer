import path from "node:path";

import type { SideEffectCommand } from "@cx/pipeline/types";

export type GenerationSmokeArtifactInput = {
	agentInput: unknown;
	agentResult: unknown;
	initialValidationReport?: unknown;
	outDir: string;
	parseCommandResult: unknown;
	revisionAgentInput?: unknown;
	revisionAgentResult?: unknown;
	revisionRunnerRequest?: unknown;
	runnerRequest: unknown;
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
			"parse-result.json",
			input.parseCommandResult,
		),
		createWriteCommand("write-source-spec", input.outDir, "source-spec.json", input.sourceSpec),
		createWriteCommand("write-agent-input", input.outDir, "agent-input.json", input.agentInput),
		createWriteCommand(
			"write-agent-runner-request",
			input.outDir,
			"agent-runner-request.json",
			input.runnerRequest,
		),
		createWriteCommand("write-agent-result", input.outDir, "agent-result.json", input.agentResult),
		createWriteCommand(
			"write-initial-validation-report",
			input.outDir,
			"initial-validation-report.json",
			input.initialValidationReport,
		),
		createWriteCommand(
			"write-revision-agent-input",
			input.outDir,
			"revision-agent-input.json",
			input.revisionAgentInput,
		),
		createWriteCommand(
			"write-revision-agent-runner-request",
			input.outDir,
			"revision-agent-runner-request.json",
			input.revisionRunnerRequest,
		),
		createWriteCommand(
			"write-revision-agent-result",
			input.outDir,
			"revision-agent-result.json",
			input.revisionAgentResult,
		),
		createWriteCommand(
			"write-validation-report",
			input.outDir,
			"validation-report.json",
			input.validationReport,
		),
	];
}

export function createGenerationSmokePipelineResultCommands(input: {
	outDir: string;
	pipelineResult: unknown;
}): SideEffectCommand[] {
	return [
		createWriteCommand(
			"write-pipeline-result",
			input.outDir,
			"pipeline-result.json",
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
