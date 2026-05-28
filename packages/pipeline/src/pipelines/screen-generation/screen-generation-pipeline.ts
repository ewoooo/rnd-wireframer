import path from "node:path";
import { fileURLToPath } from "node:url";

import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import { componentCatalog } from "@cx/components/catalog";
import {
	buildPatternSelectionAgentInput,
	buildScreenGenerationAgentInput,
	buildScreenRevisionAgentInput,
} from "@cx/orchestration";
import type {
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	ScreenGenerationAgentInput,
	ScreenRevisionAgentInput,
} from "@cx/orchestration/types";
import { SCHEMA_VERSION, type SourceSpec, type ValidationReportContract } from "@cx/schema";
import {
	validateRenderTree,
	validateSchemaArtifact,
	validateTableGenerationResult,
} from "@cx/validation";

import { createNodePipelineAdapters } from "../../adapters";
import { runParseMarkdownSourceCommand } from "../../commands";
import type {
	PipelineDefinition,
	PipelineMarkdownSourceFile,
	PipelineRunResult,
	PipelineStageId,
	ScreenGenerationPipelineOptions,
	SideEffectCommandResult,
	SideEffectExecutionResult,
} from "../../public/types";
import { runSideEffects } from "../../runner";
import {
	createGenerationSmokeArtifactCommands,
	createGenerationSmokePipelineResultCommands,
} from "./artifact-commands";
import { createFakeGenerationAgentRunner } from "./fake-agent-runner";
import { resolveSmokePatternLayerCandidates } from "./pattern-layer-candidates";
import {
	findGenerationSkill,
	type GenerationSkill,
	loadGenerationSkillCatalog,
} from "./skill-catalog";

const CLIENT_IMPORT_ROOT = "data/client-imports";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");

export const screenGenerationPipelineDefinition = {
	id: "screen-generation",
	stages: [
		"read-source",
		"parse-source",
		"select-pattern",
		"generate-render-tree",
		"validate-render-tree",
		"revise-render-tree-if-invalid",
		"validate-render-tree-after-revision",
		"write-artifacts",
	],
} as const satisfies PipelineDefinition;

type ScreenGenerationPipelineState = {
	agentInput?: ScreenGenerationAgentInput;
	agentResult?: AgentRunResult;
	generationSkillCatalog?: GenerationSkill[];
	initialValidationReport?: ValidationReportContract;
	options: NormalizedScreenGenerationPipelineOptions;
	parseCommandResult?: ReturnType<typeof runParseMarkdownSourceCommand>;
	patternLayerCandidates?: PatternLayerCandidate[];
	patternSelectionAgentInput?: PatternSelectionAgentInput;
	patternSelectionAgentResult?: AgentRunResult;
	patternSelectionRunnerRequest?: AgentRunnerRequest;
	pipelineResult?: SideEffectExecutionResult;
	pipelineResultWrite?: SideEffectExecutionResult;
	revisionAgentInput?: ScreenRevisionAgentInput;
	revisionAgentResult?: AgentRunResult;
	revisionRunnerRequest?: AgentRunnerRequest;
	renderTreeGenerationSkill?: GenerationSkill;
	runnerRequest?: AgentRunnerRequest;
	sourceFile?: PipelineMarkdownSourceFile;
	sourceReadResult?: SideEffectExecutionResult;
	sourceSpec?: SourceSpec;
	validationReport?: ValidationReportContract;
};

type NormalizedScreenGenerationPipelineOptions = {
	agentMode: "claude-local-first" | "fake";
	outDir: string;
	runId: string;
	sourceKind: PipelineMarkdownSourceFile["kind"];
	sourcePath: string;
};

type ScreenGenerationStageExecutor = (state: ScreenGenerationPipelineState) => Promise<void> | void;

const screenGenerationStageExecutors = {
	"generate-render-tree": runGenerateRenderTreeStage,
	"parse-source": runParseSourceStage,
	"read-source": runReadSourceStage,
	"revise-render-tree-if-invalid": runReviseRenderTreeIfInvalidStage,
	"select-pattern": runSelectPatternStage,
	"validate-render-tree": runValidateRenderTreeStage,
	"validate-render-tree-after-revision": runValidateRenderTreeStage,
	"write-artifacts": runWriteArtifactsStage,
} satisfies Record<PipelineStageId, ScreenGenerationStageExecutor>;

export async function runScreenGenerationPipeline(
	definition: PipelineDefinition,
	options: ScreenGenerationPipelineOptions,
): Promise<PipelineRunResult> {
	const state: ScreenGenerationPipelineState = {
		options: normalizeScreenGenerationPipelineOptions(options),
	};

	for (const stage of definition.stages) {
		if (
			state.parseCommandResult &&
			!state.parseCommandResult.parseResult.ok &&
			stage !== "write-artifacts"
		) {
			continue;
		}
		await screenGenerationStageExecutors[stage](state);
	}

	if (!state.pipelineResult || !state.pipelineResultWrite || !state.parseCommandResult) {
		throw new Error("Screen generation pipeline finished without artifact write results.");
	}

	return {
		agentInput: state.agentInput,
		agentResult: state.agentResult,
		generationSkillCatalog: state.generationSkillCatalog,
		initialValidationReport: state.initialValidationReport,
		outDir: state.options.outDir,
		parseCommandResult: state.parseCommandResult,
		patternLayerCandidates: state.patternLayerCandidates,
		patternSelectionAgentInput: state.patternSelectionAgentInput,
		patternSelectionAgentResult: state.patternSelectionAgentResult,
		patternSelectionRunnerRequest: state.patternSelectionRunnerRequest,
		pipelineResult: state.pipelineResult,
		pipelineResultWrite: state.pipelineResultWrite,
		revisionAgentInput: state.revisionAgentInput,
		revisionAgentResult: state.revisionAgentResult,
		revisionRunnerRequest: state.revisionRunnerRequest,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
		runId: state.options.runId,
		runnerRequest: state.runnerRequest,
		sourcePath: state.options.sourcePath,
		sourceSpec: state.sourceSpec,
		summary: createScreenGenerationPipelineSummary(state),
		validationReport: state.validationReport,
	};
}

async function runReadSourceStage(state: ScreenGenerationPipelineState): Promise<void> {
	const result = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			{
				id: "read-source-markdown",
				input: {
					kind: state.options.sourceKind,
					path: state.options.sourcePath,
				},
				operation: "source-artifact-read",
			},
		],
		mode: "commit",
		runId: state.options.runId,
	});

	if (!result.ok) {
		throw new Error(`Pipeline source read failed: ${state.options.sourcePath}`);
	}

	state.sourceReadResult = result;
	state.sourceFile = getSourceFileFromReadResult(
		result,
		state.options.sourceKind,
		state.options.sourcePath,
	);
}

function runParseSourceStage(state: ScreenGenerationPipelineState): void {
	if (!state.sourceFile) {
		throw new Error("Cannot parse source before read-source stage.");
	}

	state.parseCommandResult = runParseMarkdownSourceCommand({
		files: [state.sourceFile],
		importId: state.options.runId,
		receivedAt: "1970-01-01T00:00:00.000Z",
	});
	state.sourceSpec = state.parseCommandResult.parseResult.sourceSpec;
}

async function runSelectPatternStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const layerCandidates = resolveSmokePatternLayerCandidates(sourceSpec);
	const patternSelectionInput = buildPatternSelectionAgentInput({
		layerCandidates,
		sourceSpec,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner:
			state.options.agentMode === "claude-local-first"
				? async (request) => {
						state.patternSelectionRunnerRequest = request;
						return realRunner(request);
					}
				: async (request) => {
						state.patternSelectionRunnerRequest = request;
						return {
							payload: createFakePatternSelection(layerCandidates),
							session: {
								mode: request.session?.mode ?? "new",
								sessionId: request.session?.sessionId,
							},
							taskKind: request.taskKind,
						};
					},
	});

	state.patternLayerCandidates = layerCandidates;
	state.patternSelectionAgentInput = patternSelectionInput;
	state.patternSelectionAgentResult = await runAgentQuery(runtime, {
		context: patternSelectionInput.context,
		query: patternSelectionInput.query,
		taskKind: "pattern-selection",
	});
}

async function runGenerateRenderTreeStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	state.generationSkillCatalog ??= await loadGenerationSkillCatalog();
	state.renderTreeGenerationSkill = findGenerationSkill(
		state.generationSkillCatalog,
		"render-tree-generation",
	);
	const agentInput = buildScreenGenerationAgentInput(sourceSpec, {
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner:
			state.options.agentMode === "claude-local-first"
				? async (request) => {
						state.runnerRequest = request;
						return realRunner(request);
					}
				: createFakeGenerationAgentRunner({
						agentInput,
						onRequest: (request) => {
							state.runnerRequest = request;
						},
					}),
	});

	state.agentInput = agentInput;
	state.agentResult = await runAgentQuery(runtime, {
		context: agentInput.context,
		query: agentInput.query,
		taskKind: "screen-generation",
	});
}

function runValidateRenderTreeStage(state: ScreenGenerationPipelineState): void {
	state.validationReport = createRenderTreeValidationReport(state.agentResult?.payload);
	state.initialValidationReport ??= state.validationReport;
}

async function runReviseRenderTreeIfInvalidStage(
	state: ScreenGenerationPipelineState,
): Promise<void> {
	if (state.validationReport?.ok) return;

	const sourceSpec = requireSourceSpec(state);
	const previousCandidate = state.agentResult?.payload;
	const revisionInput = buildScreenRevisionAgentInput({
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		previousCandidate,
		sourceSpec,
		validationReport: state.validationReport,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner:
			state.options.agentMode === "claude-local-first"
				? async (request) => {
						state.revisionRunnerRequest = request;
						return realRunner(request);
					}
				: async (request) => {
						state.revisionRunnerRequest = request;
						return {
							payload: previousCandidate,
							session: {
								mode: request.session?.mode ?? "new",
								sessionId: request.session?.sessionId,
							},
							taskKind: request.taskKind,
						};
					},
	});

	state.revisionAgentInput = revisionInput;
	state.revisionAgentResult = await runAgentQuery(runtime, {
		context: revisionInput.context,
		previousResult: revisionInput.previousResult,
		query: revisionInput.query,
		taskKind: "screen-revision",
	});
	state.agentResult = state.revisionAgentResult;
}

async function runWriteArtifactsStage(state: ScreenGenerationPipelineState): Promise<void> {
	if (!state.parseCommandResult) {
		throw new Error("Cannot write artifacts before parse-source stage.");
	}

	const commands = createGenerationSmokeArtifactCommands({
		agentInput: state.agentInput,
		agentResult: state.agentResult,
		generationSkillCatalog: state.generationSkillCatalog,
		initialValidationReport: state.initialValidationReport,
		outDir: state.options.outDir,
		parseCommandResult: state.parseCommandResult,
		patternLayerCandidates: state.patternLayerCandidates,
		patternSelectionAgentInput: state.patternSelectionAgentInput,
		patternSelectionAgentResult: state.patternSelectionAgentResult,
		patternSelectionRunnerRequest: state.patternSelectionRunnerRequest,
		revisionAgentInput: state.revisionAgentInput,
		revisionAgentResult: state.revisionAgentResult,
		revisionRunnerRequest: state.revisionRunnerRequest,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
		runnerRequest: state.runnerRequest,
		sourceSpec: state.sourceSpec,
		validationReport: state.validationReport,
	});

	state.pipelineResult = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands,
		mode: "commit",
		runId: state.options.runId,
	});
	state.pipelineResultWrite = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: createGenerationSmokePipelineResultCommands({
			outDir: state.options.outDir,
			pipelineResult: state.pipelineResult,
		}),
		mode: "commit",
		runId: state.options.runId,
	});
}

function normalizeScreenGenerationPipelineOptions(
	options: ScreenGenerationPipelineOptions,
): NormalizedScreenGenerationPipelineOptions {
	const source =
		typeof options.source === "string"
			? { path: options.source, type: "file" as const }
			: options.source;
	const sourcePath = normalizeTargetPath(source.path);
	const runId = options.runId ?? createRunId(sourcePath);

	return {
		agentMode: options.agentMode ?? (options.useAI ? "claude-local-first" : "fake"),
		outDir: options.outDir ? normalizeOutDir(options.outDir) : createOutDir(runId),
		runId,
		sourceKind: source.kind ?? resolveSourceKind(sourcePath),
		sourcePath,
	};
}

function normalizeTargetPath(target: string): string {
	if (path.isAbsolute(target)) return target;
	const repoRelativePath = target.startsWith(CLIENT_IMPORT_ROOT)
		? target
		: path.join(CLIENT_IMPORT_ROOT, target);
	return path.resolve(resolveInvocationRoot(), repoRelativePath);
}

function normalizeOutDir(outDir: string): string {
	return path.isAbsolute(outDir) ? outDir : path.resolve(resolveInvocationRoot(), outDir);
}

function resolveSourceKind(targetPath: string): PipelineMarkdownSourceFile["kind"] {
	if (targetPath.includes("/screen/")) return "screen";
	if (targetPath.includes("/area/")) return "area";
	if (targetPath.includes("/component/")) return "component";
	return "unknown";
}

function createRunId(targetPath: string): string {
	return `${path.basename(targetPath).replace(/\.[^.]+$/, "")}-${createTimestamp()}`;
}

function createOutDir(runId: string): string {
	return path.resolve(resolveInvocationRoot(), "tmp", "generation-runs", runId);
}

function createTimestamp(): string {
	return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

function resolveInvocationRoot(): string {
	return process.env.INIT_CWD ?? REPO_ROOT;
}

function requireSourceSpec(state: ScreenGenerationPipelineState): SourceSpec {
	if (!state.sourceSpec) throw new Error("SourceSpec is required for this pipeline stage.");
	return state.sourceSpec;
}

function getSourceFileFromReadResult(
	result: SideEffectExecutionResult,
	sourceKind: PipelineMarkdownSourceFile["kind"],
	sourcePath: string,
): PipelineMarkdownSourceFile {
	const readResult = result.commands?.[0];
	const output = readResult ? getSourceReadOutput(readResult) : undefined;

	if (!output) {
		throw new Error(`Pipeline source read did not return content: ${sourcePath}`);
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

function createScreenGenerationPipelineSummary(
	state: ScreenGenerationPipelineState,
): PipelineRunResult["summary"] {
	const sourceSpec = state.sourceSpec;
	const screen = sourceSpec?.sourceShape.screen;

	return {
		agentPayload: state.agentResult?.payload,
		areaCount: sourceSpec ? countSourceAreas(sourceSpec) : 0,
		componentCount: sourceSpec ? countSourceComponents(sourceSpec) : 0,
		ok: state.parseCommandResult?.ok ?? false,
		outDir: state.options.outDir,
		screenCode: screen?.screenCode,
		session: state.agentResult?.session,
		sourcePath: state.options.sourcePath,
		validationOk: state.validationReport?.ok,
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

function createRenderTreeValidationReport(payload: unknown): ValidationReportContract {
	const renderTree = extractPayloadArtifact(payload, "renderTree");
	const tableGenerationResult = extractPayloadArtifact(payload, "tableGenerationResult");
	const schemaReport = validateSchemaArtifact("render-tree", renderTree);
	const semanticReport = validateRenderTree(renderTree, { componentCatalog });
	const tableReport =
		tableGenerationResult === undefined
			? createMissingArtifactReport("tableGenerationResult")
			: validateTableGenerationResult(tableGenerationResult);
	const issues: ValidationReportContract["issues"] = [
		...schemaReport.issues,
		...semanticReport.issues,
	];
	issues.push(...tableReport.issues);
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

function extractPayloadArtifact(payload: unknown, key: "renderTree" | "tableGenerationResult") {
	if (!isRecord(payload)) return key === "renderTree" ? payload : undefined;
	return payload[key] ?? (key === "renderTree" ? payload : undefined);
}

function createMissingArtifactReport(key: "tableGenerationResult"): ValidationReportContract {
	return {
		issues: [
			{
				code: "required-field-missing",
				message: `${key} is required in the generation agent payload.`,
				path: [key],
				severity: "error",
			},
		],
		ok: false,
		schemaVersion: SCHEMA_VERSION.validationReport,
		summary: {
			errorCount: 1,
			warningCount: 0,
		},
		target: "schema-artifact",
	};
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}

function createFakePatternSelection(layerCandidates: PatternLayerCandidate[]) {
	return {
		confidence: layerCandidates.length > 0 ? 1 : 0,
		reason:
			"Fake smoke runner selects all resolved screen, region, area, and component layer candidates.",
		schemaVersion: "pattern-selection.v0.1",
		selectedCandidates: layerCandidates.map((candidate) => ({
			id: candidate.id,
			level: candidate.level,
			pattern: candidate.pattern,
			targetRef: candidate.targetRef,
		})),
	};
}
