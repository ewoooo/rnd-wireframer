import type { AgentRunner } from "@cx/agent/contract";
import type {
	DecorationPlanContract,
	DesignContextBundleContent,
	DesignContextBundleRef,
	SourceSpec,
	ValidationReportContract,
} from "@cx/schema";
import type { AgentPromptNodeResult } from "../agent";
import { runAgentPromptNode } from "../agent";
import {
	buildComponentProposalAgentInput,
	buildCompositionPlanAgentInput,
	buildPatternSelectionAgentInput,
	buildQualityReviewAgentInput,
	buildScreenGenerationAgentInput,
	buildScreenRevisionAgentInput,
} from "./planning/generation";
import type {
	ComponentContractCatalog,
	ComponentProposalAgentInput,
	CompositionPlanAgentInput,
	DesignSkillSelectionContract,
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	QualityReviewAgentInput,
	ScreenGenerationAgentInput,
	ScreenRevisionAgentInput,
} from "./planning/types";

export type RunCompositionPlanNodeInput = {
	designSkillSelection?: DesignSkillSelectionContract;
	layerCandidates: PatternLayerCandidate[];
	runner: AgentRunner;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
};

export function runCompositionPlanNode(
	input: RunCompositionPlanNodeInput,
): Promise<AgentPromptNodeResult<CompositionPlanAgentInput>> {
	const agentInput = buildCompositionPlanAgentInput({
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		screenIntent: input.screenIntent,
		sourceSpec: input.sourceSpec,
	});
	return runAgentPromptNode({
		agentInput,
		runner: input.runner,
		taskKind: "composition-planning",
	});
}

export type RunPatternSelectionNodeInput = {
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	designSkillSelection?: DesignSkillSelectionContract;
	layerCandidates: PatternLayerCandidate[];
	runner: AgentRunner;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
};

export function runPatternSelectionNode(
	input: RunPatternSelectionNodeInput,
): Promise<AgentPromptNodeResult<PatternSelectionAgentInput>> {
	const agentInput = buildPatternSelectionAgentInput({
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		screenIntent: input.screenIntent,
		sourceSpec: input.sourceSpec,
	});
	return runAgentPromptNode({
		agentInput,
		runner: input.runner,
		taskKind: "pattern-selection",
	});
}

export type RunScreenGenerationNodeInput = {
	componentContractCatalog?: ComponentContractCatalog;
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	designContextBundles?: DesignContextBundleContent[];
	designSkillSelection?: DesignSkillSelectionContract;
	layerCandidates?: PatternLayerCandidate[];
	patternSelection?: unknown;
	runner: AgentRunner;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
};

export function runScreenGenerationNode(
	input: RunScreenGenerationNodeInput,
): Promise<AgentPromptNodeResult<ScreenGenerationAgentInput>> {
	const agentInput = buildScreenGenerationAgentInput(input.sourceSpec, {
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
	});
	return runAgentPromptNode({
		agentInput,
		runner: input.runner,
		taskKind: "screen-generation",
	});
}

export type RunComponentProposalNodeInput = RunScreenGenerationNodeInput & {
	candidate?: unknown;
};

export function runComponentProposalNode(
	input: RunComponentProposalNodeInput,
): Promise<AgentPromptNodeResult<ComponentProposalAgentInput>> {
	const agentInput = buildComponentProposalAgentInput({
		candidate: input.candidate,
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
		sourceSpec: input.sourceSpec,
	});
	return runAgentPromptNode({
		agentInput,
		runner: input.runner,
		taskKind: "component-proposal",
	});
}

export type RunQualityReviewNodeInput = RunScreenGenerationNodeInput & {
	candidate?: unknown;
	validationReport?: ValidationReportContract;
};

export function runQualityReviewNode(
	input: RunQualityReviewNodeInput,
): Promise<AgentPromptNodeResult<QualityReviewAgentInput>> {
	const agentInput = buildQualityReviewAgentInput({
		candidate: input.candidate,
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
		sourceSpec: input.sourceSpec,
		validationReport: input.validationReport,
	});
	return runAgentPromptNode({
		agentInput,
		runner: input.runner,
		taskKind: "quality-review",
	});
}

export type RunScreenRevisionNodeInput = RunScreenGenerationNodeInput & {
	previousCandidate?: unknown;
	qualityInspection?: unknown;
	validationReport?: ValidationReportContract;
};

export function runScreenRevisionNode(
	input: RunScreenRevisionNodeInput,
): Promise<AgentPromptNodeResult<ScreenRevisionAgentInput>> {
	const agentInput = buildScreenRevisionAgentInput({
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		previousCandidate: input.previousCandidate,
		qualityInspection: input.qualityInspection,
		screenIntent: input.screenIntent,
		sourceSpec: input.sourceSpec,
		validationReport: input.validationReport,
	});
	return runAgentPromptNode({
		agentInput,
		previousResult: agentInput.previousResult,
		runner: input.runner,
		taskKind: "screen-revision",
	});
}
