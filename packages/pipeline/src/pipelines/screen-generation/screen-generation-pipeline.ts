import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
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
} from "@cx/inference-nodes/screen-generation";
import {
	createFakeComponentProposal,
	createFakeCompositionPlan,
	createFakeGenerationAgentRunner,
	createFakePatternSelection,
	createFakeQualityInspection,
	createFakeScreenIntent,
	createRenderTreeValidationReport,
	runComponentProposalNode,
	runCompositionPlanNode,
	runDecorationPlanNode,
	runDesignContextBundleRefsNode,
	runDesignSkillSelectionNode,
	runGenerationNextActionNode,
	runPatternLayerCandidatesNode,
	runPatternSelectionNode,
	runQualityReviewNode,
	runRequiredRegionLayoutRepairNode,
	runScreenGenerationNode,
	runScreenIntentNode,
	runScreenRevisionNode,
} from "@cx/inference-nodes/screen-generation";
import type {
	DecorationPlanContract,
	DesignContextBundleContent,
	DesignSkillSelectionContract,
	SourceSpec,
	ValidationReportContract,
} from "@cx/schema";
import { validateComponentProposal } from "@cx/validation";

import { createNodePipelineAdapters } from "../../adapters";
import { runParseMarkdownSourceCommand } from "../../commands";
import { definePipeline, defineStep, from } from "../../definition";
import { createFilePipelinePersistenceAdapter } from "../../persistence";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";
import type {
	PipelineDefinition,
	PipelineFeedbackRule,
	PipelineMarkdownSourceFile,
	PipelinePersistenceAdapter,
	PipelineRunResult,
	PipelineStageId,
	ScreenGenerationPipelineOptions,
	ScreenGenerationReferences,
	ScreenGenerationSkillBundleRef,
	SideEffectCommandResult,
	SideEffectExecutionResult,
	StepInputRef,
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
import {
	createDefaultScreenGenerationReferences,
	mergeScreenGenerationReferences,
} from "./references";

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
	generationSkillCatalog?: ScreenGenerationSkillBundleRef[];
	initialValidationReport?: ValidationReportContract;
	options: NormalizedScreenGenerationPipelineOptions;
	parseCommandResult?: ReturnType<typeof runParseMarkdownSourceCommand>;
	patternLayerCandidates?: PatternLayerCandidate[];
	patternSelectionAgentInput?: PatternSelectionAgentInput;
	patternSelectionAgentResult?: AgentRunResult;
	patternSelectionRunnerRequest?: AgentRunnerRequest;
	pipelineResult?: SideEffectExecutionResult;
	pipelineResultWrite?: SideEffectExecutionResult;
	preRevisionAgentResult?: AgentRunResult;
	preRevisionValidationReport?: ValidationReportContract;
	qualityReviewAgentInput?: QualityReviewAgentInput;
	qualityReviewAgentResult?: AgentRunResult;
	qualityReviewRunnerRequest?: AgentRunnerRequest;
	revisionAgentInput?: ScreenRevisionAgentInput;
	revisionAgentResult?: AgentRunResult;
	revisionRunnerRequest?: AgentRunnerRequest;
	renderTreeGenerationSkill?: ScreenGenerationSkillBundleRef;
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
	onProgress: NonNullable<ScreenGenerationPipelineOptions["onProgress"]>;
	outDir: string;
	persistence?: PipelinePersistenceAdapter;
	references: ScreenGenerationReferences;
	runDir: string;
	runId: string;
	sourceKind: PipelineMarkdownSourceFile["kind"];
	sourcePath: string;
	tags: string[];
};

type ScreenGenerationStageExecutor = (state: ScreenGenerationPipelineState) => Promise<void> | void;

const screenGenerationStepExecutors = {
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
	"validate-render-tree-after-revision": runValidateRenderTreeAfterRevisionStage,
	"write-artifacts": runWriteArtifactsStage,
} satisfies Record<PipelineStageId, ScreenGenerationStageExecutor>;

export async function runScreenGenerationPipeline(
	definition: PipelineDefinition,
	options: ScreenGenerationPipelineOptions,
): Promise<PipelineRunResult> {
	const state: ScreenGenerationPipelineState = {
		options: normalizeScreenGenerationPipelineOptions(options),
	};
	await runScreenGenerationStepRunner(definition, state);

	assertScreenGenerationCompleted(state);

	return createScreenGenerationPipelineResult(state);
}

async function runScreenGenerationStepRunner(
	definition: PipelineDefinition,
	state: ScreenGenerationPipelineState,
): Promise<void> {
	const pipeline = definePipeline({
		feedback: [createScreenGenerationFeedbackRule(state)],
		id: definition.id,
		steps: definition.stages.map((stage) =>
			defineStep({
				execute: async () => {
					await screenGenerationStepExecutors[stage](state);
					return readScreenGenerationStageOutput(state, stage);
				},
				id: stage,
				inputs: createScreenGenerationStepInputs(stage),
				skipWhen: () => shouldSkipScreenGenerationStage(state, stage),
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
		refs: {
			componentCatalogs: state.options.references.componentCatalogs,
			designContextBundles: state.options.references.designContextBundles,
			layoutCatalogs: state.options.references.layoutCatalogs,
			skillBundles: state.options.references.skillBundles,
		},
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

function createScreenGenerationStepInputs(
	stage: PipelineStageId,
): Record<string, StepInputRef> | undefined {
	const externalRefs = {
		componentCatalogs: from("ref.componentCatalogs"),
		designContextBundles: from("ref.designContextBundles"),
		layoutCatalogs: from("ref.layoutCatalogs"),
		skillBundles: from("ref.skillBundles"),
	};
	const inputs = {
		"derive-decoration-plan": {
			layoutCatalogs: externalRefs.layoutCatalogs,
		},
		"derive-screen-intent": undefined,
		"generate-render-tree": externalRefs,
		"parse-source": undefined,
		"plan-composition": {
			layoutCatalogs: externalRefs.layoutCatalogs,
		},
		"propose-components": {
			componentCatalogs: externalRefs.componentCatalogs,
			designContextBundles: externalRefs.designContextBundles,
		},
		"read-source": undefined,
		"review-quality": {
			componentCatalogs: externalRefs.componentCatalogs,
			designContextBundles: externalRefs.designContextBundles,
		},
		"revise-render-tree-if-invalid": {
			componentCatalogs: externalRefs.componentCatalogs,
			designContextBundles: externalRefs.designContextBundles,
		},
		"select-pattern": {
			designContextBundles: externalRefs.designContextBundles,
			layoutCatalogs: externalRefs.layoutCatalogs,
		},
		"validate-render-tree": {
			componentCatalogs: externalRefs.componentCatalogs,
		},
		"validate-render-tree-after-revision": {
			componentCatalogs: externalRefs.componentCatalogs,
		},
		"write-artifacts": undefined,
	} satisfies Record<PipelineStageId, Record<string, StepInputRef> | undefined>;

	return inputs[stage];
}

function createScreenGenerationFeedbackRule(
	state: ScreenGenerationPipelineState,
): PipelineFeedbackRule {
	const rule: PipelineFeedbackRule = {
		fromStep: "review-quality",
		goTo: "revise-render-tree-if-invalid",
		id: "quality-revision",
		maxRetries: 1,
		thenStep: "validate-render-tree-after-revision",
		when: () => state.generationNextAction?.action === "request-revision",
	};
	return rule;
}

function shouldSkipScreenGenerationStage(
	state: ScreenGenerationPipelineState,
	stage: PipelineStageId,
): boolean {
	if (
		state.parseCommandResult &&
		!state.parseCommandResult.parseResult.ok &&
		stage !== "write-artifacts"
	) {
		return true;
	}
	if (stage === "revise-render-tree-if-invalid") {
		return state.generationNextAction?.action !== "request-revision";
	}
	if (stage === "validate-render-tree-after-revision") {
		return !state.revisionAgentResult;
	}
	return false;
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
	const layerCandidates = buildScreenGenerationPatternLayerCandidates(state, sourceSpec);
	const designSkillSelection = runDesignSkillSelectionNode({
		layerCandidates,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runCompositionPlanNode({
		designSkillSelection,
		layerCandidates,
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: async (request) => ({
						payload: createFakeCompositionPlan(sourceSpec, layerCandidates, designSkillSelection),
						session: {
							mode: request.session?.mode ?? "new",
							sessionId: request.session?.sessionId,
						},
						taskKind: request.taskKind,
					}),
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});

	state.patternLayerCandidates = layerCandidates;
	state.designSkillSelection = designSkillSelection;
	state.compositionPlanAgentInput = nodeResult.agentInput;
	state.compositionPlanAgentResult = nodeResult.agentResult;
	state.compositionPlanRunnerRequest = nodeResult.runnerRequest;
	state.designContextBundleSelection = runDesignContextBundleRefsNode({
		compositionPlan: state.compositionPlanAgentResult.payload,
		layerCandidates,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});
}

function runDeriveDecorationPlanStage(state: ScreenGenerationPipelineState): void {
	const sourceSpec = requireSourceSpec(state);
	state.decorationPlan = runDecorationPlanNode({
		compositionPlan: state.compositionPlanAgentResult?.payload,
		sourceSpec,
	});
	state.patternLayerCandidates = buildScreenGenerationPatternLayerCandidates(
		state,
		sourceSpec,
		state.decorationPlan,
	);
}

async function runSelectPatternStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const layerCandidates =
		state.patternLayerCandidates ?? buildScreenGenerationPatternLayerCandidates(state, sourceSpec);
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runPatternSelectionNode({
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designSkillSelection: state.designSkillSelection,
		layerCandidates,
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: async (request) => ({
						payload: createFakePatternSelection(layerCandidates),
						session: {
							mode: request.session?.mode ?? "new",
							sessionId: request.session?.sessionId,
						},
						taskKind: request.taskKind,
					}),
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});

	state.patternLayerCandidates = layerCandidates;
	state.patternSelectionAgentInput = nodeResult.agentInput;
	state.patternSelectionAgentResult = nodeResult.agentResult;
	state.patternSelectionRunnerRequest = nodeResult.runnerRequest;
}

async function runGenerateRenderTreeStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	state.generationSkillCatalog ??= await state.options.references.skillBundles.loadCatalog();
	state.renderTreeGenerationSkill = findGenerationSkill(
		state.generationSkillCatalog,
		"render-tree-generation",
	);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		state,
		sourceSpec,
		state.patternLayerCandidates ?? [],
	);
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runScreenGenerationNode({
		componentContractCatalog,
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: createFakeGenerationAgentRunner({
						onRequest: () => undefined,
					}),
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});

	state.agentInput = nodeResult.agentInput;
	state.agentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.runnerRequest = nodeResult.runnerRequest;
}

function runValidateRenderTreeStage(state: ScreenGenerationPipelineState): void {
	state.validationReport = createRenderTreeValidationReport(state.agentResult?.payload, {
		allowedLayoutIds: state.patternLayerCandidates?.map((candidate) => candidate.layout),
		componentCatalog: state.options.references.componentCatalogs.validationCatalog,
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec: state.sourceSpec,
	});
	state.initialValidationReport ??= state.validationReport;
	if (state.sourceSpec) {
		state.designContextBundleSelection = runDesignContextBundleRefsNode({
			compositionPlan: state.compositionPlanAgentResult?.payload,
			layerCandidates: state.patternLayerCandidates,
			screenIntent: state.screenIntentAgentResult?.payload,
			sourceSpec: state.sourceSpec,
			validationReport: state.validationReport,
		});
	}
}

function runValidateRenderTreeAfterRevisionStage(state: ScreenGenerationPipelineState): void {
	runValidateRenderTreeStage(state);
	if (!state.preRevisionAgentResult || !state.preRevisionValidationReport) return;
	if (!isValidationWorse(state.validationReport, state.preRevisionValidationReport)) return;

	state.agentResult = state.preRevisionAgentResult;
	state.validationReport = state.preRevisionValidationReport;
}

async function runProposeComponentsStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		state,
		sourceSpec,
		state.patternLayerCandidates ?? [],
	);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runComponentProposalNode({
		candidate: state.agentResult?.payload,
		componentContractCatalog,
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: async (request) => ({
						payload: createFakeComponentProposal(),
						session: {
							mode: request.session?.mode ?? "new",
							sessionId: request.session?.sessionId,
						},
						taskKind: request.taskKind,
					}),
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});

	state.componentProposalAgentInput = nodeResult.agentInput;
	state.componentProposalAgentResult = nodeResult.agentResult;
	state.componentProposalRunnerRequest = nodeResult.runnerRequest;
	// 제안은 비파괴 아티팩트다. 검증은 bounded 여부만 리포트하고 파이프라인을 실패시키지 않는다.
	// allowedRefs는 source reference catalog(생성 입력 context)의 전체 vocabulary를 기준으로 한다.
	state.componentProposalValidationReport = validateComponentProposal(
		state.componentProposalAgentResult.payload,
		{
			allowedRefs: nodeResult.agentInput.context.sourceReferenceCatalog.allowedRefs,
			catalogComponentTypes: componentContractCatalog.entries.map((entry) => entry.componentType),
		},
	);
}

async function runReviewQualityStage(state: ScreenGenerationPipelineState): Promise<void> {
	const sourceSpec = requireSourceSpec(state);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runQualityReviewNode({
		candidate: state.agentResult?.payload,
		componentContractCatalog: buildSourceComponentContractCatalog(
			state,
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
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: async (request) => ({
						payload: createFakeQualityInspection(state.validationReport),
						session: {
							mode: request.session?.mode ?? "new",
							sessionId: request.session?.sessionId,
						},
						taskKind: request.taskKind,
					}),
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
		validationReport: state.validationReport,
	});

	state.qualityReviewAgentInput = nodeResult.agentInput;
	state.qualityReviewAgentResult = nodeResult.agentResult;
	state.qualityReviewRunnerRequest = nodeResult.runnerRequest;
	state.generationNextAction = runGenerationNextActionNode({
		initialValidationReport: state.initialValidationReport,
		qualityInspection: state.qualityReviewAgentResult.payload,
		retryCount: state.revisionAgentResult ? 1 : 0,
		validationReport: state.validationReport,
	});
}

async function runReviseRenderTreeIfInvalidStage(
	state: ScreenGenerationPipelineState,
): Promise<void> {
	if (state.generationNextAction?.action !== "request-revision") return;

	const sourceSpec = requireSourceSpec(state);
	const previousCandidate = state.agentResult?.payload;
	state.preRevisionAgentResult = state.agentResult;
	state.preRevisionValidationReport = state.validationReport;
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const realRunner = createClaudeRunner({ localFirst: true });
	const nodeResult = await runScreenRevisionNode({
		componentContractCatalog: buildSourceComponentContractCatalog(
			state,
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
		runner:
			state.options.agentMode === "claude-local-first"
				? realRunner
				: async (request) => ({
						payload: previousCandidate,
						session: {
							mode: request.session?.mode ?? "new",
							sessionId: request.session?.sessionId,
						},
						taskKind: request.taskKind,
					}),
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
		validationReport: state.validationReport,
	});

	state.revisionAgentInput = nodeResult.agentInput;
	state.revisionAgentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.revisionRunnerRequest = nodeResult.runnerRequest;
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
		onProgress: options.onProgress ?? (() => undefined),
		...paths,
		persistence,
		references: mergeScreenGenerationReferences(
			createDefaultScreenGenerationReferences(),
			options.references,
		),
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
	state: ScreenGenerationPipelineState,
	sourceSpec: SourceSpec,
	decorationPlan?: DecorationPlanContract,
): PatternLayerCandidate[] {
	return runPatternLayerCandidatesNode({
		decorationPlan,
		resolver: {
			resolveComponentLayout: state.options.references.layoutCatalogs.resolveComponentLayout,
			resolveRegionLayout: state.options.references.layoutCatalogs.resolveRegionLayout,
		},
		sourceSpec,
	});
}

function buildSourceComponentContractCatalog(
	state: ScreenGenerationPipelineState,
	sourceSpec: SourceSpec,
	layerCandidates: PatternLayerCandidate[],
): ComponentContractCatalog {
	const componentCatalogs = state.options.references.componentCatalogs;
	const entries = sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => {
				const componentType = component.componentType ?? component.sourceComponentId;
				const componentEntry = componentCatalogs.getEntry(componentType);
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
			(entry) => componentCatalogs.getEntry(entry.componentType)?.type ?? entry.componentType,
		),
	);
	const available = componentCatalogs
		.getTypes()
		.filter((type) => !entryCanonicalTypes.has(type))
		.filter((type) => !type.startsWith("Layout.") && type !== "PageStack")
		.map((type) => {
			const entry = componentCatalogs.getEntry(type);
			return {
				componentType: type,
				status: componentCatalogs.getStatus(type) ?? ("stable" as const),
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

function extractPayloadArtifact(payload: unknown, key: "renderTree" | "tableGenerationResult") {
	if (!isRecord(payload)) return key === "renderTree" ? payload : undefined;
	return payload[key] ?? (key === "renderTree" ? payload : undefined);
}

async function loadBundleContentsForState(
	state: ScreenGenerationPipelineState,
): Promise<DesignContextBundleContent[]> {
	if (state.options.disableDesignContext) return [];
	return state.options.references.designContextBundles.loadContents(
		state.designContextBundleSelection?.bundleRefs ?? [],
	);
}

function findGenerationSkill(
	catalog: ScreenGenerationSkillBundleRef[],
	stage: ScreenGenerationSkillBundleRef["stage"],
): ScreenGenerationSkillBundleRef | undefined {
	return catalog.find((skill) => skill.stage === stage);
}

function isValidationWorse(
	current: ValidationReportContract | undefined,
	previous: ValidationReportContract,
): boolean {
	return readValidationErrorCount(current) > readValidationErrorCount(previous);
}

function readValidationErrorCount(report: ValidationReportContract | undefined): number {
	return report?.summary.errorCount ?? Number.POSITIVE_INFINITY;
}

function repairAgentRunResultPayload(result: AgentRunResult): AgentRunResult {
	return {
		...result,
		payload: runRequiredRegionLayoutRepairNode(result.payload),
	};
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}
