import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClaudeRunner } from "@cx/agent/claude";
import type {
	AgentPromptArtifact,
	AgentRunner,
	AgentRunnerRequest,
	AgentRunResult,
	AgentTaskKind,
} from "@cx/agent/contract";
import { agentTaskCatalog } from "@cx/agent/tasks";
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
import { contract, definePipeline, defineStep, refInput, stepOutput } from "../../definition";
import { createFilePipelinePersistenceAdapter } from "../../persistence";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";
import type {
	PipelineDefinition,
	PipelineFeedbackRule,
	PipelineMarkdownSourceFile,
	PipelinePersistenceAdapter,
	PipelineRunResult,
	PipelineStageId,
	ResolvedStepInputs,
	ScreenGenerationPipelineOptions,
	ScreenGenerationReferences,
	ScreenGenerationSkillBundleRef,
	SideEffectCommandResult,
	SideEffectExecutionResult,
	StepAgentAdapter,
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

type ScreenGenerationExecutableStageId = Exclude<PipelineStageId, ScreenGenerationAiStageId>;
type ScreenGenerationAiStageId =
	| "derive-screen-intent"
	| "generate-render-tree"
	| "plan-composition"
	| "propose-components"
	| "review-quality"
	| "revise-render-tree-if-invalid"
	| "select-pattern";
type ScreenGenerationStageExecutor = (state: ScreenGenerationPipelineState) => Promise<void> | void;
type ScreenGenerationAiStepRunner = (
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
) => Promise<unknown>;

const screenGenerationStepExecutors = {
	"derive-decoration-plan": runDeriveDecorationPlanStage,
	"parse-source": runParseSourceStage,
	"read-source": runReadSourceStage,
	"validate-render-tree": runValidateRenderTreeStage,
	"validate-render-tree-after-revision": runValidateRenderTreeAfterRevisionStage,
	"write-artifacts": runWriteArtifactsStage,
} satisfies Record<ScreenGenerationExecutableStageId, ScreenGenerationStageExecutor>;

const screenGenerationAiStepRunners = {
	"derive-screen-intent": runDeriveScreenIntentAiStep,
	"generate-render-tree": runGenerateRenderTreeAiStep,
	"plan-composition": runPlanCompositionAiStep,
	"propose-components": runProposeComponentsAiStep,
	"review-quality": runReviewQualityAiStep,
	"revise-render-tree-if-invalid": runReviseRenderTreeIfInvalidAiStep,
	"select-pattern": runSelectPatternAiStep,
} satisfies Record<ScreenGenerationAiStageId, ScreenGenerationAiStepRunner>;

const screenGenerationAiStageIds = new Set<PipelineStageId>(
	Object.keys(screenGenerationAiStepRunners) as ScreenGenerationAiStageId[],
);

const SCREEN_GENERATION_STAGE_OUTPUT_CONTRACTS = {
	"derive-decoration-plan": "decoration-plan-result",
	"derive-screen-intent": "screen-intent",
	"generate-render-tree": "screen-generation-agent-result",
	"parse-source": "source-spec-parse-result",
	"plan-composition": "composition-plan-result",
	"propose-components": "component-proposal",
	"read-source": "source-file",
	"review-quality": "quality-inspection",
	"revise-render-tree-if-invalid": "screen-generation-agent-result",
	"select-pattern": "pattern-selection",
	"validate-render-tree": "validation-report",
	"validate-render-tree-after-revision": "validation-report",
	"write-artifacts": "pipeline-artifact-write-result",
} as const satisfies Record<PipelineStageId, string>;

const SCREEN_GENERATION_AI_TASK_BY_STAGE = {
	"derive-screen-intent": "screen-intent",
	"generate-render-tree": "screen-generation",
	"plan-composition": "composition-planning",
	"propose-components": "component-proposal",
	"review-quality": "quality-review",
	"revise-render-tree-if-invalid": "screen-revision",
	"select-pattern": "pattern-selection",
} as const satisfies Record<ScreenGenerationAiStageId, AgentTaskKind>;

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
		steps: definition.stages.map((stage) => createScreenGenerationStep(state, stage)),
	});

	await runStepPipeline(pipeline, {
		agent: createScreenGenerationStepAgentAdapter(state),
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

function createScreenGenerationStep(state: ScreenGenerationPipelineState, stage: PipelineStageId) {
	if (isScreenGenerationAiStage(stage)) {
		return defineStep({
			id: stage,
			inputs: createScreenGenerationStepInputs(stage),
			output: {
				result: contract(SCREEN_GENERATION_STAGE_OUTPUT_CONTRACTS[stage]),
			},
			prompt: createScreenGenerationStepPrompt(stage),
			skipWhen: () => shouldSkipScreenGenerationStage(state, stage),
			usesAI: true,
		});
	}

	return defineStep({
		execute: async () => {
			await screenGenerationStepExecutors[stage](state);
			return readScreenGenerationStageOutput(state, stage);
		},
		id: stage,
		inputs: createScreenGenerationStepInputs(stage),
		output: {
			result: contract(SCREEN_GENERATION_STAGE_OUTPUT_CONTRACTS[stage]),
		},
		skipWhen: () => shouldSkipScreenGenerationStage(state, stage),
		usesAI: false,
	});
}

function createScreenGenerationStepPrompt(stage: ScreenGenerationAiStageId): AgentPromptArtifact {
	const taskKind = SCREEN_GENERATION_AI_TASK_BY_STAGE[stage];
	return agentTaskCatalog[taskKind].createPrompt({
		context: {
			pipelineId: "screen-generation",
			stage,
		},
		query: `Runtime query is built by the ${stage} inference node.`,
	});
}

function createScreenGenerationStepAgentAdapter(
	state: ScreenGenerationPipelineState,
): StepAgentAdapter {
	const realRunner = createClaudeRunner({ localFirst: true });

	return async ({ inputs, step }) => {
		const stage = step.id;
		if (!isScreenGenerationAiStage(stage)) {
			throw new Error(`Screen generation step is not an AI stage: ${stage}`);
		}

		return screenGenerationAiStepRunners[stage](
			inputs,
			state,
			state.options.agentMode === "claude-local-first"
				? realRunner
				: createFakeAgentRunner(state, stage),
		);
	};
}

function isScreenGenerationAiStage(
	stage: PipelineStageId | string,
): stage is ScreenGenerationAiStageId {
	return screenGenerationAiStageIds.has(stage as PipelineStageId);
}

function createFakeAgentRunner(
	state: ScreenGenerationPipelineState,
	stage: ScreenGenerationAiStageId,
): AgentRunner {
	const runners = {
		"derive-screen-intent": async (request) => {
			const sourceSpec = requireSourceSpec(state);
			return {
				payload: createFakeScreenIntent(sourceSpec),
				session: {
					mode: request.session?.mode ?? "new",
					sessionId: request.session?.sessionId,
				},
				taskKind: request.taskKind,
			};
		},
		"generate-render-tree": createFakeGenerationAgentRunner({
			onRequest: () => undefined,
		}),
		"plan-composition": async (request) => {
			const sourceSpec = requireSourceSpec(state);
			const layerCandidates =
				state.patternLayerCandidates ??
				buildScreenGenerationPatternLayerCandidates(state, sourceSpec);
			const designSkillSelection =
				state.designSkillSelection ??
				runDesignSkillSelectionNode({
					layerCandidates,
					screenIntent: state.screenIntentAgentResult?.payload,
					sourceSpec,
				});
			return {
				payload: createFakeCompositionPlan(sourceSpec, layerCandidates, designSkillSelection),
				session: {
					mode: request.session?.mode ?? "new",
					sessionId: request.session?.sessionId,
				},
				taskKind: request.taskKind,
			};
		},
		"propose-components": async (request) => ({
			payload: createFakeComponentProposal(),
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		}),
		"review-quality": async (request) => ({
			payload: createFakeQualityInspection(state.validationReport),
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		}),
		"revise-render-tree-if-invalid": async (request) => ({
			payload: state.agentResult?.payload,
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		}),
		"select-pattern": async (request) => {
			const sourceSpec = requireSourceSpec(state);
			const layerCandidates =
				state.patternLayerCandidates ??
				buildScreenGenerationPatternLayerCandidates(state, sourceSpec);
			return {
				payload: createFakePatternSelection(layerCandidates),
				session: {
					mode: request.session?.mode ?? "new",
					sessionId: request.session?.sessionId,
				},
				taskKind: request.taskKind,
			};
		},
	} satisfies Record<ScreenGenerationAiStageId, AgentRunner>;

	return runners[stage];
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
		componentCatalogs: refInput("componentCatalogs"),
		designContextBundles: refInput("designContextBundles"),
		layoutCatalogs: refInput("layoutCatalogs"),
		skillBundles: refInput("skillBundles"),
	};
	const inputs = {
		"derive-decoration-plan": {
			composition: stepOutput("plan-composition", "result"),
			layoutCatalogs: externalRefs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		"derive-screen-intent": {
			source: stepOutput("parse-source", "result"),
		},
		"generate-render-tree": {
			componentCatalogs: externalRefs.componentCatalogs,
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: externalRefs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: externalRefs.layoutCatalogs,
			pattern: stepOutput("select-pattern", "result"),
			skillBundles: externalRefs.skillBundles,
			source: stepOutput("parse-source", "result"),
		},
		"parse-source": {
			source: stepOutput("read-source", "result"),
		},
		"plan-composition": {
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: externalRefs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		"propose-components": {
			candidate: stepOutput("generate-render-tree", "result"),
			componentCatalogs: externalRefs.componentCatalogs,
			designContextBundles: externalRefs.designContextBundles,
			validation: stepOutput("validate-render-tree", "result"),
		},
		"read-source": undefined,
		"review-quality": {
			candidate: stepOutput("generate-render-tree", "result"),
			componentCatalogs: externalRefs.componentCatalogs,
			designContextBundles: externalRefs.designContextBundles,
			validation: stepOutput("validate-render-tree", "result"),
		},
		"revise-render-tree-if-invalid": {
			componentCatalogs: externalRefs.componentCatalogs,
			designContextBundles: externalRefs.designContextBundles,
			generation: stepOutput("generate-render-tree", "result"),
			quality: stepOutput("review-quality", "result"),
			validation: stepOutput("validate-render-tree", "result"),
		},
		"select-pattern": {
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: externalRefs.designContextBundles,
			layoutCatalogs: externalRefs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		"validate-render-tree": {
			componentCatalogs: externalRefs.componentCatalogs,
			target: stepOutput("generate-render-tree", "result"),
		},
		"validate-render-tree-after-revision": {
			componentCatalogs: externalRefs.componentCatalogs,
			target: stepOutput("revise-render-tree-if-invalid", "result"),
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

async function runDeriveScreenIntentAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const nodeResult = await runScreenIntentNode({
		runner,
		sourceSpec,
	});

	state.screenIntentAgentInput = nodeResult.agentInput;
	state.screenIntentAgentResult = nodeResult.agentResult;
	state.screenIntentRunnerRequest = nodeResult.runnerRequest;
	return readScreenGenerationStageOutput(state, "derive-screen-intent");
}

async function runPlanCompositionAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const screenIntent = inputs.intent ?? state.screenIntentAgentResult?.payload;
	const layerCandidates = buildScreenGenerationPatternLayerCandidates(state, sourceSpec);
	const designSkillSelection = runDesignSkillSelectionNode({
		layerCandidates,
		screenIntent,
		sourceSpec,
	});
	const nodeResult = await runCompositionPlanNode({
		designSkillSelection,
		layerCandidates,
		runner,
		screenIntent,
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
		screenIntent,
		sourceSpec,
	});
	return readScreenGenerationStageOutput(state, "plan-composition");
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

async function runSelectPatternAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = readRecordInput(inputs.composition);
	const decoration = readRecordInput(inputs.decoration);
	const layerCandidates =
		state.patternLayerCandidates ?? buildScreenGenerationPatternLayerCandidates(state, sourceSpec);
	const nodeResult = await runPatternSelectionNode({
		compositionPlan: composition?.compositionPlan ?? state.compositionPlanAgentResult?.payload,
		decorationPlan:
			(decoration?.decorationPlan as DecorationPlanContract | undefined) ?? state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designSkillSelection: state.designSkillSelection,
		layerCandidates,
		runner,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
	});

	state.patternLayerCandidates = layerCandidates;
	state.patternSelectionAgentInput = nodeResult.agentInput;
	state.patternSelectionAgentResult = nodeResult.agentResult;
	state.patternSelectionRunnerRequest = nodeResult.runnerRequest;
	return readScreenGenerationStageOutput(state, "select-pattern");
}

async function runGenerateRenderTreeAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = readRecordInput(inputs.composition);
	const decoration = readRecordInput(inputs.decoration);
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
	const nodeResult = await runScreenGenerationNode({
		componentContractCatalog,
		compositionPlan: composition?.compositionPlan ?? state.compositionPlanAgentResult?.payload,
		decorationPlan:
			(decoration?.decorationPlan as DecorationPlanContract | undefined) ?? state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: inputs.pattern ?? state.patternSelectionAgentResult?.payload,
		runner,
		screenIntent: inputs.intent ?? state.screenIntentAgentResult?.payload,
		sourceSpec,
	});

	state.agentInput = nodeResult.agentInput;
	state.agentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.runnerRequest = nodeResult.runnerRequest;
	return readScreenGenerationStageOutput(state, "generate-render-tree");
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

async function runProposeComponentsAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = requireSourceSpec(state);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		state,
		sourceSpec,
		state.patternLayerCandidates ?? [],
	);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const nodeResult = await runComponentProposalNode({
		candidate: inputs.candidate ?? state.agentResult?.payload,
		componentContractCatalog,
		compositionPlan: state.compositionPlanAgentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelectionAgentResult?.payload,
		runner,
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
	return readScreenGenerationStageOutput(state, "propose-components");
}

async function runReviewQualityAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = requireSourceSpec(state);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const nodeResult = await runQualityReviewNode({
		candidate: inputs.candidate ?? state.agentResult?.payload,
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
		runner,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
		validationReport:
			(inputs.validation as ValidationReportContract | undefined) ?? state.validationReport,
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
	return readScreenGenerationStageOutput(state, "review-quality");
}

async function runReviseRenderTreeIfInvalidAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	if (state.generationNextAction?.action !== "request-revision") {
		return readScreenGenerationStageOutput(state, "revise-render-tree-if-invalid");
	}

	const sourceSpec = requireSourceSpec(state);
	const previousCandidate = inputs.generation ?? state.agentResult?.payload;
	state.preRevisionAgentResult = state.agentResult;
	state.preRevisionValidationReport = state.validationReport;
	state.designContextBundleContents = await loadBundleContentsForState(state);
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
		qualityInspection: inputs.quality ?? state.qualityReviewAgentResult?.payload,
		runner,
		screenIntent: state.screenIntentAgentResult?.payload,
		sourceSpec,
		validationReport:
			(inputs.validation as ValidationReportContract | undefined) ?? state.validationReport,
	});

	state.revisionAgentInput = nodeResult.agentInput;
	state.revisionAgentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.revisionRunnerRequest = nodeResult.runnerRequest;
	state.agentResult = state.revisionAgentResult;
	return readScreenGenerationStageOutput(state, "revise-render-tree-if-invalid");
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

function readSourceSpecInput(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
): SourceSpec {
	const source = inputs.source;
	if (isRecord(source) && "sourceShape" in source) return source as SourceSpec;
	if (isRecord(source) && "sourceSpec" in source && isRecord(source.sourceSpec)) {
		return source.sourceSpec as SourceSpec;
	}
	return requireSourceSpec(state);
}

function readRecordInput(input: unknown): Record<string, unknown> | undefined {
	return isRecord(input) ? input : undefined;
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
