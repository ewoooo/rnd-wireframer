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
	DesignContextBundleSelection,
	PatternLayerCandidate,
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
	StepPipelineRunResult,
} from "../../public/types";
import { runSideEffects } from "../../runner";
import { runStepPipeline } from "../../runtime/run-step-pipeline";
import {
	ARTIFACT_FILES,
	type ArtifactLayerGroups,
	createGenerationSmokeArtifactCommands,
	createGenerationSmokeManifestCommand,
	createGenerationSmokePipelineResultCommands,
	type GenerationSmokeArtifactInput,
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
 * Rich output of an AI step: the agent triple plus the unwrapped payload.
 * Steps return this so the projection can assemble artifacts/result from engine
 * step outputs (`state.steps[id].outputs.result`) — there is no blackboard.
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
	options: NormalizedScreenGenerationPipelineOptions,
) => Promise<unknown> | unknown;
type ScreenGenerationAiStepRunner = (
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
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
		inputs: {
			composition: stepOutput("plan-composition", "result"),
			decoration: stepOutput("derive-decoration-plan", "result"),
			generation: stepOutput("generate-render-tree", "result"),
			intent: stepOutput("derive-screen-intent", "result"),
			pattern: stepOutput("select-pattern", "result"),
			proposal: stepOutput("propose-components", "result"),
			quality: stepOutput("review-quality", "result"),
			source: stepOutput("parse-source", "result"),
			validation: stepOutput("validate-render-tree", "result"),
		},
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
	const resolved = normalizeScreenGenerationPipelineOptions(options);
	const runResult = await runScreenGenerationStepRunner(resolved);
	return createScreenGenerationPipelineResult(resolved, runResult);
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

async function runScreenGenerationStepRunner(
	options: NormalizedScreenGenerationPipelineOptions,
): Promise<StepPipelineRunResult> {
	return runStepPipeline(createScreenGenerationStepPipeline(options), {
		agent: createScreenGenerationStepAgentAdapter(options),
		createEventId: options.createEventId,
		now: options.clockNow,
		onEvent: async (event) => {
			if (!event.stage) return;
			await options.onProgress({
				pipelineId: SCREEN_GENERATION_PIPELINE_ID,
				runId: options.runId,
				stage: event.stage as PipelineStageId,
				status: event.status,
				timestamp: event.timestamp,
			});
		},
		persistence: options.persistence,
		refs: {
			componentCatalogs: options.references.componentCatalogs,
			designContextBundles: options.references.designContextBundles,
			layoutCatalogs: options.references.layoutCatalogs,
			skillBundles: options.references.skillBundles,
		},
		resolveReference: createScreenGenerationReferenceResolver(options.references),
		runId: options.runId,
		status: {
			outDir: options.outDir,
			runDir: options.runDir,
			sourcePath: options.sourcePath,
		},
	});
}

function createScreenGenerationStepPipeline(
	options: NormalizedScreenGenerationPipelineOptions,
): StepPipelineDefinition {
	return definePipeline({
		id: SCREEN_GENERATION_PIPELINE_ID,
		steps: SCREEN_GENERATION_STEPS.map((step) => toEnginePipelineStep(options, step)),
	});
}

/** Project a declarative screen-step to the engine's per-run PipelineStep. */
function toEnginePipelineStep(
	options: NormalizedScreenGenerationPipelineOptions,
	step: ScreenGenerationStep,
) {
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
		execute: async (inputs) => step.run(inputs, options),
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
	options: NormalizedScreenGenerationPipelineOptions,
): StepAgentAdapter {
	const realRunner = createClaudeRunner({ localFirst: true });

	return async ({ inputs, step }) => {
		const stage = step.id;
		if (!isScreenGenerationAiStage(stage)) {
			throw new Error(`Screen generation step is not an AI stage: ${stage}`);
		}

		return getScreenGenerationAiStep(stage).runAi(
			inputs,
			options,
			options.agentMode === "claude-local-first"
				? realRunner
				: createFakeAgentRunner(inputs, options, stage),
		);
	};
}

function isScreenGenerationAiStage(
	stage: PipelineStageId | string,
): stage is ScreenGenerationAiStageId {
	return isScreenGenerationAiStageDescriptor(stage);
}

/**
 * Fake agent runners build their payload from the step's resolved inputs (and
 * reference catalogs in options) — no pipeline blackboard.
 */
function createFakeAgentRunner(
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
	stage: ScreenGenerationAiStageId,
): AgentRunner {
	const runners = {
		"derive-screen-intent": async (request) => ({
			payload: createFakeScreenIntent(readSourceSpecInput(inputs)),
			session: { mode: request.session?.mode ?? "new", sessionId: request.session?.sessionId },
			taskKind: request.taskKind,
		}),
		"generate-render-tree": createFakeGenerationAgentRunner({
			onRequest: () => undefined,
		}),
		"plan-composition": async (request) => {
			const sourceSpec = readSourceSpecInput(inputs);
			const layerCandidates = buildScreenGenerationPatternLayerCandidates(
				options.references.layoutCatalogs,
				sourceSpec,
			);
			const designSkillSelection = runDesignSkillSelectionNode({
				layerCandidates,
				screenIntent: readAgentStepPayload(inputs.intent),
				sourceSpec,
			});
			return {
				payload: createFakeCompositionPlan(sourceSpec, layerCandidates, designSkillSelection),
				session: { mode: request.session?.mode ?? "new", sessionId: request.session?.sessionId },
				taskKind: request.taskKind,
			};
		},
		"propose-components": async (request) => ({
			payload: createFakeComponentProposal(),
			session: { mode: request.session?.mode ?? "new", sessionId: request.session?.sessionId },
			taskKind: request.taskKind,
		}),
		"review-quality": async (request) => ({
			payload: createFakeQualityInspection(
				(inputs.validation as ValidationStepResult | undefined)?.validationReport,
			),
			session: { mode: request.session?.mode ?? "new", sessionId: request.session?.sessionId },
			taskKind: request.taskKind,
		}),
		"select-pattern": async (request) => {
			const decoration = inputs.decoration as DecorationStepResult | undefined;
			const layerCandidates =
				decoration?.patternLayerCandidates ??
				buildScreenGenerationPatternLayerCandidates(
					options.references.layoutCatalogs,
					readSourceSpecInput(inputs),
				);
			return {
				payload: createFakePatternSelection(layerCandidates),
				session: { mode: request.session?.mode ?? "new", sessionId: request.session?.sessionId },
				taskKind: request.taskKind,
			};
		},
	} satisfies Record<ScreenGenerationAiStageId, AgentRunner>;

	return runners[stage];
}

/** Read a step's primary output from the engine run result. */
function stepResult<T>(runResult: StepPipelineRunResult, stageId: PipelineStageId): T {
	return runResult.state.steps[stageId]?.outputs?.result as T;
}

/** Project the public flat result from engine step outputs (no blackboard). */
function createScreenGenerationPipelineResult(
	options: NormalizedScreenGenerationPipelineOptions,
	runResult: StepPipelineRunResult,
): PipelineRunResult {
	const source = stepResult<ParseStepResult>(runResult, "parse-source");
	const intent = stepResult<AgentStepOutput>(runResult, "derive-screen-intent");
	const composition = stepResult<CompositionStepResult>(runResult, "plan-composition");
	const decoration = stepResult<DecorationStepResult>(runResult, "derive-decoration-plan");
	const pattern = stepResult<AgentStepOutput>(runResult, "select-pattern");
	const generation = stepResult<GenerationStepResult>(runResult, "generate-render-tree");
	const validation = stepResult<ValidationStepResult>(runResult, "validate-render-tree");
	const quality = stepResult<AgentStepOutput>(runResult, "review-quality");
	const write = stepResult<WriteArtifactsResult>(runResult, "write-artifacts");

	return {
		agentInput: generation.agentInput,
		agentResult: generation.agentResult,
		runnerRequest: generation.runnerRequest,
		...flattenAgentOutput("screenIntent", intent),
		...flattenAgentOutput("compositionPlan", composition),
		...flattenAgentOutput("patternSelection", pattern),
		...flattenAgentOutput("qualityReview", quality),
		decorationPlan: decoration?.decorationPlan,
		designContextBundleSelection: validation?.designContextBundleSelection,
		designSkillSelection: composition?.designSkillSelection,
		finalResult: extractPayloadArtifact(generation.payload, "renderTree"),
		generationSkillCatalog: generation.generationSkillCatalog,
		initialValidationReport: validation?.validationReport,
		outDir: options.outDir,
		parseCommandResult: source.parseCommandResult,
		patternLayerCandidates: decoration?.patternLayerCandidates,
		pipelineResult: write.pipelineResult,
		pipelineResultWrite: write.pipelineResultWrite,
		renderTreeGenerationSkill: generation.renderTreeGenerationSkill,
		runId: options.runId,
		sourcePath: options.sourcePath,
		sourceSpec: source.sourceSpec,
		summary: createScreenGenerationPipelineSummary(options, source, generation, validation),
		validationReport: validation?.validationReport,
	};
}

async function runReadSourceStage(
	_inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
): Promise<PipelineMarkdownSourceFile> {
	const result = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			{
				id: "read-source-markdown",
				input: {
					kind: options.sourceKind,
					path: options.sourcePath,
				},
				operation: "source-artifact-read",
			},
		],
		mode: "commit",
		runId: options.runId,
	});

	if (!result.ok) {
		throw new Error(`Pipeline source read failed: ${options.sourcePath}`);
	}

	return getSourceFileFromReadResult(result, options.sourceKind, options.sourcePath);
}

/** Rich output of parse-source: the spec plus the full parse command result. */
type ParseStepResult = {
	parseCommandResult: ReturnType<typeof runParseMarkdownSourceCommand>;
	sourceSpec: SourceSpec;
};

function runParseSourceStage(
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
): ParseStepResult {
	const sourceFile = inputs.source as PipelineMarkdownSourceFile | undefined;
	if (!sourceFile) {
		throw new Error("Cannot parse source before read-source stage.");
	}

	const parseCommandResult = runParseMarkdownSourceCommand({
		files: [sourceFile],
		importId: options.runId,
		receivedAt: "1970-01-01T00:00:00.000Z",
	});
	if (!parseCommandResult.parseResult.sourceSpec) {
		throw new Error("Markdown source parse finished without SourceSpec.");
	}
	return { parseCommandResult, sourceSpec: parseCommandResult.parseResult.sourceSpec };
}

async function runDeriveScreenIntentAiStep(
	inputs: ResolvedStepInputs,
	_options: NormalizedScreenGenerationPipelineOptions,
	runner: AgentRunner,
): Promise<unknown> {
	const nodeResult = await runScreenIntentNode({
		runner,
		sourceSpec: readSourceSpecInput(inputs),
	});
	return agentStepOutput(nodeResult);
}

async function runPlanCompositionAiStep(
	inputs: ResolvedStepInputs,
	_options: NormalizedScreenGenerationPipelineOptions,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs);
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

	return {
		agentInput: nodeResult.agentInput,
		agentResult: nodeResult.agentResult,
		compositionPlan: nodeResult.agentResult.payload,
		designContextBundleSelection: runDesignContextBundleRefsNode({
			compositionPlan: nodeResult.agentResult.payload,
			layerCandidates,
			screenIntent,
			sourceSpec,
		}),
		designSkillSelection,
		patternLayerCandidates: layerCandidates,
		runnerRequest: nodeResult.runnerRequest,
	};
}

function runDeriveDecorationPlanStage(inputs: ResolvedStepInputs): {
	decorationPlan?: DecorationPlanContract;
	patternLayerCandidates?: PatternLayerCandidate[];
} {
	const sourceSpec = readSourceSpecInput(inputs);
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decorationPlan = runDecorationPlanNode({
		compositionPlan: composition?.compositionPlan,
		sourceSpec,
	});
	return {
		decorationPlan,
		patternLayerCandidates: buildScreenGenerationPatternLayerCandidates(
			inputs.layoutCatalogs as ScreenGenerationLayoutCatalogRefs,
			sourceSpec,
			decorationPlan,
		),
	};
}

async function runSelectPatternAiStep(
	inputs: ResolvedStepInputs,
	_options: NormalizedScreenGenerationPipelineOptions,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs);
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
	options: NormalizedScreenGenerationPipelineOptions,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs);
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	const generationSkillCatalog = await (
		inputs.skillBundles as ScreenGenerationReferences["skillBundles"]
	).loadCatalog();
	const renderTreeGenerationSkill = findGenerationSkill(
		generationSkillCatalog,
		"render-tree-generation",
	);
	const designContextBundleContents = await loadDesignContextBundleContents(
		inputs.designContextBundles as ScreenGenerationReferences["designContextBundles"],
		composition?.designContextBundleSelection?.bundleRefs,
		options.disableDesignContext,
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

	return {
		...agentStepOutput({
			agentInput: nodeResult.agentInput,
			agentResult: repairAgentRunResultPayload(nodeResult.agentResult),
			runnerRequest: nodeResult.runnerRequest,
		}),
		generationSkillCatalog,
		renderTreeGenerationSkill,
	};
}

function runValidateRenderTreeStage(inputs: ResolvedStepInputs): ValidationStepResult {
	const sourceSpec = readSourceSpecInput(inputs);
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
	return {
		designContextBundleSelection: runDesignContextBundleRefsNode({
			compositionPlan: composition?.compositionPlan,
			layerCandidates: decoration?.patternLayerCandidates,
			screenIntent: readAgentStepPayload(inputs.intent),
			sourceSpec,
			validationReport,
		}),
		validationReport,
	};
}

async function runProposeComponentsAiStep(
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs);
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
		options.disableDesignContext,
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

	// 제안은 비파괴 아티팩트다. 검증은 bounded 여부만 리포트하고 파이프라인을 실패시키지 않는다.
	// allowedRefs는 source reference catalog(생성 입력 context)의 전체 vocabulary를 기준으로 한다.
	const componentProposalValidationReport = validateComponentProposal(
		nodeResult.agentResult.payload,
		{
			allowedRefs: nodeResult.agentInput.context.constraints.sourceReferenceCatalog.allowedRefs,
			catalogComponentTypes: componentContractCatalog.entries.map((entry) => entry.componentType),
		},
	);
	return { ...agentStepOutput(nodeResult), componentProposalValidationReport };
}

async function runReviewQualityAiStep(
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
	runner: AgentRunner,
): Promise<unknown> {
	const sourceSpec = readSourceSpecInput(inputs);
	const composition = inputs.composition as CompositionStepResult | undefined;
	const decoration = inputs.decoration as DecorationStepResult | undefined;
	const validation = inputs.validation as ValidationStepResult | undefined;
	const designContextBundleContents = await loadDesignContextBundleContents(
		inputs.designContextBundles as ScreenGenerationReferences["designContextBundles"],
		validation?.designContextBundleSelection?.bundleRefs,
		options.disableDesignContext,
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
	return agentStepOutput(nodeResult);
}

/** Rich output of generate-render-tree (agent triple + skill scaffolding). */
type GenerationStepResult = AgentStepOutput & {
	generationSkillCatalog?: ScreenGenerationSkillBundleRef[];
	renderTreeGenerationSkill?: ScreenGenerationSkillBundleRef;
};
/** Rich output of propose-components (agent triple + bounded-check report). */
type ProposalStepResult = AgentStepOutput & {
	componentProposalValidationReport?: ReturnType<typeof validateComponentProposal>;
};

/** Flatten an agent step output to the artifact builder's `<prefix>Agent*` fields. */
function flattenAgentOutput(prefix: string, out: AgentStepOutput | undefined) {
	return {
		[`${prefix}AgentInput`]: out?.agentInput,
		[`${prefix}AgentResult`]: out?.agentResult,
		[`${prefix}RunnerRequest`]: out?.runnerRequest,
	};
}

/** Assemble the artifact-builder input purely from resolved step outputs. */
function buildGenerationArtifactInput(
	inputs: ResolvedStepInputs,
	outDir: string,
): GenerationSmokeArtifactInput {
	const source = inputs.source as ParseStepResult;
	const intent = inputs.intent as AgentStepOutput;
	const composition = inputs.composition as CompositionStepResult;
	const decoration = inputs.decoration as DecorationStepResult;
	const pattern = inputs.pattern as AgentStepOutput;
	const generation = inputs.generation as GenerationStepResult;
	const validation = inputs.validation as ValidationStepResult;
	const proposal = inputs.proposal as ProposalStepResult;
	const quality = inputs.quality as AgentStepOutput;

	return {
		layers: SCREEN_GENERATION_ARTIFACT_LAYER_GROUPS,
		agentInput: generation.agentInput,
		agentResult: generation.agentResult,
		runnerRequest: generation.runnerRequest,
		...flattenAgentOutput("screenIntent", intent),
		...flattenAgentOutput("compositionPlan", composition),
		...flattenAgentOutput("patternSelection", pattern),
		...flattenAgentOutput("qualityReview", quality),
		...flattenAgentOutput("componentProposal", proposal),
		componentProposal: proposal?.payload,
		componentProposalValidationReport: proposal?.componentProposalValidationReport,
		decorationPlan: decoration?.decorationPlan,
		designContextBundleSelection: validation?.designContextBundleSelection,
		designCritique: quality?.payload,
		designSkillSelection: composition?.designSkillSelection,
		finalResult: extractPayloadArtifact(generation.payload, "renderTree"),
		generationSkillCatalog: generation.generationSkillCatalog,
		initialValidationReport: validation?.validationReport,
		outDir,
		parseCommandResult: source.parseCommandResult,
		patternLayerCandidates: decoration?.patternLayerCandidates,
		renderTreeGenerationSkill: generation.renderTreeGenerationSkill,
		sourceSpec: source.sourceSpec,
		validationReport: validation?.validationReport,
	};
}

/** Output of write-artifacts: the two side-effect write results for the projection. */
type WriteArtifactsResult = {
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
};

async function runWriteArtifactsStage(
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
): Promise<WriteArtifactsResult> {
	const commands = createGenerationSmokeArtifactCommands(
		buildGenerationArtifactInput(inputs, options.outDir),
	);

	const pipelineResult = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands,
		mode: "commit",
		runId: options.runId,
	});
	const pipelineResultWrite = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: createGenerationSmokePipelineResultCommands({
			outDir: options.outDir,
			pipelineResult,
		}),
		mode: "commit",
		runId: options.runId,
	});
	await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			createGenerationSmokeManifestCommand({
				manifest: createSmokeRunManifest(inputs, options),
				runDir: options.runDir,
			}),
		],
		mode: "commit",
		runId: options.runId,
	});
	return { pipelineResult, pipelineResultWrite };
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

/** Resolve the SourceSpec from a step's `source` input (parse-source output). */
function readSourceSpecInput(inputs: ResolvedStepInputs): SourceSpec {
	const source = inputs.source;
	if (isRecord(source) && "sourceShape" in source) return source as SourceSpec;
	if (isRecord(source) && "sourceSpec" in source && isRecord(source.sourceSpec)) {
		return source.sourceSpec as SourceSpec;
	}
	throw new Error("SourceSpec is required but the source input is missing it.");
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
	options: NormalizedScreenGenerationPipelineOptions,
	source: ParseStepResult,
	generation: AgentStepOutput,
	validation: ValidationStepResult | undefined,
): PipelineRunResult["summary"] {
	const sourceSpec = source.sourceSpec;
	const screen = sourceSpec?.sourceShape.screen;

	return {
		agentPayload: generation.agentResult?.payload,
		areaCount: sourceSpec ? countSourceAreas(sourceSpec) : 0,
		componentCount: sourceSpec ? countSourceComponents(sourceSpec) : 0,
		ok: source.parseCommandResult?.ok ?? false,
		outDir: options.outDir,
		screenCode: screen?.screenCode,
		session: generation.agentResult?.session,
		sourcePath: options.sourcePath,
		validationOk: validation?.validationReport?.ok,
	};
}

function createSmokeRunManifest(
	inputs: ResolvedStepInputs,
	options: NormalizedScreenGenerationPipelineOptions,
): SmokeRunManifest {
	const source = inputs.source as ParseStepResult;
	const generation = inputs.generation as GenerationStepResult;
	const validation = inputs.validation as ValidationStepResult | undefined;
	const summary = createScreenGenerationPipelineSummary(options, source, generation, validation);
	const validationSummary = validation?.validationReport?.summary;

	const artifact = (fileName: string) => `artifacts/${fileName}`;

	return {
		agentMode: options.agentMode,
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
		runId: options.runId,
		schemaVersion: "smoke-run-manifest.v0.1",
		screenIntent: artifact(ARTIFACT_FILES.screenIntent),
		sourcePath: path.relative(resolveInvocationRoot(), options.sourcePath),
		sourceSpec: artifact(ARTIFACT_FILES.sourceSpec),
		stageLayers: createSmokeRunStageLayers(artifact),
		stageOrder: getScreenGenerationStageOrder(),
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
		tags: options.tags,
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
