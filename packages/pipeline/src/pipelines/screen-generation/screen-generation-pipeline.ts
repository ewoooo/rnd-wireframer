import path from "node:path";
import { fileURLToPath } from "node:url";

import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import {
	componentCatalog,
	getComponentCatalogEntry,
	getComponentCatalogStatus,
	getComponentCatalogTypes,
} from "@cx/components/catalog";
import { createFakeScreenIntent, runScreenIntentNode } from "@cx/inference-nodes/screen-generation";
import {
	resolveCompositeLayoutByComponentType,
	resolveRegionLayoutFromScreenLayout,
} from "@cx/layout-pattern-store/resolver";
import {
	buildComponentProposalAgentInput,
	buildCompositionPlanAgentInput,
	buildDecorationPlan,
	buildDesignContextBundleRefs,
	buildDesignSkillSelection,
	buildGenerationNextAction,
	buildPatternLayerCandidates,
	buildPatternSelectionAgentInput,
	buildQualityReviewAgentInput,
	buildScreenGenerationAgentInput,
	buildScreenRevisionAgentInput,
} from "@cx/orchestration";
import type {
	ComponentContractCatalog,
	ComponentProposalAgentInput,
	CompositionPlanAgentInput,
	DesignContextBundleSelection,
	GenerationNextAction,
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	QualityReviewAgentInput,
	ScreenGenerationAgentInput,
	ScreenIntentAgentInput,
	ScreenRevisionAgentInput,
} from "@cx/orchestration/types";
import {
	type CompositionPlanContract,
	type DecorationPlanContract,
	type DesignContextBundleContent,
	type DesignSkillSelectionContract,
	SCHEMA_VERSION,
	type SourceSpec,
	type ValidationReportContract,
} from "@cx/schema";
import {
	validateComponentProposal,
	validateCompositionPlan,
	validateRenderTree,
	validateSchemaArtifact,
	validateTableGenerationResult,
} from "@cx/validation";

import { createNodePipelineAdapters } from "../../adapters";
import { runParseMarkdownSourceCommand } from "../../commands";
import { definePipeline, defineStep } from "../../definition";
import {
	completePipelineRunStatus,
	createFilePipelinePersistenceAdapter,
	createPipelineRunEvent,
	createPipelineRunStatus,
	persistPipelineRunEvent,
	updatePipelineRunStatus,
} from "../../persistence";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";
import type {
	PipelineDefinition,
	PipelineMarkdownSourceFile,
	PipelinePersistenceAdapter,
	PipelineProgressEvent,
	PipelineRunResult,
	PipelineRunStatus,
	PipelineStageId,
	ScreenGenerationPipelineOptions,
	SideEffectCommandResult,
	SideEffectExecutionResult,
} from "../../public/types";
import { runSideEffects } from "../../runner";
import { runStepPipeline } from "../../runtime/run-step-pipeline";
import {
	ARTIFACT_FILES,
	ARTIFACT_LAYER_GROUPS,
	createGenerationSmokeArtifactCommands,
	createGenerationSmokeManifestCommand,
	createGenerationSmokePipelineResultCommands,
} from "./artifact-commands";
import { loadDesignContextBundleContents } from "./design-context-catalog";
import { createFakeGenerationAgentRunner } from "./fake-agent-runner";
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
		"derive-screen-intent",
		"plan-composition",
		"derive-decoration-plan",
		"select-pattern",
		"generate-render-tree",
		"validate-render-tree",
		"propose-components",
		"review-quality",
		"revise-render-tree-if-invalid",
		"validate-render-tree-after-revision",
		"write-artifacts",
	],
} as const satisfies PipelineDefinition;

type ScreenGenerationPipelineState = {
	agentInput?: ScreenGenerationAgentInput;
	agentResult?: AgentRunResult;
	compositionPlanAgentInput?: CompositionPlanAgentInput;
	compositionPlanAgentResult?: AgentRunResult;
	compositionPlanRunnerRequest?: AgentRunnerRequest;
	componentProposalAgentInput?: ComponentProposalAgentInput;
	componentProposalAgentResult?: AgentRunResult;
	componentProposalRunnerRequest?: AgentRunnerRequest;
	componentProposalValidationReport?: ReturnType<typeof validateComponentProposal>;
	decorationPlan?: DecorationPlanContract;
	designContextBundleContents?: DesignContextBundleContent[];
	designContextBundleSelection?: DesignContextBundleSelection;
	designSkillSelection?: DesignSkillSelectionContract;
	generationNextAction?: GenerationNextAction;
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
	qualityReviewAgentInput?: QualityReviewAgentInput;
	qualityReviewAgentResult?: AgentRunResult;
	qualityReviewRunnerRequest?: AgentRunnerRequest;
	revisionAgentInput?: ScreenRevisionAgentInput;
	revisionAgentResult?: AgentRunResult;
	revisionRunnerRequest?: AgentRunnerRequest;
	renderTreeGenerationSkill?: GenerationSkill;
	runnerRequest?: AgentRunnerRequest;
	screenIntentAgentInput?: ScreenIntentAgentInput;
	screenIntentAgentResult?: AgentRunResult;
	screenIntentRunnerRequest?: AgentRunnerRequest;
	sourceFile?: PipelineMarkdownSourceFile;
	sourceReadResult?: SideEffectExecutionResult;
	sourceSpec?: SourceSpec;
	validationReport?: ValidationReportContract;
};

type CompletedScreenGenerationPipelineState = ScreenGenerationPipelineState & {
	parseCommandResult: ReturnType<typeof runParseMarkdownSourceCommand>;
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
};

type NormalizedScreenGenerationPipelineOptions = {
	agentMode: "claude-local-first" | "fake";
	clockNow: () => string;
	createdAt: string;
	createEventId: () => string;
	disableDesignContext: boolean;
	executionMode: "stage-loop" | "step-runner";
	onProgress: NonNullable<ScreenGenerationPipelineOptions["onProgress"]>;
	outDir: string;
	persistence?: PipelinePersistenceAdapter;
	runDir: string;
	runId: string;
	sourceKind: PipelineMarkdownSourceFile["kind"];
	sourcePath: string;
	tags: string[];
};

type ScreenGenerationStageExecutor = (state: ScreenGenerationPipelineState) => Promise<void> | void;

const screenGenerationStageExecutors = {
	"derive-screen-intent": runDeriveScreenIntentStage,
	"derive-decoration-plan": runDeriveDecorationPlanStage,
	"generate-render-tree": runGenerateRenderTreeStage,
	"parse-source": runParseSourceStage,
	"plan-composition": runPlanCompositionStage,
	"propose-components": runProposeComponentsStage,
	"read-source": runReadSourceStage,
	"review-quality": runReviewQualityStage,
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
	if (state.options.executionMode === "step-runner") {
		await runScreenGenerationStepRunner(definition, state);
	} else {
		await runScreenGenerationStageLoop(definition, state);
	}

	assertScreenGenerationCompleted(state);

	return createScreenGenerationPipelineResult(state);
}

async function runScreenGenerationStageLoop(
	definition: PipelineDefinition,
	state: ScreenGenerationPipelineState,
): Promise<void> {
	let runStatus = createPipelineRunStatus({
		createdAt: state.options.createdAt,
		definition,
		outDir: state.options.outDir,
		pipelineId: "screen-generation",
		runDir: state.options.runDir,
		runId: state.options.runId,
		sourcePath: state.options.sourcePath,
	});
	await state.options.persistence?.writeStatus(runStatus);

	for (const stage of definition.stages) {
		if (
			state.parseCommandResult &&
			!state.parseCommandResult.parseResult.ok &&
			stage !== "write-artifacts"
		) {
			continue;
		}
		const startedEvent = createProgressEvent(state, stage, "started");
		runStatus = await recordPipelineProgress(state, runStatus, startedEvent);
		await state.options.onProgress(startedEvent);

		try {
			await screenGenerationStageExecutors[stage](state);
		} catch (error) {
			const failedEvent = createProgressEvent(state, stage, "failed");
			runStatus = await recordPipelineProgress(state, runStatus, failedEvent, {
				code: "pipeline_stage_failed",
				message: readErrorMessage(error),
			});
			await state.options.onProgress(failedEvent);
			throw error;
		}

		const completedEvent = createProgressEvent(state, stage, "completed");
		runStatus = await recordPipelineProgress(state, runStatus, completedEvent);
		await state.options.onProgress(completedEvent);
	}

	runStatus = completePipelineRunStatus(runStatus, state.options.clockNow());
	await state.options.persistence?.writeStatus(runStatus);
}

async function runScreenGenerationStepRunner(
	definition: PipelineDefinition,
	state: ScreenGenerationPipelineState,
): Promise<void> {
	const pipeline = definePipeline({
		id: definition.id,
		steps: definition.stages.map((stage) =>
			defineStep({
				execute: async () => {
					await screenGenerationStageExecutors[stage](state);
					return readScreenGenerationStageOutput(state, stage);
				},
				id: stage,
				skipWhen: () =>
					Boolean(
						state.parseCommandResult &&
							!state.parseCommandResult.parseResult.ok &&
							stage !== "write-artifacts",
					),
				usesAI: false,
			}),
		),
	});

	await runStepPipeline(pipeline, {
		createEventId: state.options.createEventId,
		now: state.options.clockNow,
		onEvent: async (event) => {
			if (!event.stage) return;
			await state.options.onProgress({
				pipelineId: "screen-generation",
				runId: state.options.runId,
				stage: event.stage as PipelineStageId,
				status: event.status,
				timestamp: event.timestamp,
			});
		},
		persistence: state.options.persistence,
		runId: state.options.runId,
		status: {
			outDir: state.options.outDir,
			runDir: state.options.runDir,
			sourcePath: state.options.sourcePath,
		},
	});
}

function createScreenGenerationPipelineResult(
	state: CompletedScreenGenerationPipelineState,
): PipelineRunResult {
	return {
		agentInput: state.agentInput,
		agentResult: state.agentResult,
		compositionPlanAgentInput: state.compositionPlanAgentInput,
		compositionPlanAgentResult: state.compositionPlanAgentResult,
		compositionPlanRunnerRequest: state.compositionPlanRunnerRequest,
		decorationPlan: state.decorationPlan,
		designContextBundleSelection: state.designContextBundleSelection,
		designSkillSelection: state.designSkillSelection,
		finalResult: extractPayloadArtifact(state.agentResult?.payload, "renderTree"),
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
		qualityReviewAgentInput: state.qualityReviewAgentInput,
		qualityReviewAgentResult: state.qualityReviewAgentResult,
		qualityReviewRunnerRequest: state.qualityReviewRunnerRequest,
		revisionAgentInput: state.revisionAgentInput,
		revisionAgentResult: state.revisionAgentResult,
		revisionRunnerRequest: state.revisionRunnerRequest,
		revisionDecision: state.generationNextAction,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
		runId: state.options.runId,
		runnerRequest: state.runnerRequest,
		screenIntentAgentInput: state.screenIntentAgentInput,
		screenIntentAgentResult: state.screenIntentAgentResult,
		screenIntentRunnerRequest: state.screenIntentRunnerRequest,
		sourcePath: state.options.sourcePath,
		sourceSpec: state.sourceSpec,
		summary: createScreenGenerationPipelineSummary(state),
		validationReport: state.validationReport,
	};
}

function assertScreenGenerationCompleted(
	state: ScreenGenerationPipelineState,
): asserts state is CompletedScreenGenerationPipelineState {
	if (!state.pipelineResult || !state.pipelineResultWrite || !state.parseCommandResult) {
		throw new Error("Screen generation pipeline finished without artifact write results.");
	}
}

function readScreenGenerationStageOutput(
	state: ScreenGenerationPipelineState,
	stage: PipelineStageId,
): unknown {
	const outputs = {
		"derive-decoration-plan": {
			decorationPlan: state.decorationPlan,
			patternLayerCandidates: state.patternLayerCandidates,
		},
		"derive-screen-intent": state.screenIntentAgentResult?.payload,
		"generate-render-tree": state.agentResult?.payload,
		"parse-source": state.sourceSpec,
		"plan-composition": {
			compositionPlan: state.compositionPlanAgentResult?.payload,
			designContextBundleSelection: state.designContextBundleSelection,
			designSkillSelection: state.designSkillSelection,
			patternLayerCandidates: state.patternLayerCandidates,
		},
		"propose-components": state.componentProposalAgentResult?.payload,
		"read-source": state.sourceFile,
		"review-quality": state.qualityReviewAgentResult?.payload,
		"revise-render-tree-if-invalid": state.agentResult?.payload,
		"select-pattern": state.patternSelectionAgentResult?.payload,
		"validate-render-tree": state.validationReport,
		"validate-render-tree-after-revision": state.validationReport,
		"write-artifacts": state.pipelineResult,
	} satisfies Record<PipelineStageId, unknown>;

	return outputs[stage];
}

function createProgressEvent(
	state: ScreenGenerationPipelineState,
	stage: PipelineStageId,
	status: PipelineProgressEvent["status"],
): PipelineProgressEvent {
	return {
		pipelineId: "screen-generation",
		runId: state.options.runId,
		stage,
		status,
		timestamp: state.options.clockNow(),
	};
}

async function recordPipelineProgress(
	state: ScreenGenerationPipelineState,
	status: PipelineRunStatus,
	event: PipelineProgressEvent,
	error?: PipelineRunStatus["error"],
): Promise<PipelineRunStatus> {
	const timestamp = event.timestamp ?? state.options.clockNow();
	const nextStatus = updatePipelineRunStatus({
		error,
		event,
		status,
		timestamp,
	});
	await persistPipelineRunEvent({
		adapter: state.options.persistence,
		event: createPipelineRunEvent({
			event,
			eventId: state.options.createEventId(),
			timestamp,
		}),
		status: nextStatus,
	});
	return nextStatus;
}

function readErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
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

async function runDeriveScreenIntentStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runScreenIntentNode({
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: async (request) => ({
						payload: createFakeScreenIntent(sourceSpec),
						session: {
							mode: request.session?.mode ?? "new",
							sessionId: request.session?.sessionId,
						},
						taskKind: request.taskKind,
					}),
		sourceSpec,
	});

	state.screenIntentAgentInput = nodeResult.agentInput;
	state.screenIntentAgentResult = nodeResult.agentResult;
	state.screenIntentRunnerRequest = nodeResult.runnerRequest;
}

async function runPlanCompositionStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const layerCandidates = buildScreenGenerationPatternLayerCandidates(sourceSpec);
	const designSkillSelection = buildDesignSkillSelection({
		layerCandidates,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});
	const compositionPlanInput = buildCompositionPlanAgentInput({
		designSkillSelection,
		layerCandidates,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner:
			state.options.agentMode === "claude-local-first"
				? async (request) => {
						state.compositionPlanRunnerRequest = request;
						return realRunner(request);
					}
				: async (request) => {
						state.compositionPlanRunnerRequest = request;
						return {
							payload: createFakeCompositionPlan(sourceSpec, layerCandidates, designSkillSelection),
							session: {
								mode: request.session?.mode ?? "new",
								sessionId: request.session?.sessionId,
							},
							taskKind: request.taskKind,
						};
					},
	});

	state.patternLayerCandidates = layerCandidates;
	state.designSkillSelection = designSkillSelection;
	state.compositionPlanAgentInput = compositionPlanInput;
	state.compositionPlanAgentResult = await runAgentQuery(runtime, {
		context: compositionPlanInput.context,
		query: compositionPlanInput.query,
		taskKind: "composition-planning",
	});
	state.designContextBundleSelection = buildDesignContextBundleRefs({
		compositionPlan: state.compositionPlanAgentResult.payload,
		layerCandidates,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});
}

function runDeriveDecorationPlanStage(state: ScreenGenerationPipelineState): void {
	const sourceSpec = requireSourceSpec(state);
	state.decorationPlan = buildDecorationPlan({
		compositionPlan: state.compositionPlanAgentResult?.payload,
		sourceSpec,
	});
	state.patternLayerCandidates = buildScreenGenerationPatternLayerCandidates(
		sourceSpec,
		state.decorationPlan,
	);
}

async function runSelectPatternStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const layerCandidates =
		state.patternLayerCandidates ?? buildScreenGenerationPatternLayerCandidates(sourceSpec);
	const patternSelectionInput = buildPatternSelectionAgentInput({
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designSkillSelection: state.designSkillSelection,
		layerCandidates,
		screenIntent: state.screenIntentAgentResult?.payload,
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
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const agentInput = buildScreenGenerationAgentInput(sourceSpec, {
		componentContractCatalog: buildSourceComponentContractCatalog(
			sourceSpec,
			state.patternLayerCandidates ?? [],
		),
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		screenIntent: state.screenIntentAgentResult?.payload,
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
	state.validationReport = createRenderTreeValidationReport(state.agentResult?.payload, {
		allowedLayoutIds: state.patternLayerCandidates?.map((candidate) => candidate.layout),
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec: state.sourceSpec,
	});
	state.initialValidationReport ??= state.validationReport;
	if (state.sourceSpec) {
		state.designContextBundleSelection = buildDesignContextBundleRefs({
			compositionPlan: state.compositionPlanAgentResult?.payload,
			layerCandidates: state.patternLayerCandidates,
			screenIntent: state.screenIntentAgentResult?.payload,
			sourceSpec: state.sourceSpec,
			validationReport: state.validationReport,
		});
	}
}

async function runProposeComponentsStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		sourceSpec,
		state.patternLayerCandidates ?? [],
	);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const proposalInput = buildComponentProposalAgentInput({
		candidate: state.agentResult?.payload,
		componentContractCatalog,
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner:
			state.options.agentMode === "claude-local-first"
				? async (request) => {
						state.componentProposalRunnerRequest = request;
						return realRunner(request);
					}
				: async (request) => {
						state.componentProposalRunnerRequest = request;
						return {
							payload: createFakeComponentProposal(),
							session: {
								mode: request.session?.mode ?? "new",
								sessionId: request.session?.sessionId,
							},
							taskKind: request.taskKind,
						};
					},
	});

	state.componentProposalAgentInput = proposalInput;
	state.componentProposalAgentResult = await runAgentQuery(runtime, {
		context: proposalInput.context,
		query: proposalInput.query,
		taskKind: "component-proposal",
	});
	// 제안은 비파괴 아티팩트다. 검증은 bounded 여부만 리포트하고 파이프라인을 실패시키지 않는다.
	// allowedRefs는 source reference catalog(생성 입력 context)의 전체 vocabulary를 기준으로 한다.
	state.componentProposalValidationReport = validateComponentProposal(
		state.componentProposalAgentResult.payload,
		{
			allowedRefs: proposalInput.context.sourceReferenceCatalog.allowedRefs,
			catalogComponentTypes: componentContractCatalog.entries.map((entry) => entry.componentType),
		},
	);
}

async function runReviewQualityStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const qualityReviewInput = buildQualityReviewAgentInput({
		candidate: state.agentResult?.payload,
		componentContractCatalog: buildSourceComponentContractCatalog(
			sourceSpec,
			state.patternLayerCandidates ?? [],
		),
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
		validationReport: state.validationReport,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const runtime = createAgentRuntime({
		runner:
			state.options.agentMode === "claude-local-first"
				? async (request) => {
						state.qualityReviewRunnerRequest = request;
						return realRunner(request);
					}
				: async (request) => {
						state.qualityReviewRunnerRequest = request;
						return {
							payload: createFakeQualityInspection(state.validationReport),
							session: {
								mode: request.session?.mode ?? "new",
								sessionId: request.session?.sessionId,
							},
							taskKind: request.taskKind,
						};
					},
	});

	state.qualityReviewAgentInput = qualityReviewInput;
	state.qualityReviewAgentResult = await runAgentQuery(runtime, {
		context: qualityReviewInput.context,
		query: qualityReviewInput.query,
		taskKind: "quality-review",
	});
}

async function runReviseRenderTreeIfInvalidStage(
	state: ScreenGenerationPipelineState,
): Promise<void> {
	state.generationNextAction = buildGenerationNextAction({
		initialValidationReport: state.initialValidationReport,
		qualityInspection: state.qualityReviewAgentResult?.payload,
		retryCount: state.revisionAgentResult ? 1 : 0,
		validationReport: state.validationReport,
	});

	if (state.generationNextAction.action !== "request-revision") return;

	const sourceSpec = requireSourceSpec(state);
	const previousCandidate = state.agentResult?.payload;
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const revisionInput = buildScreenRevisionAgentInput({
		componentContractCatalog: buildSourceComponentContractCatalog(
			sourceSpec,
			state.patternLayerCandidates ?? [],
		),
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		previousCandidate,
		qualityInspection: state.qualityReviewAgentResult?.payload,
		screenIntent: state.screenIntentAgentResult?.payload,
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
		compositionPlanAgentInput: state.compositionPlanAgentInput,
		compositionPlanAgentResult: state.compositionPlanAgentResult,
		compositionPlanRunnerRequest: state.compositionPlanRunnerRequest,
		componentProposalAgentInput: state.componentProposalAgentInput,
		componentProposalAgentResult: state.componentProposalAgentResult,
		componentProposalRunnerRequest: state.componentProposalRunnerRequest,
		componentProposalValidationReport: state.componentProposalValidationReport,
		componentProposal: state.componentProposalAgentResult?.payload,
		designCritique: state.qualityReviewAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleSelection: state.designContextBundleSelection,
		designSkillSelection: state.designSkillSelection,
		finalResult: extractPayloadArtifact(state.agentResult?.payload, "renderTree"),
		generationSkillCatalog: state.generationSkillCatalog,
		initialValidationReport: state.initialValidationReport,
		outDir: state.options.outDir,
		parseCommandResult: state.parseCommandResult,
		patternLayerCandidates: state.patternLayerCandidates,
		patternSelectionAgentInput: state.patternSelectionAgentInput,
		patternSelectionAgentResult: state.patternSelectionAgentResult,
		patternSelectionRunnerRequest: state.patternSelectionRunnerRequest,
		qualityReviewAgentInput: state.qualityReviewAgentInput,
		qualityReviewAgentResult: state.qualityReviewAgentResult,
		qualityReviewRunnerRequest: state.qualityReviewRunnerRequest,
		revisionDecision: state.generationNextAction,
		revisionAgentInput: state.revisionAgentInput,
		revisionAgentResult: state.revisionAgentResult,
		revisionRunnerRequest: state.revisionRunnerRequest,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
		runnerRequest: state.runnerRequest,
		screenIntentAgentInput: state.screenIntentAgentInput,
		screenIntentAgentResult: state.screenIntentAgentResult,
		screenIntentRunnerRequest: state.screenIntentRunnerRequest,
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
	await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			createGenerationSmokeManifestCommand({
				manifest: createSmokeRunManifest(state),
				runDir: state.options.runDir,
			}),
		],
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
	const paths = resolveRunOutputPaths(options, runId);
	const adapters = createNodePipelineAdapters();
	const createdAt = adapters.clock.now();
	let eventSequence = 0;
	const createEventId = () => {
		eventSequence += 1;
		return `${runId}:event:${String(eventSequence).padStart(4, "0")}`;
	};
	const persistence =
		options.persistence?.enabled === false
			? undefined
			: (options.persistence?.adapter ??
				createFilePipelinePersistenceAdapter({
					adapters,
					eventsFileName: options.persistence?.eventsFileName,
					runDir: paths.runDir,
					statusFileName: options.persistence?.statusFileName,
				}));

	return {
		agentMode: options.agentMode ?? (options.useAI ? "claude-local-first" : "fake"),
		clockNow: adapters.clock.now,
		createdAt,
		createEventId,
		disableDesignContext: options.disableDesignContext ?? false,
		executionMode: options.executionMode ?? "stage-loop",
		onProgress: options.onProgress ?? (() => undefined),
		...paths,
		persistence,
		runId,
		sourceKind: source.kind ?? resolveSourceKind(sourcePath),
		sourcePath,
		tags: options.tags ?? [],
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

function resolveRunOutputPaths(
	options: ScreenGenerationPipelineOptions,
	runId: string,
): Pick<NormalizedScreenGenerationPipelineOptions, "outDir" | "runDir"> {
	if (options.outDir) {
		const normalizedOutDir = normalizeOutDir(options.outDir);
		return { outDir: normalizedOutDir, runDir: normalizedOutDir };
	}

	const runDir = createRunDir(runId, options.artifactStore);
	return {
		outDir: path.join(runDir, "artifacts"),
		runDir,
	};
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

function createRunDir(
	runId: string,
	artifactStore?: ScreenGenerationPipelineOptions["artifactStore"],
): string {
	const preset = artifactStore?.preset ?? "data-run";
	if (artifactStore?.rootDir) {
		const rootDir = path.isAbsolute(artifactStore.rootDir)
			? artifactStore.rootDir
			: path.resolve(resolveInvocationRoot(), artifactStore.rootDir);
		return path.join(rootDir, runId);
	}
	if (preset === "local-transient") {
		return path.resolve(resolveInvocationRoot(), "tmp", "generation-runs", runId);
	}
	if (preset === "web-fixture") {
		return path.resolve(resolveInvocationRoot(), "apps", "web", "fixtures", "smoke-runs", runId);
	}
	return path.resolve(resolveInvocationRoot(), "data", "runs", "screen-generation", runId);
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

function buildScreenGenerationPatternLayerCandidates(
	sourceSpec: SourceSpec,
	decorationPlan?: DecorationPlanContract,
): PatternLayerCandidate[] {
	return buildPatternLayerCandidates({
		decorationPlan,
		resolver: {
			resolveComponentLayout: ({ componentType, sourceComponentId }) =>
				resolveCompositeLayoutByComponentType(componentType ?? sourceComponentId),
			resolveRegionLayout: resolveRegionLayoutFromScreenLayout,
		},
		sourceSpec,
	});
}

function buildSourceComponentContractCatalog(
	sourceSpec: SourceSpec,
	layerCandidates: PatternLayerCandidate[],
): ComponentContractCatalog {
	const entries = sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => {
				const componentType = component.componentType ?? component.sourceComponentId;
				const componentEntry = getComponentCatalogEntry(componentType);
				const sourceRefs = [
					...new Set(
						[
							component.sourceId,
							component.roleAlias,
							component.sourceComponentId,
							component.componentType,
						].filter((ref): ref is string => Boolean(ref)),
					),
				];
				const layoutCandidates = layerCandidates
					.filter(
						(candidate) =>
							candidate.level === "component" &&
							sourceRefs.includes(candidate.targetRef) &&
							candidate.layout.startsWith("layout.composite."),
					)
					.map((candidate) => candidate.layout);

				return {
					componentType,
					layoutCandidates,
					props: Object.fromEntries(
						Object.entries(componentEntry?.props ?? {}).map(([propName, contract]) => [
							propName,
							{
								required: contract.required,
								role: contract.role,
								type: contract.type,
								values: contract.values,
							},
						]),
					),
					sourceRefs,
				};
			}),
		),
	);

	// Expose the registry (status-tagged) beyond the source-mapped entries, so the agent
	// may reach for a better-fitting component. Visibility is independent of status;
	// promotion (candidate->stable) only flips the tag, it does not drop the component.
	const entryCanonicalTypes = new Set(
		entries.map(
			(entry) => getComponentCatalogEntry(entry.componentType)?.type ?? entry.componentType,
		),
	);
	const available = getComponentCatalogTypes()
		.filter((type) => !entryCanonicalTypes.has(type))
		.filter((type) => !type.startsWith("Layout.") && type !== "PageStack")
		.map((type) => {
			const entry = getComponentCatalogEntry(type);
			return {
				componentType: type,
				status: getComponentCatalogStatus(type) ?? ("stable" as const),
				props: Object.fromEntries(
					Object.entries(entry?.props ?? {}).map(([propName, contract]) => [
						propName,
						{
							required: contract.required,
							role: contract.role,
							type: contract.type,
							values: contract.values,
						},
					]),
				),
			};
		});

	return available.length > 0 ? { available, entries } : { entries };
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

function createSmokeRunManifest(state: ScreenGenerationPipelineState): SmokeRunManifest {
	const summary = createScreenGenerationPipelineSummary(state);
	const validationSummary = state.validationReport?.summary;

	const artifact = (fileName: string) => `artifacts/${fileName}`;

	return {
		agentMode: state.options.agentMode,
		agentResult: artifact(ARTIFACT_FILES.agentResult),
		artifactRoot: "artifacts",
		componentProposal: artifact(ARTIFACT_FILES.componentProposal),
		compositionPlan: artifact(ARTIFACT_FILES.compositionPlan),
		createdAt: new Date().toISOString(),
		decorationPlan: artifact(ARTIFACT_FILES.decorationPlan),
		finalResult: artifact(ARTIFACT_FILES.finalResult),
		patternSelection: artifact(ARTIFACT_FILES.patternSelection),
		pipelineId: "screen-generation",
		pipelineResult: artifact(ARTIFACT_FILES.pipelineResult),
		qualityReview: artifact(ARTIFACT_FILES.qualityReview),
		runId: state.options.runId,
		schemaVersion: "smoke-run-manifest.v0.1",
		screenIntent: artifact(ARTIFACT_FILES.screenIntent),
		sourcePath: path.relative(resolveInvocationRoot(), state.options.sourcePath),
		sourceSpec: artifact(ARTIFACT_FILES.sourceSpec),
		stageLayers: createSmokeRunStageLayers(artifact),
		stageOrder: [...screenGenerationPipelineDefinition.stages],
		summary: {
			errorCount: validationSummary?.errorCount ?? 0,
			ok: summary.ok,
			validationOk: summary.validationOk,
			warningCount: validationSummary?.warningCount ?? 0,
		},
		tableGenerationResult: {
			source: "agentResult.payload.tableGenerationResult",
			usage: "validation-and-comparison-only",
		},
		tags: state.options.tags,
		trace: artifact(ARTIFACT_FILES.trace),
		validationReport: artifact(ARTIFACT_FILES.validationReport),
	};
}

function createSmokeRunStageLayers(
	artifact: (fileName: string) => string,
): SmokeRunManifest["stageLayers"] {
	return [
		{
			artifacts: ARTIFACT_LAYER_GROUPS.understand.artifacts.map(artifact),
			layer: "understand",
			stages: ["read-source", "parse-source", "derive-screen-intent"],
			traceKeys: [...ARTIFACT_LAYER_GROUPS.understand.traceKeys],
		},
		{
			artifacts: ARTIFACT_LAYER_GROUPS.compose.artifacts.map(artifact),
			layer: "compose",
			stages: [
				"plan-composition",
				"derive-decoration-plan",
				"select-pattern",
				"generate-render-tree",
				"propose-components",
			],
			traceKeys: [...ARTIFACT_LAYER_GROUPS.compose.traceKeys],
		},
		{
			artifacts: ARTIFACT_LAYER_GROUPS.revise.artifacts.map(artifact),
			layer: "revise",
			stages: [
				"validate-render-tree",
				"review-quality",
				"revise-render-tree-if-invalid",
				"validate-render-tree-after-revision",
				"write-artifacts",
			],
			traceKeys: [...ARTIFACT_LAYER_GROUPS.revise.traceKeys],
		},
	];
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

function createRenderTreeValidationReport(
	payload: unknown,
	options: {
		allowedLayoutIds?: string[];
		compositionPlan?: unknown;
		decorationPlan?: unknown;
		screenIntent?: unknown;
		sourceSpec?: SourceSpec;
	} = {},
): ValidationReportContract {
	const renderTree = extractPayloadArtifact(payload, "renderTree");
	const tableGenerationResult = extractPayloadArtifact(payload, "tableGenerationResult");
	const schemaReport = validateSchemaArtifact("render-tree", renderTree);
	const semanticReport = validateRenderTree(renderTree, {
		allowedLayoutIds: options.allowedLayoutIds,
		componentCatalog,
		generatedArtifact: payload,
		sourceSpec: options.sourceSpec,
	});
	const screenIntentReport =
		options.screenIntent === undefined
			? undefined
			: validateSchemaArtifact("screen-intent", options.screenIntent);
	const compositionPlanReport =
		options.compositionPlan === undefined
			? undefined
			: validateCompositionPlan(options.compositionPlan, {
					generatedArtifact: payload,
					sourceSpec: options.sourceSpec,
				});
	const decorationPlanReport =
		options.decorationPlan === undefined
			? undefined
			: validateSchemaArtifact("decoration-plan", options.decorationPlan);
	const tableReport =
		tableGenerationResult === undefined
			? createMissingArtifactReport("tableGenerationResult")
			: validateTableGenerationResult(tableGenerationResult, {
					allowedLayoutIds: options.allowedLayoutIds,
				});
	const issues: ValidationReportContract["issues"] = [
		...(screenIntentReport?.issues ?? []),
		...(compositionPlanReport?.issues ?? []),
		...(decorationPlanReport?.issues ?? []),
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

function createFakeQualityInspection(validationReport: ValidationReportContract | undefined) {
	const warningCount = validationReport?.summary.warningCount ?? 0;

	return {
		findings: warningCount
			? [
					{
						code: "validation-warning-review",
						layer: "revise",
						message: "Generation result has validation warnings that should be reviewed.",
						path: ["validationReport", "issues"],
						severity: "warning",
						suggestion: "Inspect warning paths before approving the generated screen.",
					},
				]
			: [],
		inspection: {
			compositionAligned: warningCount === 0,
			sourceFaithful: warningCount === 0,
			visualHierarchyClear: true,
		},
		scores: {
			actionClarity: warningCount === 0 ? 5 : 3,
			densityFit: warningCount === 0 ? 5 : 3,
			fidelity: warningCount === 0 ? 5 : 3,
			hierarchy: warningCount === 0 ? 5 : 3,
			patternFit: warningCount === 0 ? 5 : 3,
			separation: warningCount === 0 ? 5 : 3,
		},
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		summary: {
			errorCount: 0,
			warningCount: warningCount > 0 ? 1 : 0,
		},
	};
}

async function loadBundleContentsForState(
	state: ScreenGenerationPipelineState,
): Promise<DesignContextBundleContent[]> {
	if (state.options.disableDesignContext) return [];
	return loadDesignContextBundleContents(state.designContextBundleSelection?.bundleRefs ?? []);
}

function createFakeComponentProposal() {
	return {
		proposals: [],
		schemaVersion: SCHEMA_VERSION.componentProposal,
	};
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}

function createFakeCompositionPlan(
	sourceSpec: SourceSpec,
	layerCandidates: PatternLayerCandidate[],
	designSkillSelection?: DesignSkillSelectionContract,
): CompositionPlanContract {
	const screenLayout =
		layerCandidates.find((candidate) => candidate.level === "screen")?.layout ??
		"layout.screen.commerceDetailScreen";
	const skillId = designSkillSelection?.selectedSkill.id ?? "generic-composition";

	return {
		density: sourceSpec.sourceShape.screen.regions.length > 3 ? "high" : "medium",
		layoutStrategy: `Use ${skillId} guidance while keeping source regions as stable screen rails for RenderTree generation.`,
		patternRationale: `Fake composition keeps the available screen layout while preserving source region order and ${skillId} design-skill gates for later pattern selection.`,
		primaryUserAction: "complete-primary-flow",
		rationale:
			"Fake composition plan records the design composition decision before pattern selection.",
		rejectedPatterns: [],
		schemaVersion: SCHEMA_VERSION.compositionPlan,
		screenLayout,
		sectionRhythm:
			"Preserve source region order and use region boundaries as the first section rhythm signal.",
		sections: sourceSpec.sourceShape.screen.regions.map((region, index) => ({
			priority: index + 1,
			role: REGION_SECTION_ROLE[region.slot] ?? "content",
			sourceRefs: region.children.flatMap((area) => [
				area.sourceAreaId,
				...area.children.map((component) => component.sourceId ?? component.sourceComponentId),
			]),
			strategy: `Preserve ${region.slot} source order and map it to a stable screen section.`,
			targetRegion: REGION_TARGET[region.slot] ?? "contents",
		})),
		visualHierarchy: `Header establishes context, contents carry the main information, and bottom action closes the flow when present under ${skillId}.`,
	};
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
			layout: candidate.layout,
			targetRef: candidate.targetRef,
		})),
	};
}

const REGION_SECTION_ROLE = {
	bottom: "bottom-action",
	contents: "content",
	header: "header",
	unknown: "content",
} as const;

const REGION_TARGET = {
	bottom: "bottom",
	contents: "contents",
	header: "header",
	unknown: "contents",
} as const;
