import { readFile } from "node:fs/promises";

import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunnerRequest } from "@cx/agent/contract";
import { componentCatalog } from "@cx/components/catalog";
import { buildScreenGenerationAgentInput } from "@cx/orchestration";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";
import { SCHEMA_VERSION, type ValidationReportContract } from "@cx/schema";
import { validateRenderTree, validateSchemaArtifact } from "@cx/validation";

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
			validationReport: undefined,
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
	const validationReport = createRenderTreeValidationReport(agentResult.payload);

	const artifactResult = await writeGenerationSmokeArtifacts({
		agentInput,
		agentResult,
		outDir,
		parseCommandResult,
		pipelineRunId: runId,
		runnerRequest,
		sourceSpec,
		validationReport,
	});
	const summary = createGenerationSmokeSummary({
		agentResult,
		outDir,
		parseCommandResult,
		sourcePath,
		validationReport,
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
		validationReport,
	};
}

function createGenerationSmokeSummary(input: {
	agentResult: GenerationSmokeResult["agentResult"];
	outDir: string;
	parseCommandResult: GenerationSmokeResult["parseCommandResult"];
	sourcePath: string;
	validationReport?: ValidationReportContract;
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
		validationOk: input.validationReport?.ok,
	};
}

function createRenderTreeValidationReport(payload: unknown): ValidationReportContract {
	const schemaReport = validateSchemaArtifact("render-tree", payload);
	const semanticReport = validateRenderTree(payload, { componentCatalog });
	const issues = [...schemaReport.issues, ...semanticReport.issues];
	const errorCount = issues.filter((issue) => issue.severity === "error").length;
	const warningCount = issues.filter((issue) => issue.severity === "warning").length;

	return {
		issues,
		ok: errorCount === 0,
		schemaVersion: SCHEMA_VERSION.validationReport,
		summary: {
			errorCount,
			warningCount,
		},
		target: "render-tree",
	};
}
