import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClaudeRunner } from "@cx/agent/claude";
import type {
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
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	QualityReviewAgentInput,
	ScreenGenerationAgentInput,
	ScreenIntentAgentInput,
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
	runPatternLayerCandidatesNode,
	runPatternSelectionNode,
	runQualityReviewNode,
	runRequiredRegionLayoutRepairNode,
	runScreenGenerationNode,
	runScreenIntentNode,
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
import { contract, definePipeline, defineStep, refInput, stepOutput } from "../../definition";
import { createFilePipelinePersistenceAdapter } from "../../persistence";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";
import type {
	ArtifactStorePreset,
	OutputContract,
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
	StepInputRef,
	StepPipelineDefinition,
} from "../../public/types";
import { runSideEffects } from "../../runner";
import { runStepPipeline } from "../../runtime/run-step-pipeline";
import {
	ARTIFACT_FILES,
	type ArtifactLayerGroups,
	createGenerationSmokeArtifactCommands,
	createGenerationSmokeManifestCommand,
	createGenerationSmokePipelineResultCommands,
} from "./artifact-commands";
import {
	readScreenGenerationPreviewArtifact,
	SCREEN_GENERATION_LAYER_ARTIFACTS,
	SCREEN_GENERATION_LAYER_LABELS,
	SCREEN_GENERATION_LAYER_ORDER,
	SCREEN_GENERATION_LAYER_TRACE_KEYS,
	SCREEN_GENERATION_PIPELINE_ID,
	type ScreenGenerationLayer,
	type ScreenGenerationStageKind,
	type ScreenGenerationStageLayerGroup,
	type ScreenGenerationStageSkipPolicy,
} from "./constants";
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

/**
 * Rich output of an AI step: the agent triple plus the unwrapped payload.
 * Steps return this so the projection can assemble artifacts/result from engine
 * step outputs (`state.steps[id].outputs.result`) instead of the blackboard.
 * Downstream consumers read `.payload` for the node payload.
 */
type AgentStepOutput<TPayload = unknown> = {
	agentInput?: unknown;
	agentResult?: AgentRunResult;
	payload?: TPayload;
	runnerRequest?: AgentRunnerRequest;
};

/** Build the rich AI-step output from an inference-node result. */
function agentStepOutput<TPayload>(nodeResult: {
	agentInput?: unknown;
	agentResult: AgentRunResult;
	runnerRequest?: AgentRunnerRequest;
}): AgentStepOutput<TPayload> {
	return {
		agentInput: nodeResult.agentInput,
		agentResult: nodeResult.agentResult,
		payload: nodeResult.agentResult.payload as TPayload,
		runnerRequest: nodeResult.runnerRequest,
	};
}

/** Read the `.payload` from an AI step's rich output (consumed downstream). */
function readAgentStepPayload(value: unknown): unknown {
	return isRecord(value) ? (value as AgentStepOutput).payload : undefined;
}

type ScreenGenerationPipelineState = {
	// Per-stage agent triples (always present; populated as stages run).
	compositionPlan: AgentStep<CompositionPlanAgentInput>;
	componentProposal: AgentStep<ComponentProposalAgentInput>;
	/** Render-tree generation. `generation.agentResult` is the final candidate (one pass, no revision). */
	generation: AgentStep<ScreenGenerationAgentInput>;
	patternSelection: AgentStep<PatternSelectionAgentInput>;
	qualityReview: AgentStep<QualityReviewAgentInput>;
	screenIntent: AgentStep<ScreenIntentAgentInput>;
	// Non-agent scaffolding produced by deterministic/effect stages.
	componentProposalValidationReport?: ReturnType<typeof validateComponentProposal>;
	decorationPlan?: DecorationPlanContract;
	designContextBundleSelection?: DesignContextBundleSelection;
	designSkillSelection?: DesignSkillSelectionContract;
	generationSkillCatalog?: ScreenGenerationSkillBundleRef[];
	initialValidationReport?: ValidationReportContract;
	options: NormalizedScreenGenerationPipelineOptions;
	parseCommandResult?: ReturnType<typeof runParseMarkdownSourceCommand>;
	patternLayerCandidates?: PatternLayerCandidate[];
	pipelineResult?: SideEffectExecutionResult;
	pipelineResultWrite?: SideEffectExecutionResult;
	renderTreeGenerationSkill?: ScreenGenerationSkillBundleRef;
	sourceFile?: PipelineMarkdownSourceFile;
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
	| "screenIntent"
> => ({
	compositionPlan: {},
	componentProposal: {},
	generation: {},
	patternSelection: {},
	qualityReview: {},
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

type ScreenGenerationStageExecutor = (
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
) => Promise<unknown> | unknown;
type ScreenGenerationAiStepRunner = (
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
) => Promise<unknown>;

type ScreenGenerationStepBase = {
	id: PipelineStageId;
	inputs?: Record<string, StepInputRef>;
	layer: ScreenGenerationLayer;
	message: string;
	output: OutputContract;
	skipPolicy?: ScreenGenerationStageSkipPolicy;
};

/** AI stage: declares its agent task and AI runner (dispatched via the agent adapter). */
export type ScreenGenerationAiStep = ScreenGenerationStepBase & {
	kind: "ai";
	runAi: ScreenGenerationAiStepRunner;
	taskKind: AgentTaskKind;
};

/** Deterministic/effect/validation stage: declares its executor. */
export type ScreenGenerationNonAiStep = ScreenGenerationStepBase & {
	kind: Exclude<ScreenGenerationStageKind, "ai">;
	run: ScreenGenerationStageExecutor;
	taskKind?: never;
};

export type ScreenGenerationStep = ScreenGenerationAiStep | ScreenGenerationNonAiStep;

/** Identity helper pinning each entry to the 5-axis screen-step literal shape. */
function defineScreenStep<const T extends ScreenGenerationStep>(step: T): T {
	return step;
}

const refs = {
	componentCatalogs: refInput("componentCatalogs"),
	designContextBundles: refInput("designContextBundles"),
	layoutCatalogs: refInput("layoutCatalogs"),
	skillBundles: refInput("skillBundles"),
};

/**
 * The screen-generation pipeline as a single declarative array. Each entry owns
 * its metadata (id/layer/kind/message/output, optional taskKind/skipPolicy), its
 * declarative inputs (prior step outputs + `refs`), and its run function. This
 * replaces the former descriptor array + stage-runtime map + step factory split.
 */
export const SCREEN_GENERATION_STEPS = [
	defineScreenStep({
		id: "read-source",
		kind: "effect",
		layer: "understand",
		message: "Reading source…",
		output: contract("source-file"),
		run: runReadSourceStage,
	}),
	defineScreenStep({
		id: "parse-source",
		inputs: { source: stepOutput("read-source", "result") },
		kind: "deterministic",
		layer: "understand",
		message: "Parsing markdown source…",
		output: contract("source-spec-parse-result"),
		run: runParseSourceStage,
	}),
	defineScreenStep({
		id: "derive-screen-intent",
		inputs: { source: stepOutput("parse-source", "result") },
		kind: "ai",
		layer: "understand",
		message: "Understanding screen intent…",
		output: contract("screen-intent"),
		runAi: runDeriveScreenIntentAiStep,
		taskKind: "screen-intent",
	}),
	defineScreenStep({
		id: "plan-composition",
		inputs: {
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		kind: "ai",
		layer: "compose",
		message: "Planning composition…",
		output: contract("composition-plan-result"),
		runAi: runPlanCompositionAiStep,
		taskKind: "composition-planning",
	}),
	defineScreenStep({
		id: "derive-decoration-plan",
		inputs: {
			composition: stepOutput("plan-composition", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		kind: "deterministic",
		layer: "compose",
		message: "Decorating sections…",
		output: contract("decoration-plan-result"),
		run: runDeriveDecorationPlanStage,
	}),
	defineScreenStep({
		id: "select-pattern",
		inputs: {
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: refs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			source: stepOutput("parse-source", "result"),
		},
		kind: "ai",
		layer: "compose",
		message: "Selecting layout patterns…",
		output: contract("pattern-selection"),
		runAi: runSelectPatternAiStep,
		taskKind: "pattern-selection",
	}),
	defineScreenStep({
		id: "generate-render-tree",
		inputs: {
			componentCatalogs: refs.componentCatalogs,
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: refs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			layoutCatalogs: refs.layoutCatalogs,
			pattern: stepOutput("select-pattern", "result"),
			skillBundles: refs.skillBundles,
			source: stepOutput("parse-source", "result"),
		},
		kind: "ai",
		layer: "compose",
		message: "Generating UI draft…",
		output: contract("screen-generation-agent-result"),
		runAi: runGenerateRenderTreeAiStep,
		taskKind: "screen-generation",
	}),
	defineScreenStep({
		id: "validate-render-tree",
		inputs: {
			componentCatalogs: refs.componentCatalogs,
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			intent: stepOutput("derive-screen-intent", "result"),
			source: stepOutput("parse-source", "result"),
			target: stepOutput("generate-render-tree", "result"),
		},
		kind: "validation",
		layer: "revise",
		message: "Validating render tree…",
		output: contract("validation-report"),
		run: runValidateRenderTreeStage,
	}),
	defineScreenStep({
		id: "propose-components",
		inputs: {
			candidate: stepOutput("generate-render-tree", "result"),
			componentCatalogs: refs.componentCatalogs,
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: refs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			pattern: stepOutput("select-pattern", "result"),
			source: stepOutput("parse-source", "result"),
			validation: stepOutput("validate-render-tree", "result"),
		},
		kind: "ai",
		layer: "revise",
		message: "Checking component proposals…",
		output: contract("component-proposal"),
		runAi: runProposeComponentsAiStep,
		taskKind: "component-proposal",
	}),
	defineScreenStep({
		id: "review-quality",
		inputs: {
			candidate: stepOutput("generate-render-tree", "result"),
			componentCatalogs: refs.componentCatalogs,
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			designContextBundles: refs.designContextBundles,
			intent: stepOutput("derive-screen-intent", "result"),
			pattern: stepOutput("select-pattern", "result"),
			source: stepOutput("parse-source", "result"),
			validation: stepOutput("validate-render-tree", "result"),
		},
		kind: "ai",
		layer: "revise",
		message: "Reviewing quality…",
		output: contract("quality-inspection"),
		runAi: runReviewQualityAiStep,
		taskKind: "quality-review",
	}),
	defineScreenStep({
		id: "write-artifacts",
		kind: "effect",
		layer: "revise",
		message: "Writing review artifacts…",
		output: contract("pipeline-artifact-write-result"),
		run: runWriteArtifactsStage,
	}),
] satisfies readonly ScreenGenerationStep[];

type ScreenGenerationAiStageId = Extract<
	(typeof SCREEN_GENERATION_STEPS)[number],
	{ kind: "ai" }
>["id"];

function getScreenGenerationStep(stageId: PipelineStageId): ScreenGenerationStep {
	const step = SCREEN_GENERATION_STEPS.find((entry) => entry.id === stageId);
	if (!step) throw new Error(`Unknown screen-generation stage: ${stageId}`);
	return step;
}

function getScreenGenerationAiStep(stageId: ScreenGenerationAiStageId): ScreenGenerationAiStep {
	const step = getScreenGenerationStep(stageId);
	if (step.kind !== "ai") throw new Error(`Screen generation stage is not AI: ${stageId}`);
	return step;
}

export function getScreenGenerationStageOrder(): PipelineStageId[] {
	return SCREEN_GENERATION_STEPS.map((step) => step.id);
}

export function getScreenGenerationStagesByKind(
	kind: ScreenGenerationStageKind,
): PipelineStageId[] {
	return SCREEN_GENERATION_STEPS.filter((step) => step.kind === kind).map((step) => step.id);
}

export function isScreenGenerationAiStageDescriptor(stageId: PipelineStageId | string): boolean {
	return SCREEN_GENERATION_STEPS.some((step) => step.id === stageId && step.kind === "ai");
}

export function getScreenGenerationStageLayer(stageId: PipelineStageId): ScreenGenerationLayer {
	return getScreenGenerationStep(stageId).layer;
}

export function getScreenGenerationStageMessage(stageId: PipelineStageId): string {
	return getScreenGenerationStep(stageId).message;
}

export function createScreenGenerationStageLayers(
	artifact: (fileName: string) => string = (fileName) => fileName,
): ScreenGenerationStageLayerGroup[] {
	return SCREEN_GENERATION_LAYER_ORDER.map((layer) => ({
		artifacts: SCREEN_GENERATION_LAYER_ARTIFACTS[layer].map(artifact),
		label: SCREEN_GENERATION_LAYER_LABELS[layer],
		layer,
		previewArtifact: readScreenGenerationPreviewArtifact(layer, artifact),
		stages: SCREEN_GENERATION_STEPS.filter((step) => step.layer === layer).map((step) => step.id),
		traceKeys: [...SCREEN_GENERATION_LAYER_TRACE_KEYS[layer]],
	}));
}

/** Trace layer grouping (raw artifact names), passed into the artifact builder. */
const SCREEN_GENERATION_ARTIFACT_LAYER_GROUPS: ArtifactLayerGroups = Object.fromEntries(
	createScreenGenerationStageLayers().map((layer) => [
		layer.layer,
		{ artifacts: layer.artifacts, traceKeys: layer.traceKeys },
	]),
);

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
		id: SCREEN_GENERATION_PIPELINE_ID,
		steps: SCREEN_GENERATION_STEPS.map((step) => toEnginePipelineStep(state, step)),
	});
}

/** Project a declarative screen-step to the engine's per-run PipelineStep. */
function toEnginePipelineStep(state: ScreenGenerationPipelineState, step: ScreenGenerationStep) {
	if (step.kind === "ai") {
		return defineStep({
			id: step.id,
			inputs: step.inputs,
			output: { result: step.output },
			prompt: createScreenGenerationStepPrompt(step),
			usesAI: true,
		});
	}

	return defineStep({
		execute: async (inputs) => step.run(inputs, state),
		id: step.id,
		inputs: step.inputs,
		output: { result: step.output },
		usesAI: false,
	});
}

function createScreenGenerationStepPrompt(step: ScreenGenerationAiStep) {
	return agentTaskCatalog[step.taskKind].createPrompt({
		context: {
			pipelineId: SCREEN_GENERATION_PIPELINE_ID,
			stage: step.id,
		},
		query: `Runtime query is built by the ${step.id} inference node.`,
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

		return getScreenGenerationAiStep(stage).runAi(
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

async function runReadSourceStage(
	_inputs: ResolvedStepInputs,
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

	state.sourceFile = getSourceFileFromReadResult(
		result,
		state.options.sourceKind,
		state.options.sourcePath,
	);
	return state.sourceFile;
}

function runParseSourceStage(
	_inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
): SourceSpec {
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
	return agentStepOutput(nodeResult);
}

async function runPlanCompositionAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const screenIntent = readAgentStepPayload(inputs.intent);
	const layerCandidates = buildScreenGenerationPatternLayerCandidates(
		inputs.layoutCatalogs as ScreenGenerationLayoutCatalogRefs,
		sourceSpec,
	);
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
		agentInput: nodeResult.agentInput,
		agentResult: nodeResult.agentResult,
		compositionPlan: state.compositionPlan.agentResult.payload,
		designContextBundleSelection: state.designContextBundleSelection,
		designSkillSelection: state.designSkillSelection,
		patternLayerCandidates: state.patternLayerCandidates,
		runnerRequest: nodeResult.runnerRequest,
	};
}

function runDeriveDecorationPlanStage(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
): {
	decorationPlan?: DecorationPlanContract;
	patternLayerCandidates?: PatternLayerCandidate[];
} {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = inputs.composition as CompositionStepResult | undefined;
	state.decorationPlan = runDecorationPlanNode({
		compositionPlan: composition?.compositionPlan,
		sourceSpec,
	});
	state.patternLayerCandidates = buildScreenGenerationPatternLayerCandidates(
		inputs.layoutCatalogs as ScreenGenerationLayoutCatalogRefs,
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
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	const layerCandidates =
		decoration?.patternLayerCandidates ??
		buildScreenGenerationPatternLayerCandidates(
			inputs.layoutCatalogs as ScreenGenerationLayoutCatalogRefs,
			sourceSpec,
		);
	const nodeResult = await runPatternSelectionNode({
		compositionPlan: composition?.compositionPlan,
		decorationPlan: decoration?.decorationPlan,
		designContextBundleRefs: composition?.designContextBundleSelection?.bundleRefs,
		designSkillSelection: composition?.designSkillSelection,
		layerCandidates,
		runner,
		screenIntent: readAgentStepPayload(inputs.intent),
		sourceSpec,
	});

	state.patternLayerCandidates = layerCandidates;
	state.patternSelection.agentInput = nodeResult.agentInput;
	state.patternSelection.agentResult = nodeResult.agentResult;
	state.patternSelection.runnerRequest = nodeResult.runnerRequest;
	return agentStepOutput(nodeResult);
}

/** Rich output of the plan-composition step, consumed by downstream steps via outputOf. */
type CompositionStepResult = {
	agentInput?: unknown;
	agentResult?: AgentRunResult;
	compositionPlan?: unknown;
	designContextBundleSelection?: DesignContextBundleSelection;
	designSkillSelection?: DesignSkillSelectionContract;
	patternLayerCandidates?: PatternLayerCandidate[];
	runnerRequest?: AgentRunnerRequest;
};

/** Rich output of the derive-decoration-plan step. */
type DecorationStepResult = {
	decorationPlan?: DecorationPlanContract;
	patternLayerCandidates?: PatternLayerCandidate[];
};

/** Rich output of the validate steps: the report plus the (re-derived) bundle selection. */
type ValidationStepResult = {
	designContextBundleSelection?: DesignContextBundleSelection;
	validationReport: ValidationReportContract;
};

async function runGenerateRenderTreeAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	state.generationSkillCatalog ??= await (
		inputs.skillBundles as ScreenGenerationReferences["skillBundles"]
	).loadCatalog();
	state.renderTreeGenerationSkill = findGenerationSkill(
		state.generationSkillCatalog,
		"render-tree-generation",
	);
	const designContextBundleContents = await loadDesignContextBundleContents(
		inputs.designContextBundles as ScreenGenerationReferences["designContextBundles"],
		composition?.designContextBundleSelection?.bundleRefs,
		state.options.disableDesignContext,
	);
	const componentContractCatalog = buildSourceComponentContractCatalog(
		inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
		sourceSpec,
		decoration?.patternLayerCandidates ?? [],
	);
	const nodeResult = await runScreenGenerationNode({
		componentContractCatalog,
		compositionPlan: composition?.compositionPlan,
		decorationPlan: decoration?.decorationPlan,
		designContextBundleRefs: composition?.designContextBundleSelection?.bundleRefs,
		designContextBundles: designContextBundleContents,
		designSkillSelection: composition?.designSkillSelection,
		layerCandidates: decoration?.patternLayerCandidates,
		patternSelection: readAgentStepPayload(inputs.pattern),
		runner,
		screenIntent: readAgentStepPayload(inputs.intent),
		sourceSpec,
	});

	state.generation.agentInput = nodeResult.agentInput;
	state.generation.agentResult = repairAgentRunResultPayload(nodeResult.agentResult);
	state.generation.runnerRequest = nodeResult.runnerRequest;
	return {
		...agentStepOutput({
			agentInput: nodeResult.agentInput,
			agentResult: state.generation.agentResult,
			runnerRequest: nodeResult.runnerRequest,
		}),
		generationSkillCatalog: state.generationSkillCatalog,
		renderTreeGenerationSkill: state.renderTreeGenerationSkill,
	};
}

function runValidateRenderTreeStage(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
): ValidationStepResult {
	const sourceSpec = inputs.source as SourceSpec | undefined;
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	const validationReport = createRenderTreeValidationReport(readAgentStepPayload(inputs.target), {
		allowedLayoutIds: decoration?.patternLayerCandidates?.map((candidate) => candidate.layout),
		componentCatalog: (inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs)
			.validationCatalog,
		compositionPlan: composition?.compositionPlan,
		decorationPlan: decoration?.decorationPlan,
		screenIntent: readAgentStepPayload(inputs.intent),
		sourceSpec,
	});
	state.validationReport = validationReport;
	state.initialValidationReport ??= state.validationReport;
	let designContextBundleSelection = composition?.designContextBundleSelection;
	if (sourceSpec) {
		designContextBundleSelection = runDesignContextBundleRefsNode({
			compositionPlan: composition?.compositionPlan,
			layerCandidates: decoration?.patternLayerCandidates,
			screenIntent: readAgentStepPayload(inputs.intent),
			sourceSpec,
			validationReport,
		});
		state.designContextBundleSelection = designContextBundleSelection;
	}
	return { designContextBundleSelection, validationReport };
}

async function runProposeComponentsAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	const validation = inputs.validation as ValidationStepResult | undefined;
	const componentContractCatalog = buildSourceComponentContractCatalog(
		inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
		sourceSpec,
		decoration?.patternLayerCandidates ?? [],
	);
	const designContextBundleContents = await loadDesignContextBundleContents(
		inputs.designContextBundles as ScreenGenerationReferences["designContextBundles"],
		validation?.designContextBundleSelection?.bundleRefs,
		state.options.disableDesignContext,
	);
	const nodeResult = await runComponentProposalNode({
		candidate: readAgentStepPayload(inputs.candidate),
		componentContractCatalog,
		compositionPlan: composition?.compositionPlan,
		decorationPlan: decoration?.decorationPlan,
		designContextBundleRefs: validation?.designContextBundleSelection?.bundleRefs,
		designContextBundles: designContextBundleContents,
		designSkillSelection: composition?.designSkillSelection,
		layerCandidates: decoration?.patternLayerCandidates,
		patternSelection: readAgentStepPayload(inputs.pattern),
		runner,
		screenIntent: readAgentStepPayload(inputs.intent),
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
	return {
		...agentStepOutput(nodeResult),
		componentProposalValidationReport: state.componentProposalValidationReport,
	};
}

async function runReviewQualityAiStep(
	inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs, state);
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	const validation = inputs.validation as ValidationStepResult | undefined;
	const designContextBundleContents = await loadDesignContextBundleContents(
		inputs.designContextBundles as ScreenGenerationReferences["designContextBundles"],
		validation?.designContextBundleSelection?.bundleRefs,
		state.options.disableDesignContext,
	);
	const nodeResult = await runQualityReviewNode({
		candidate: readAgentStepPayload(inputs.candidate),
		componentContractCatalog: buildSourceComponentContractCatalog(
			inputs.componentCatalogs as ScreenGenerationComponentCatalogRefs,
			sourceSpec,
			decoration?.patternLayerCandidates ?? [],
		),
		compositionPlan: composition?.compositionPlan,
		decorationPlan: decoration?.decorationPlan,
		designContextBundleRefs: validation?.designContextBundleSelection?.bundleRefs,
		designContextBundles: designContextBundleContents,
		designSkillSelection: composition?.designSkillSelection,
		layerCandidates: decoration?.patternLayerCandidates,
		patternSelection: readAgentStepPayload(inputs.pattern),
		runner,
		screenIntent: readAgentStepPayload(inputs.intent),
		sourceSpec,
		validationReport: validation?.validationReport,
	});

	state.qualityReview.agentInput = nodeResult.agentInput;
	state.qualityReview.agentResult = nodeResult.agentResult;
	state.qualityReview.runnerRequest = nodeResult.runnerRequest;
	return agentStepOutput(nodeResult);
}

async function runWriteArtifactsStage(
	_inputs: ResolvedStepInputs,
	state: ScreenGenerationPipelineState,
): Promise<SideEffectExecutionResult> {
	if (!state.parseCommandResult) {
		throw new Error("Cannot write artifacts before parse-source stage.");
	}

	const commands = createGenerationSmokeArtifactCommands({
		layers: SCREEN_GENERATION_ARTIFACT_LAYER_GROUPS,
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

async function loadDesignContextBundleContents(
	designContextBundles: ScreenGenerationReferences["designContextBundles"],
	bundleRefs: DesignContextBundleSelection["bundleRefs"] | undefined,
	disableDesignContext: boolean,
): Promise<DesignContextBundleContent[]> {
	if (disableDesignContext) return [];
	return designContextBundles.loadContents(bundleRefs ?? []);
}

function findGenerationSkill(
	catalog: ScreenGenerationSkillBundleRef[],
	stage: ScreenGenerationSkillBundleRef["stage"],
): ScreenGenerationSkillBundleRef | undefined {
	return catalog.find((skill) => skill.stage === stage);
}

function repairAgentRunResultPayload(result: AgentRunResult): AgentRunResult {
	return {
		...result,
		payload: runRequiredRegionLayoutRepairNode(result.payload),
	};
}
