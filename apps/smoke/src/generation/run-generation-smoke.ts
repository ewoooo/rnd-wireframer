import { createNodePipelineAdapters, runSideEffects } from "@cx/pipeline";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";
import type {
	PipelineMarkdownSourceFile,
	SideEffectCommandResult,
	SideEffectExecutionResult,
} from "@cx/pipeline/types";
import type { SourceSpec, ValidationReportContract } from "@cx/schema";

import {
	createGenerationSmokeArtifactCommands,
	createGenerationSmokePipelineResultCommands,
} from "./artifact-commands";
import {
	createSmokeOutDir,
	createSmokeRunId,
	normalizeSmokeOutDir,
	normalizeSmokeTargetPath,
	resolveSmokeSourceKind,
} from "./paths";
import { runGenerationPlan } from "./plan-executor";
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
	const runId = options.runId ?? createSmokeRunId(sourcePath);
	const outDir = options.outDir ? normalizeSmokeOutDir(options.outDir) : createSmokeOutDir(runId);
	const sourceKind = resolveSmokeSourceKind(sourcePath);
	const sourceReadResult = await readSmokeSourceArtifact({
		runId,
		sourceKind,
		sourcePath,
	});
	const sourceFile = getSourceFileFromReadResult(sourceReadResult, sourceKind, sourcePath);

	const parseCommandResult = runParseMarkdownSourceCommand({
		files: [sourceFile],
		importId: runId,
		receivedAt: "1970-01-01T00:00:00.000Z",
	});

	if (!parseCommandResult.parseResult.ok) {
		const pipelineResult = await runSideEffects({
			adapters: createNodePipelineAdapters(),
			commands: createGenerationSmokeArtifactCommands({
				agentInput: undefined,
				agentResult: undefined,
				initialValidationReport: undefined,
				outDir,
				parseCommandResult,
				revisionAgentInput: undefined,
				revisionAgentResult: undefined,
				revisionRunnerRequest: undefined,
				runnerRequest: undefined,
				sourceSpec: parseCommandResult.parseResult.sourceSpec,
				validationReport: undefined,
			}),
			mode: "commit",
			runId,
		});
		const pipelineResultWrite = await runSideEffects({
			adapters: createNodePipelineAdapters(),
			commands: createGenerationSmokePipelineResultCommands({
				outDir,
				pipelineResult,
			}),
			mode: "commit",
			runId,
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
			pipelineResult,
			pipelineResultWrite,
			runId,
			sourcePath,
			sourceSpec: parseCommandResult.parseResult.sourceSpec,
			summary,
		};
	}

	const sourceSpec = parseCommandResult.parseResult.sourceSpec;
	const generationRun = await runGenerationPlan({
		options,
		outDir,
		parseCommandResult,
		runId,
		sourceSpec,
	});
	const summary = createGenerationSmokeSummary({
		agentResult: generationRun.agentResult,
		outDir,
		parseCommandResult,
		sourcePath,
		validationReport: generationRun.validationReport,
	});

	return {
		agentInput: generationRun.agentInput,
		agentResult: generationRun.agentResult,
		initialValidationReport: generationRun.initialValidationReport,
		outDir,
		parseCommandResult,
		pipelineResult: generationRun.pipelineResult,
		pipelineResultWrite: generationRun.pipelineResultWrite,
		revisionAgentInput: generationRun.revisionAgentInput,
		revisionAgentResult: generationRun.revisionAgentResult,
		revisionRunnerRequest: generationRun.revisionRunnerRequest,
		runId,
		runnerRequest: generationRun.runnerRequest,
		sourcePath,
		sourceSpec,
		summary,
		validationReport: generationRun.validationReport,
	};
}

async function readSmokeSourceArtifact(input: {
	runId: string;
	sourceKind: PipelineMarkdownSourceFile["kind"];
	sourcePath: string;
}): Promise<SideEffectExecutionResult> {
	const result = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			{
				id: "read-source-markdown",
				input: {
					kind: input.sourceKind,
					path: input.sourcePath,
				},
				operation: "source-artifact-read",
			},
		],
		mode: "commit",
		runId: input.runId,
	});

	if (!result.ok) {
		throw new Error(`Smoke source read failed: ${input.sourcePath}`);
	}

	return result;
}

function getSourceFileFromReadResult(
	result: SideEffectExecutionResult,
	sourceKind: PipelineMarkdownSourceFile["kind"],
	sourcePath: string,
): PipelineMarkdownSourceFile {
	const readResult = result.commands?.[0];
	const output = readResult ? getSourceReadOutput(readResult) : undefined;

	if (!output) {
		throw new Error(`Smoke source read did not return content: ${sourcePath}`);
	}

	return {
		content: output.content,
		kind: output.kind ?? sourceKind,
		path: output.path,
	};
}

function getSourceReadOutput(
	result: SideEffectCommandResult,
): Pick<PipelineMarkdownSourceFile, "content" | "kind" | "path"> | undefined {
	if (!isSourceReadOutput(result.output)) return undefined;
	return result.output;
}

function isSourceReadOutput(
	output: unknown,
): output is Pick<PipelineMarkdownSourceFile, "content" | "kind" | "path"> {
	if (!output || typeof output !== "object") return false;

	const candidate = output as Partial<PipelineMarkdownSourceFile>;
	return typeof candidate.content === "string" && typeof candidate.path === "string";
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
		areaCount: sourceSpec ? countSourceAreas(sourceSpec) : 0,
		componentCount: sourceSpec ? countSourceComponents(sourceSpec) : 0,
		ok: input.parseCommandResult.ok,
		outDir: input.outDir,
		screenCode: screen?.screenCode,
		session: input.agentResult?.session,
		sourcePath: input.sourcePath,
		validationOk: input.validationReport?.ok,
	};
}

function countSourceAreas(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) => count + region.children.length,
		0,
	);
}

function countSourceComponents(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) =>
			count + region.children.reduce((areaCount, area) => areaCount + area.children.length, 0),
		0,
	);
}
