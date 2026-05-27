import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import { componentCatalog } from "@cx/components/catalog";
import {
	buildGenerationPlan,
	buildPatternSelectionAgentInput,
	buildScreenGenerationAgentInput,
	buildScreenRevisionAgentInput,
	GENERATION_PLAN_STEP,
} from "@cx/orchestration";
import type {
	GenerationPlanStepKind,
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	ScreenGenerationAgentInput,
	ScreenRevisionAgentInput,
} from "@cx/orchestration/types";
import { createNodePipelineAdapters, runSideEffects } from "@cx/pipeline";
import type { SideEffectExecutionResult } from "@cx/pipeline/types";
import { SCHEMA_VERSION, type SourceSpec, type ValidationReportContract } from "@cx/schema";
import {
	validateRenderTree,
	validateSchemaArtifact,
	validateTableGenerationResult,
} from "@cx/validation";

import {
	createGenerationSmokeArtifactCommands,
	createGenerationSmokePipelineResultCommands,
} from "./artifact-commands";
import { createFakeGenerationAgentRunner } from "./fake-agent-runner";
import { resolveSmokePatternLayerCandidates } from "./pattern-layer-candidates";
import type { GenerationSmokeOptions, GenerationSmokeResult } from "./types";

export type CompletedGenerationPlanRunState = GenerationPlanRunState & {
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
};

type GenerationPlanRunState = {
	agentInput?: ScreenGenerationAgentInput;
	agentResult?: AgentRunResult;
	initialValidationReport?: ValidationReportContract;
	patternLayerCandidates?: PatternLayerCandidate[];
	patternSelectionAgentInput?: PatternSelectionAgentInput;
	patternSelectionAgentResult?: AgentRunResult;
	patternSelectionRunnerRequest?: AgentRunnerRequest;
	options: GenerationSmokeOptions;
	outDir: string;
	parseCommandResult: GenerationSmokeResult["parseCommandResult"];
	pipelineResult?: SideEffectExecutionResult;
	pipelineResultWrite?: SideEffectExecutionResult;
	revisionAgentInput?: ScreenRevisionAgentInput;
	revisionAgentResult?: AgentRunResult;
	revisionRunnerRequest?: AgentRunnerRequest;
	runId: string;
	runnerRequest?: AgentRunnerRequest;
	sourceSpec: SourceSpec;
	validationReport?: ValidationReportContract;
};

type GenerationPlanStepExecutor = (state: GenerationPlanRunState) => Promise<void> | void;

const generationPlanStepExecutors = {
	[GENERATION_PLAN_STEP.generateRenderTree]: runGenerateRenderTreeStep,
	[GENERATION_PLAN_STEP.reviseRenderTreeIfInvalid]: runReviseRenderTreeIfInvalidStep,
	[GENERATION_PLAN_STEP.selectPattern]: runSelectPatternStep,
	[GENERATION_PLAN_STEP.validateRenderTree]: runValidateRenderTreeStep,
	[GENERATION_PLAN_STEP.writeArtifacts]: runWriteArtifactsStep,
} satisfies Record<GenerationPlanStepKind, GenerationPlanStepExecutor>;

export async function runGenerationPlan(input: {
	options: GenerationSmokeOptions;
	outDir: string;
	parseCommandResult: GenerationSmokeResult["parseCommandResult"];
	runId: string;
	sourceSpec: SourceSpec;
}): Promise<CompletedGenerationPlanRunState> {
	const state: GenerationPlanRunState = {
		options: input.options,
		outDir: input.outDir,
		parseCommandResult: input.parseCommandResult,
		runId: input.runId,
		sourceSpec: input.sourceSpec,
	};
	const plan = buildGenerationPlan();

	for (const step of plan.steps) {
		await generationPlanStepExecutors[step.kind](state);
	}

	if (!state.pipelineResult || !state.pipelineResultWrite) {
		throw new Error("Generation smoke plan finished without artifact write results.");
	}

	return {
		...state,
		pipelineResult: state.pipelineResult,
		pipelineResultWrite: state.pipelineResultWrite,
	};
}

async function runSelectPatternStep(state: GenerationPlanRunState): Promise<void> {
	const layerCandidates = resolveSmokePatternLayerCandidates(state.sourceSpec);
	const patternSelectionInput = buildPatternSelectionAgentInput({
		layerCandidates,
		sourceSpec: state.sourceSpec,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner: state.options.useAI
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

async function runGenerateRenderTreeStep(state: GenerationPlanRunState): Promise<void> {
	const agentInput = buildScreenGenerationAgentInput(state.sourceSpec, {
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner: state.options.useAI
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

function runValidateRenderTreeStep(state: GenerationPlanRunState): void {
	state.validationReport = createRenderTreeValidationReport(state.agentResult?.payload);
	state.initialValidationReport ??= state.validationReport;
}

async function runReviseRenderTreeIfInvalidStep(state: GenerationPlanRunState): Promise<void> {
	if (state.validationReport?.ok) return;

	const previousCandidate = state.agentResult?.payload;
	const revisionInput = buildScreenRevisionAgentInput({
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		previousCandidate,
		sourceSpec: state.sourceSpec,
		validationReport: state.validationReport,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner: state.options.useAI
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

async function runWriteArtifactsStep(state: GenerationPlanRunState): Promise<void> {
	const commands = createGenerationSmokeArtifactCommands({
		agentInput: state.agentInput,
		agentResult: state.agentResult,
		initialValidationReport: state.initialValidationReport,
		outDir: state.outDir,
		parseCommandResult: state.parseCommandResult,
		patternLayerCandidates: state.patternLayerCandidates,
		patternSelectionAgentInput: state.patternSelectionAgentInput,
		patternSelectionAgentResult: state.patternSelectionAgentResult,
		patternSelectionRunnerRequest: state.patternSelectionRunnerRequest,
		revisionAgentInput: state.revisionAgentInput,
		revisionAgentResult: state.revisionAgentResult,
		revisionRunnerRequest: state.revisionRunnerRequest,
		runnerRequest: state.runnerRequest,
		sourceSpec: state.sourceSpec,
		validationReport: state.validationReport,
	});

	state.pipelineResult = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands,
		mode: "commit",
		runId: state.runId,
	});
	state.pipelineResultWrite = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: createGenerationSmokePipelineResultCommands({
			outDir: state.outDir,
			pipelineResult: state.pipelineResult,
		}),
		mode: "commit",
		runId: state.runId,
	});
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
