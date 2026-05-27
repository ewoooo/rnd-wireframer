import path from "node:path";

import { createNodePipelineAdapters, runSideEffects } from "@cx/pipeline";
import type { SideEffectCommand, SideEffectExecutionResult } from "@cx/pipeline/types";

export type GenerationSmokeArtifactInput = {
	agentInput: unknown;
	agentResult: unknown;
	outDir: string;
	parseCommandResult: unknown;
	pipelineRunId: string;
	runnerRequest: unknown;
	sourceSpec: unknown;
};

export type GenerationSmokeArtifactResult = {
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
};

export async function writeGenerationSmokeArtifacts(
	input: GenerationSmokeArtifactInput,
): Promise<GenerationSmokeArtifactResult> {
	const commands = createGenerationSmokeArtifactCommands(input);

	const pipelineResult = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands,
		mode: "commit",
		runId: input.pipelineRunId,
	});

	const pipelineResultWrite = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			createWriteCommand(
				"write-pipeline-result",
				input.outDir,
				"pipeline-result.json",
				pipelineResult,
			),
		],
		mode: "commit",
		runId: input.pipelineRunId,
	});

	return { pipelineResult, pipelineResultWrite };
}

function createGenerationSmokeArtifactCommands(
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
