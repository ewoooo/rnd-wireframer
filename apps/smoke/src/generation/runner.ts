import { readFile } from "node:fs/promises";

import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunnerRequest } from "@cx/agent/contract";
import { buildScreenGenerationAgentInput } from "@cx/orchestration";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";

import { writeGenerationSmokeArtifacts } from "./artifacts";
import { createFakeGenerationAgentRunner } from "./fake-agent-runner";
import {
	createSmokeOutDir,
	createSmokeRunId,
	normalizeSmokeOutDir,
	normalizeSmokeTargetPath,
	resolveSmokeSourceKind,
} from "./paths";
import type {
	GenerationSmokeOptions,
	GenerationSmokeResult,
	GenerationSmokeSummary,
} from "./types";

export async function runGenerationSmoke(
	target: string,
	options: GenerationSmokeOptions = {},
): Promise<GenerationSmokeResult> {
	const sourcePath = normalizeSmokeTargetPath(target);
	const content = await readFile(sourcePath, "utf8");
	const runId = options.runId ?? createSmokeRunId(sourcePath);
	const outDir = options.outDir ? normalizeSmokeOutDir(options.outDir) : createSmokeOutDir(runId);

	const parseCommandResult = runParseMarkdownSourceCommand({
		files: [
			{
				content,
				kind: resolveSmokeSourceKind(sourcePath),
				path: sourcePath,
			},
		],
		importId: runId,
		receivedAt: "1970-01-01T00:00:00.000Z",
	});

	if (!parseCommandResult.parseResult.ok) {
		const artifactResult = await writeGenerationSmokeArtifacts({
			agentInput: undefined,
			agentResult: undefined,
			outDir,
			parseCommandResult,
			pipelineRunId: runId,
			runnerRequest: undefined,
			sourceSpec: parseCommandResult.parseResult.sourceSpec,
		});
		const summary = createGenerationSmokeSummary({
			agentResult: undefined,
			outDir,
			parseCommandResult,
			sourcePath,
		});

		return {
			outDir,
			parseCommandResult,
			pipelineResult: artifactResult.pipelineResult,
			pipelineResultWrite: artifactResult.pipelineResultWrite,
			runId,
			sourcePath,
			sourceSpec: parseCommandResult.parseResult.sourceSpec,
			summary,
		};
	}

	const sourceSpec = parseCommandResult.parseResult.sourceSpec;
	const agentInput = buildScreenGenerationAgentInput(sourceSpec);
	let runnerRequest: AgentRunnerRequest | undefined;
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner: options.useAI
			? async (request) => {
					runnerRequest = request;
					return realRunner(request);
				}
			: createFakeGenerationAgentRunner({
					agentInput,
					onRequest: (request) => {
						runnerRequest = request;
					},
				}),
	});

	const agentResult = await runAgentQuery(runtime, {
		context: agentInput.context,
		query: agentInput.query,
		taskKind: "screen-generation",
	});

	const artifactResult = await writeGenerationSmokeArtifacts({
		agentInput,
		agentResult,
		outDir,
		parseCommandResult,
		pipelineRunId: runId,
		runnerRequest,
		sourceSpec,
	});
	const summary = createGenerationSmokeSummary({
		agentResult,
		outDir,
		parseCommandResult,
		sourcePath,
	});

	return {
		agentInput,
		agentResult,
		outDir,
		parseCommandResult,
		pipelineResult: artifactResult.pipelineResult,
		pipelineResultWrite: artifactResult.pipelineResultWrite,
		runId,
		runnerRequest,
		sourcePath,
		sourceSpec,
		summary,
	};
}

function createGenerationSmokeSummary(input: {
	agentResult: GenerationSmokeResult["agentResult"];
	outDir: string;
	parseCommandResult: GenerationSmokeResult["parseCommandResult"];
	sourcePath: string;
}): GenerationSmokeSummary {
	const sourceSpec = input.parseCommandResult.parseResult.sourceSpec;
	const screen = sourceSpec?.sourceShape.screen;

	return {
		agentPayload: input.agentResult?.payload,
		areaCount: screen?.areas.length ?? 0,
		componentCount: sourceSpec?.sourceShape.components.length ?? 0,
		ok: input.parseCommandResult.ok,
		outDir: input.outDir,
		screenCode: screen?.screenCode,
		session: input.agentResult?.session,
		sourcePath: input.sourcePath,
	};
}
