import type { AgentRunner } from "@cx/agent/contract";
import {
	createRenderTreeValidationReport,
	runComponentProposalNode,
	runCompositionPlanNode,
	runDecorationPlanNode,
	runDesignContextBundleRefsNode,
	runDesignSkillSelectionNode,
	runPatternSelectionNode,
	runQualityReviewNode,
	runScreenGenerationNode,
	runScreenIntentNode,
} from "@cx/inference-nodes/screen-generation";
import { validateComponentProposal } from "@cx/validation";

import { createNodePipelineAdapters } from "../../adapters";
import { runParseMarkdownSourceCommand } from "../../commands";
import type {
	PipelineMarkdownSourceFile,
	ResolvedStepInputs,
	ScreenGenerationComponentCatalogRefs,
	ScreenGenerationLayoutCatalogRefs,
	ScreenGenerationReferences,
} from "../../public/types";
import { runSideEffects } from "../../runner";
import {
	buildScreenGenerationPatternLayerCandidates,
	buildSourceComponentContractCatalog,
	findGenerationSkill,
	getSourceFileFromReadResult,
	loadDesignContextBundleContents,
	readSourceSpecInput,
	repairAgentRunResultPayload,
} from "./node-helpers";
import type { NormalizedScreenGenerationPipelineOptions } from "./options";
import {
	agentStepOutput,
	type CompositionStepResult,
	type DecorationStepResult,
	type ParseStepResult,
	readAgentStepPayload,
	type ValidationStepResult,
} from "./step-results";

export async function runReadSourceStage(
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

export function runParseSourceStage(
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

export async function runDeriveScreenIntentAiStep(
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

export async function runPlanCompositionAiStep(
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

export function runDeriveDecorationPlanStage(inputs: ResolvedStepInputs): DecorationStepResult {
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

export async function runSelectPatternAiStep(
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

export async function runGenerateRenderTreeAiStep(
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

export function runValidateRenderTreeStage(inputs: ResolvedStepInputs): ValidationStepResult {
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

export async function runProposeComponentsAiStep(
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

export async function runReviewQualityAiStep(
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
