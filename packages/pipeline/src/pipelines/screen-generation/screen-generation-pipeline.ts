import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunner, AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
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
import { isRecord } from "@cx/types/guards";
import { validateComponentProposal } from "@cx/validation";

import { createNodePipelineAdapters } from "../../adapters";
import { runParseMarkdownSourceCommand } from "../../commands";
import { definePipeline, defineStep } from "../../definition";
import { createFilePipelinePersistenceAdapter } from "../../persistence";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";
import type {
	ArtifactStorePreset,
	PipelineFeedbackRule,
	PipelineMarkdownSourceFile,
	PipelinePersistenceAdapter,
	PipelineRunResult,
	PipelineStageId,
	ReferenceResolver,
	ResolvedStepInputs,
	ScreenGenerationComponentCatalogRefs,
	ScreenGenerationLayoutCatalogRefs,
	ScreenGenerationPipelineOptions,
	ScreenGenerationReferences,
	ScreenGenerationSkillBundleRef,
	SideEffectCommandResult,
	SideEffectExecutionResult,
	StepAgentAdapter,
	StepPipelineDefinition,
} from "../../public/types";
import { runSideEffects } from "../../runner";
import { runStepPipeline } from "../../runtime/run-step-pipeline";
import {
	ARTIFACT_FILES,
	createGenerationSmokeArtifactCommands,
	createGenerationSmokeManifestCommand,
	createGenerationSmokePipelineResultCommands,
} from "./artifact-commands";
import {
	createScreenGenerationStageLayers,
	isScreenGenerationAiStageDescriptor,
	SCREEN_GENERATION_PIPELINE_ID,
	SCREEN_GENERATION_STAGE_DESCRIPTORS,
	type ScreenGenerationStageDescriptor,
	type ScreenGenerationStageSkipPolicy,
} from "./descriptor";
import {
	createDefaultScreenGenerationReferences,
	mergeScreenGenerationReferences,
} from "./references";

const CLIENT_IMPORT_ROOT = "data/client-imports";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");

/**
 * One AI stage's agent triple (input / result / runner request). Replaces the
 * flat `xxxAgentInput`/`xxxAgentResult`/`xxxRunnerRequest` fan-out that used to
 * spread across the pipeline state. Each stage owns one of these.
 */
type AgentStep<TInput> = {
	agentInput?: TInput;
	agentResult?: AgentRunResult;
	runnerRequest?: AgentRunnerRequest;
};

type ScreenGenerationPipelineState = {
	// Per-stage agent triples (always present; populated as stages run).
	compositionPlan: AgentStep<CompositionPlanAgentInput>;
	componentProposal: AgentStep<ComponentProposalAgentInput>;
	/** Render-tree generation. `generation.agentResult` is the live candidate (revision overwrites it). */
	generation: AgentStep<ScreenGenerationAgentInput>;
	patternSelection: AgentStep<PatternSelectionAgentInput>;
	qualityReview: AgentStep<QualityReviewAgentInput>;
	revision: AgentStep<ScreenRevisionAgentInput>;
	screenIntent: AgentStep<ScreenIntentAgentInput>;
	// Non-agent scaffolding produced by deterministic/effect stages.
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
	pipelineResult?: SideEffectExecutionResult;
	pipelineResultWrite?: SideEffectExecutionResult;
	preRevisionAgentResult?: AgentRunResult;
	preRevisionValidationReport?: ValidationReportContract;
	renderTreeGenerationSkill?: ScreenGenerationSkillBundleRef;
	sourceFile?: PipelineMarkdownSourceFile;
	sourceReadResult?: SideEffectExecutionResult;
	sourceSpec?: SourceSpec;
	stageOrder?: PipelineStageId[];
	validationReport?: ValidationReportContract;
};

const EMPTY_AGENT_STEPS = (): Pick<
	ScreenGenerationPipelineState,
	| "compositionPlan"
	| "componentProposal"
	| "generation"
	| "patternSelection"
	| "qualityReview"
	| "revision"
	| "screenIntent"
> => ({
	compositionPlan: {},
	componentProposal: {},
	generation: {},
	patternSelection: {},
	qualityReview: {},
	revision: {},
	screenIntent: {},
});

/** Flatten one agent step back to the public `<prefix>Agent*` field shape. */
function flattenAgentStep(prefix: string, step: AgentStep<unknown>): Record<string, unknown> {
	return {
		[`${prefix}AgentInput`]: step.agentInput,
		[`${prefix}AgentResult`]: step.agentResult,
		[`${prefix}RunnerRequest`]: step.runnerRequest,
	};
}

/**
 * The agent-step fields shared by the pipeline result and the artifact trace.
 * Generation keeps the legacy unprefixed names; the rest stay `<prefix>Agent*`.
 * componentProposal is artifact-only and added by its single consumer.
 */
function projectCommonAgentSteps(state: ScreenGenerationPipelineState): Record<string, unknown> {
	return {
		agentInput: state.generation.agentInput,
		agentResult: state.generation.agentResult,
		runnerRequest: state.generation.runnerRequest,
		...flattenAgentStep("screenIntent", state.screenIntent),
		...flattenAgentStep("compositionPlan", state.compositionPlan),
		...flattenAgentStep("patternSelection", state.patternSelection),
		...flattenAgentStep("qualityReview", state.qualityReview),
		...flattenAgentStep("revision", state.revision),
	};
}

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

type ScreenGenerationAiStageId = Extract<
	(typeof SCREEN_GENERATION_STAGE_DESCRIPTORS)[number],
	{ kind: "ai" }
>["id"];
type ScreenGenerationStageExecutor = (
	state: ScreenGenerationPipelineState,
) => Promise<unknown> | unknown;
type ScreenGenerationAiStepRunner = (
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
) => Promise<unknown>;

type ScreenGenerationNonAiStageId = Exclude<PipelineStageId, ScreenGenerationAiStageId>;

/**
 * Stage runtime binding keyed by stage id. The kind↔runtime correspondence is
 * enforced at compile time: ai stages must expose `runAi`, the rest must expose
 * `run`. A missing or mismatched binding fails `satisfies`, so no runtime
 * coverage assertion or per-call guards are needed.
 */
type ScreenGenerationStageRuntimes = {
	[K in ScreenGenerationAiStageId]: { runAi: ScreenGenerationAiStepRunner };
} & {
	[K in ScreenGenerationNonAiStageId]: { run: ScreenGenerationStageExecutor };
};

const screenGenerationStageRuntimes = {
	"derive-decoration-plan": { run: runDeriveDecorationPlanStage },
	"derive-screen-intent": { runAi: runDeriveScreenIntentAiStep },
	"generate-render-tree": { runAi: runGenerateRenderTreeAiStep },
	"parse-source": { run: runParseSourceStage },
	"plan-composition": { runAi: runPlanCompositionAiStep },
	"propose-components": { runAi: runProposeComponentsAiStep },
	"read-source": { run: runReadSourceStage },
	"review-quality": { runAi: runReviewQualityAiStep },
	"revise-render-tree-if-invalid": { runAi: runReviseRenderTreeIfInvalidAiStep },
	"select-pattern": { runAi: runSelectPatternAiStep },
	"validate-render-tree": { run: runValidateRenderTreeStage },
	"validate-render-tree-after-revision": { run: runValidateRenderTreeAfterRevisionStage },
	"write-artifacts": { run: runWriteArtifactsStage },
} satisfies ScreenGenerationStageRuntimes;

export async function runScreenGenerationPipeline(
	options: ScreenGenerationPipelineOptions,
): Promise<PipelineRunResult> {
	const state: ScreenGenerationPipelineState = {
		...EMPTY_AGENT_STEPS(),
		options: normalizeScreenGenerationPipelineOptions(options),
	};
	await runScreenGenerationStepRunner(state);

	assertScreenGenerationCompleted(state);

	return createScreenGenerationPipelineResult(state);
}

/**
 * Maps the declarative reference names used in `refs([...])` step inputs to the
 * injected reference adapters. Composed step-nodes receive these resolved and
 * build their context from them — no reaching into pipeline state/options.
 */
function createScreenGenerationReferenceResolver(
	references: ScreenGenerationReferences,
): ReferenceResolver {
	const byName: Record<string, unknown> = {
		componentCatalog: references.componentCatalogs,
		designContext: references.designContextBundles,
		layoutCatalog: references.layoutCatalogs,
		skillBundle: references.skillBundles,
	};
	return (name) => byName[name];
}

async function runScreenGenerationStepRunner(state: ScreenGenerationPipelineState): Promise<void> {
	const pipeline = createScreenGenerationStepPipeline(state);
	state.stageOrder = pipeline.steps.map((step) => step.id as PipelineStageId);

	await runStepPipeline(pipeline, {
		agent: createScreenGenerationStepAgentAdapter(state),
		createEventId: state.options.createEventId,
		now: state.options.clockNow,
		onEvent: async (event) => {
			if (!event.stage) return;
			await state.options.onProgress({
				pipelineId: SCREEN_GENERATION_PIPELINE_ID,
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
		resolveReference: createScreenGenerationReferenceResolver(state.options.references),
		runId: state.options.runId,
		status: {
			outDir: state.options.outDir,
			runDir: state.options.runDir,
			sourcePath: state.options.sourcePath,
		},
	});
}

function createScreenGenerationStepPipeline(
	state: ScreenGenerationPipelineState,
): StepPipelineDefinition {
	return definePipeline({
		feedback: [createScreenGenerationFeedbackRule(state)],
		id: SCREEN_GENERATION_PIPELINE_ID,
		steps: SCREEN_GENERATION_STAGE_DESCRIPTORS.map((descriptor) =>
			createScreenGenerationStep(state, descriptor),
		),
	});
}

function createScreenGenerationStep(
	state: ScreenGenerationPipelineState,
	descriptor: ScreenGenerationStageDescriptor,
) {
	const stage = descriptor.id;
	if (isScreenGenerationAiStage(stage)) {
		return defineStep({
			id: stage,
			inputs: descriptor.inputs,
			output: {
				result: descriptor.output,
			},
			prompt: createScreenGenerationStepPrompt(descriptor),
			skipWhen: () => shouldSkipScreenGenerationStage(state, descriptor),
			usesAI: true,
		});
	}

	return defineStep({
		execute: async () => screenGenerationStageRuntimes[stage].run(state),
		id: stage,
		inputs: descriptor.inputs,
		output: {
			result: descriptor.output,
		},
		skipWhen: () => shouldSkipScreenGenerationStage(state, descriptor),
		usesAI: false,
	});
}

function createScreenGenerationStepPrompt(descriptor: ScreenGenerationStageDescriptor) {
	if (!descriptor.taskKind) {
		throw new Error(`Screen generation AI stage is missing taskKind: ${descriptor.id}`);
	}
	return agentTaskCatalog[descriptor.taskKind].createPrompt({
		context: {
			pipelineId: SCREEN_GENERATION_PIPELINE_ID,
			stage: descriptor.id,
		},
		query: `Runtime query is built by the ${descriptor.id} inference node.`,
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

		return screenGenerationStageRuntimes[stage].runAi(
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
	return isScreenGenerationAiStageDescriptor(stage);
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
				buildScreenGenerationPatternLayerCandidates(
					state.options.references.layoutCatalogs,
					sourceSpec,
				);
			const designSkillSelection =
				state.designSkillSelection ??
				runDesignSkillSelectionNode({
					layerCandidates,
					screenIntent: state.screenIntent.agentResult?.payload,
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
			payload: state.generation.agentResult?.payload,
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
				buildScreenGenerationPatternLayerCandidates(
					state.options.references.layoutCatalogs,
					sourceSpec,
				);
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
		...projectCommonAgentSteps(state),
		decorationPlan: state.decorationPlan,
		designContextBundleSelection: state.designContextBundleSelection,
		designSkillSelection: state.designSkillSelection,
		finalResult: extractPayloadArtifact(state.generation.agentResult?.payload, "renderTree"),
		generationSkillCatalog: state.generationSkillCatalog,
		initialValidationReport: state.initialValidationReport,
		outDir: state.options.outDir,
		parseCommandResult: state.parseCommandResult,
		patternLayerCandidates: state.patternLayerCandidates,
		pipelineResult: state.pipelineResult,
		pipelineResultWrite: state.pipelineResultWrite,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
		revisionDecision: state.generationNextAction,
		runId: state.options.runId,
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

const SCREEN_GENERATION_SKIP_PREDICATES = {
	"continue-after-parse-failure": () => false,
	"requires-revision-request": (state) => state.generationNextAction?.action !== "request-revision",
	"requires-revision-result": (state) => !state.revision.agentResult,
} as const satisfies Record<
	ScreenGenerationStageSkipPolicy,
	(state: ScreenGenerationPipelineState) => boolean
>;

function shouldSkipScreenGenerationStage(
	state: ScreenGenerationPipelineState,
	descriptor: ScreenGenerationStageDescriptor,
): boolean {
	if (
		state.parseCommandResult &&
		!state.parseCommandResult.parseResult.ok &&
		descriptor.skipPolicy !== "continue-after-parse-failure"
	) {
		return true;
	}
	if (!descriptor.skipPolicy) return false;
	return SCREEN_GENERATION_SKIP_PREDICATES[descriptor.skipPolicy](state);
}

async function runReadSourceStage(
	state: ScreenGenerationPipelineState,
): Promise<PipelineMarkdownSourceFile> {
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
	return state.sourceFile;
}

function runParseSourceStage(state: ScreenGenerationPipelineState): SourceSpec {
	if (!state.sourceFile) {
		throw new Error("Cannot parse source before read-source stage.");
	}

	state.parseCommandResult = runParseMarkdownSourceCommand({
		files: [state.sourceFile],
		importId: state.options.runId,
		receivedAt: "1970-01-01T00:00:00.000Z",
	});
	if (!state.parseCommandResult.parseResult.sourceSpec) {
		throw new Error("Markdown source parse finished without SourceSpec.");
	}
	state.sourceSpec = state.parseCommandResult.parseResult.sourceSpec;
	return state.sourceSpec;
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

	state.screenIntent.agentInput = nodeResult.agentInput;
	state.screenIntent.agentResult = nodeResult.agentResult;
	state.screenIntent.runnerRequest = nodeResult.runnerRequest;
	return state.screenIntent.agentResult.payload;
}

async function runPlanCompositionAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const screenIntent = inputs.intent ?? state.screenIntent.agentResult?.payload;
	const layerCandidates = buildScreenGenerationPatternLayerCandidates(inputs.layoutCatalogs as ScreenGenerationLayoutCatalogRefs, sourceSpec);
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
	state.compositionPlan.agentInput = nodeResult.agentInput;
	state.compositionPlan.agentResult = nodeResult.agentResult;
	state.compositionPlan.runnerRequest = nodeResult.runnerRequest;
	state.designContextBundleSelection = runDesignContextBundleRefsNode({
		compositionPlan: state.compositionPlan.agentResult.payload,
		layerCandidates,
		screenIntent,
		sourceSpec,
	});
	return {
		compositionPlan: state.compositionPlan.agentResult.payload,
		designContextBundleSelection: state.designContextBundleSelection,
		designSkillSelection: state.designSkillSelection,
		patternLayerCandidates: state.patternLayerCandidates,
	};
}

function runDeriveDecorationPlanStage(state: ScreenGenerationPipelineState): {
	decorationPlan?: DecorationPlanContract;
	patternLayerCandidates?: PatternLayerCandidate[];
} {
	const sourceSpec = requireSourceSpec(state);
	state.decorationPlan = runDecorationPlanNode({
		compositionPlan: state.compositionPlan.agentResult?.payload,
		sourceSpec,
	});
	state.patternLayerCandidates = buildScreenGenerationPatternLayerCandidates(
		state.options.references.layoutCatalogs,
		sourceSpec,
		state.decorationPlan,
	);
	return {
		decorationPlan: state.decorationPlan,
		patternLayerCandidates: state.patternLayerCandidates,
	};
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
		state.patternLayerCandidates ?? buildScreenGenerationPatternLayerCandidates(inputs.layoutCatalogs as ScreenGenerationLayoutCatalogRefs, sourceSpec);
	const nodeResult = await runPatternSelectionNode({
		compositionPlan: composition?.compositionPlan ?? state.compositionPlan.agentResult?.payload,
		decorationPlan:
			(decoration?.decorationPlan as DecorationPlanContract | undefined) ?? state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designSkillSelection: state.designSkillSelection,
		layerCandidates,
		runner,
		screenIntent: state.screenIntent.agentResult?.payload,
		sourceSpec,
	});

	state.patternLayerCandidates = layerCandidates;
	state.patternSelection.agentInput = nodeResult.agentInput;
	state.patternSelection.agentResult = nodeResult.agentResult;
	state.patternSelection.runnerRequest = nodeResult.runnerRequest;
	return state.patternSelection.agentResult.payload;
}

async function runGenerateRenderTreeAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = readRecordInput(inputs.composition);
	const decoration = readRecordInput(inputs.decoration);
	state.generationSkillCatalog ??= await (
		inputs.skillBundles as ScreenGenerationReferences["skillBundles"]
	).loadCatalog();
	state.renderTreeGenerationSkill = findGenerationSkill(
		state.generationSkillCatalog,
		"render-tree-generation",
	);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
		sourceSpec,
		state.patternLayerCandidates ?? [],
	);
	const nodeResult = await runScreenGenerationNode({
		componentContractCatalog,
		compositionPlan: composition?.compositionPlan ?? state.compositionPlan.agentResult?.payload,
		decorationPlan:
			(decoration?.decorationPlan as DecorationPlanContract | undefined) ?? state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: inputs.pattern ?? state.patternSelection.agentResult?.payload,
		runner,
		screenIntent: inputs.intent ?? state.screenIntent.agentResult?.payload,
		sourceSpec,
	});

	state.generation.agentInput = nodeResult.agentInput;
	state.generation.agentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.generation.runnerRequest = nodeResult.runnerRequest;
	return state.generation.agentResult.payload;
}

function runValidateRenderTreeStage(
	state: ScreenGenerationPipelineState,
): ValidationReportContract {
	const validationReport = createRenderTreeValidationReport(state.generation.agentResult?.payload, {
		allowedLayoutIds: state.patternLayerCandidates?.map((candidate) => candidate.layout),
		componentCatalog: state.options.references.componentCatalogs.validationCatalog,
		compositionPlan: state.compositionPlan.agentResult?.payload,
		decorationPlan: state.decorationPlan,
		screenIntent: state.screenIntent.agentResult?.payload,
		sourceSpec: state.sourceSpec,
	});
	state.validationReport = validationReport;
	state.initialValidationReport ??= state.validationReport;
	if (state.sourceSpec) {
		state.designContextBundleSelection = runDesignContextBundleRefsNode({
			compositionPlan: state.compositionPlan.agentResult?.payload,
			layerCandidates: state.patternLayerCandidates,
			screenIntent: state.screenIntent.agentResult?.payload,
			sourceSpec: state.sourceSpec,
			validationReport: state.validationReport,
		});
	}
	return validationReport;
}

function runValidateRenderTreeAfterRevisionStage(
	state: ScreenGenerationPipelineState,
): ValidationReportContract {
	const validationReport = runValidateRenderTreeStage(state);
	if (!state.preRevisionAgentResult || !state.preRevisionValidationReport) return validationReport;
	if (!isValidationWorse(state.validationReport, state.preRevisionValidationReport)) {
		return validationReport;
	}

	state.generation.agentResult = state.preRevisionAgentResult;
	state.validationReport = state.preRevisionValidationReport;
	return state.validationReport;
}

async function runProposeComponentsAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = requireSourceSpec(state);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
		sourceSpec,
		state.patternLayerCandidates ?? [],
	);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const nodeResult = await runComponentProposalNode({
		candidate: inputs.candidate ?? state.generation.agentResult?.payload,
		componentContractCatalog,
		compositionPlan: state.compositionPlan.agentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelection.agentResult?.payload,
		runner,
		screenIntent: state.screenIntent.agentResult?.payload,
		sourceSpec,
	});

	state.componentProposal.agentInput = nodeResult.agentInput;
	state.componentProposal.agentResult = nodeResult.agentResult;
	state.componentProposal.runnerRequest = nodeResult.runnerRequest;
	// 제안은 비파괴 아티팩트다. 검증은 bounded 여부만 리포트하고 파이프라인을 실패시키지 않는다.
	// allowedRefs는 source reference catalog(생성 입력 context)의 전체 vocabulary를 기준으로 한다.
	state.componentProposalValidationReport = validateComponentProposal(
		state.componentProposal.agentResult.payload,
		{
			allowedRefs: nodeResult.agentInput.context.constraints.sourceReferenceCatalog.allowedRefs,
			catalogComponentTypes: componentContractCatalog.entries.map((entry) => entry.componentType),
		},
	);
	return state.componentProposal.agentResult.payload;
}

async function runReviewQualityAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = requireSourceSpec(state);
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const nodeResult = await runQualityReviewNode({
		candidate: inputs.candidate ?? state.generation.agentResult?.payload,
		componentContractCatalog: buildSourceComponentContractCatalog(
			inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
			sourceSpec,
			state.patternLayerCandidates ?? [],
		),
		compositionPlan: state.compositionPlan.agentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelection.agentResult?.payload,
		runner,
		screenIntent: state.screenIntent.agentResult?.payload,
		sourceSpec,
		validationReport:
			(inputs.validation as ValidationReportContract | undefined) ?? state.validationReport,
	});

	state.qualityReview.agentInput = nodeResult.agentInput;
	state.qualityReview.agentResult = nodeResult.agentResult;
	state.qualityReview.runnerRequest = nodeResult.runnerRequest;
	state.generationNextAction = runGenerationNextActionNode({
		initialValidationReport: state.initialValidationReport,
		qualityInspection: state.qualityReview.agentResult.payload,
		retryCount: state.revision.agentResult ? 1 : 0,
		validationReport: state.validationReport,
	});
	return state.qualityReview.agentResult.payload;
}

async function runReviseRenderTreeIfInvalidAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	if (state.generationNextAction?.action !== "request-revision") {
		return state.generation.agentResult?.payload;
	}

	const sourceSpec = requireSourceSpec(state);
	const previousCandidate = inputs.generation ?? state.generation.agentResult?.payload;
	state.preRevisionAgentResult = state.generation.agentResult;
	state.preRevisionValidationReport = state.validationReport;
	state.designContextBundleContents = await loadBundleContentsForState(state);
	const nodeResult = await runScreenRevisionNode({
		componentContractCatalog: buildSourceComponentContractCatalog(
			inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
			sourceSpec,
			state.patternLayerCandidates ?? [],
		),
		compositionPlan: state.compositionPlan.agentResult?.payload,
		decorationPlan: state.decorationPlan,
		designContextBundleRefs: state.designContextBundleSelection?.bundleRefs,
		designContextBundles: state.designContextBundleContents,
		designSkillSelection: state.designSkillSelection,
		layerCandidates: state.patternLayerCandidates,
		patternSelection: state.patternSelection.agentResult?.payload,
		previousCandidate,
		qualityInspection: inputs.quality ?? state.qualityReview.agentResult?.payload,
		runner,
		screenIntent: state.screenIntent.agentResult?.payload,
		sourceSpec,
		validationReport:
			(inputs.validation as ValidationReportContract | undefined) ?? state.validationReport,
	});

	state.revision.agentInput = nodeResult.agentInput;
	state.revision.agentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.revision.runnerRequest = nodeResult.runnerRequest;
	state.generation.agentResult = state.revision.agentResult;
	return state.generation.agentResult.payload;
}

async function runWriteArtifactsStage(
	state: ScreenGenerationPipelineState,
): Promise<SideEffectExecutionResult> {
	if (!state.parseCommandResult) {
		throw new Error("Cannot write artifacts before parse-source stage.");
	}

	const commands = createGenerationSmokeArtifactCommands({
		...projectCommonAgentSteps(state),
		...flattenAgentStep("componentProposal", state.componentProposal),
		componentProposal: state.componentProposal.agentResult?.payload,
		componentProposalValidationReport: state.componentProposalValidationReport,
		decorationPlan: state.decorationPlan,
		designContextBundleSelection: state.designContextBundleSelection,
		designCritique: state.qualityReview.agentResult?.payload,
		designSkillSelection: state.designSkillSelection,
		finalResult: extractPayloadArtifact(state.generation.agentResult?.payload, "renderTree"),
		generationSkillCatalog: state.generationSkillCatalog,
		initialValidationReport: state.initialValidationReport,
		outDir: state.options.outDir,
		parseCommandResult: state.parseCommandResult,
		patternLayerCandidates: state.patternLayerCandidates,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
		revisionDecision: state.generationNextAction,
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
	return state.pipelineResult;
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

const SOURCE_KIND_PATH_MARKERS = [
	["/screen/", "screen"],
	["/area/", "area"],
	["/component/", "component"],
] as const satisfies ReadonlyArray<readonly [string, PipelineMarkdownSourceFile["kind"]]>;

function resolveSourceKind(targetPath: string): PipelineMarkdownSourceFile["kind"] {
	for (const [marker, kind] of SOURCE_KIND_PATH_MARKERS) {
		if (targetPath.includes(marker)) return kind;
	}
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
	return path.resolve(resolveInvocationRoot(), ...RUN_DIR_PRESET_SEGMENTS[preset], runId);
}

const RUN_DIR_PRESET_SEGMENTS = {
	"data-run": ["data", "runs", "screen-generation"],
	"local-transient": ["tmp", "generation-runs"],
	"web-fixture": ["apps", "web", "fixtures", "smoke-runs"],
} as const satisfies Record<ArtifactStorePreset, readonly string[]>;

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
	layoutCatalogs: ScreenGenerationLayoutCatalogRefs,
	sourceSpec: SourceSpec,
	decorationPlan?: DecorationPlanContract,
): PatternLayerCandidate[] {
	return runPatternLayerCandidatesNode({
		decorationPlan,
		resolver: {
			resolveComponentLayout: layoutCatalogs.resolveComponentLayout,
			resolveRegionLayout: layoutCatalogs.resolveRegionLayout,
		},
		sourceSpec,
	});
}

function buildSourceComponentContractCatalog(
	componentCatalogs: ScreenGenerationComponentCatalogRefs,
	sourceSpec: SourceSpec,
	layerCandidates: PatternLayerCandidate[],
): ComponentContractCatalog {
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
		agentPayload: state.generation.agentResult?.payload,
		areaCount: sourceSpec ? countSourceAreas(sourceSpec) : 0,
		componentCount: sourceSpec ? countSourceComponents(sourceSpec) : 0,
		ok: state.parseCommandResult?.ok ?? false,
		outDir: state.options.outDir,
		screenCode: screen?.screenCode,
		session: state.generation.agentResult?.session,
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
		pipelineId: SCREEN_GENERATION_PIPELINE_ID,
		pipelineResult: artifact(ARTIFACT_FILES.pipelineResult),
		qualityReview: artifact(ARTIFACT_FILES.qualityReview),
		runId: state.options.runId,
		schemaVersion: "smoke-run-manifest.v0.1",
		screenIntent: artifact(ARTIFACT_FILES.screenIntent),
		sourcePath: path.relative(resolveInvocationRoot(), state.options.sourcePath),
		sourceSpec: artifact(ARTIFACT_FILES.sourceSpec),
		stageLayers: createSmokeRunStageLayers(artifact),
		stageOrder: state.stageOrder ?? [],
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
	return createScreenGenerationStageLayers(artifact).map(
		({ artifacts, layer, stages, traceKeys }) => ({
			artifacts,
			layer,
			stages,
			traceKeys,
		}),
	);
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
