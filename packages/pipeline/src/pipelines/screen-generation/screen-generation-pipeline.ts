import path from "node:path";

import { createClaudeRunner } from "@cx/agent/claude";
import type { AgentRunner, AgentTaskKind } from "@cx/agent/contract";
import { agentTaskCatalog } from "@cx/agent/tasks";
import {
	createFakeComponentProposal,
	createFakeCompositionPlan,
	createFakeGenerationAgentRunner,
	createFakePatternSelection,
	createFakeQualityInspection,
	createFakeScreenIntent,
	runDesignSkillSelectionNode,
} from "@cx/inference-nodes/screen-generation";

import { createNodePipelineAdapters } from "../../adapters";
import { contract, definePipeline, defineStep, refInput, stepOutput } from "../../definition";
import type { SmokeRunManifest } from "../../public/smoke-run-manifest";
import type {
	OutputContract,
	PipelineRunResult,
	PipelineStageId,
	ReferenceResolver,
	ResolvedStepInputs,
	ScreenGenerationPipelineOptions,
	ScreenGenerationReferences,
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
} from "./constants";
import {
	buildScreenGenerationPatternLayerCandidates,
	countSourceAreas,
	countSourceComponents,
	extractPayloadArtifact,
	readSourceSpecInput,
} from "./node-helpers";
import {
	type NormalizedScreenGenerationPipelineOptions,
	normalizeScreenGenerationPipelineOptions,
	resolveInvocationRoot,
} from "./options";
import {
	runDeriveDecorationPlanStage,
	runDeriveScreenIntentAiStep,
	runGenerateRenderTreeAiStep,
	runParseSourceStage,
	runPlanCompositionAiStep,
	runProposeComponentsAiStep,
	runReadSourceStage,
	runReviewQualityAiStep,
	runSelectPatternAiStep,
	runValidateRenderTreeStage,
} from "./step-nodes";
import {
	type AgentStepOutput,
	type CompositionStepResult,
	type DecorationStepResult,
	flattenAgentOutput,
	type GenerationStepResult,
	type ParseStepResult,
	type ProposalStepResult,
	readAgentStepPayload,
	type ValidationStepResult,
	type WriteArtifactsResult,
} from "./step-results";

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
 * its metadata (id/layer/kind/message/output, optional taskKind), its
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
