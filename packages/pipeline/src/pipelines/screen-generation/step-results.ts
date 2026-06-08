import type { AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import type {
	DesignContextBundleSelection,
	PatternLayerCandidate,
} from "@cx/inference-nodes/screen-generation";
import type {
	DecorationPlanContract,
	DesignSkillSelectionContract,
	SourceSpec,
	ValidationReportContract,
} from "@cx/schema";
import { isRecord } from "@cx/types/guards";
import type { validateComponentProposal } from "@cx/validation";
import type { ParseMarkdownSourceCommandResult } from "../../commands";
import type { ScreenGenerationSkillBundleRef, SideEffectExecutionResult } from "../../public/types";

/**
 * Rich output of an AI step: the agent triple plus the unwrapped payload.
 * Steps return this so the projection can assemble artifacts/result from engine
 * step outputs — there is no blackboard. Downstream consumers read `.payload`.
 */
export type AgentStepOutput<TPayload = unknown> = {
	agentInput?: unknown;
	agentResult?: AgentRunResult;
	payload?: TPayload;
	runnerRequest?: AgentRunnerRequest;
};

/** Build the rich AI-step output from an inference-node result. */
export function agentStepOutput<TPayload>(nodeResult: {
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
export function readAgentStepPayload(value: unknown): unknown {
	return isRecord(value) ? (value as AgentStepOutput).payload : undefined;
}

/** Flatten an agent step output to the artifact builder's `<prefix>Agent*` fields. */
export function flattenAgentOutput(prefix: string, out: AgentStepOutput | undefined) {
	return {
		[`${prefix}AgentInput`]: out?.agentInput,
		[`${prefix}AgentResult`]: out?.agentResult,
		[`${prefix}RunnerRequest`]: out?.runnerRequest,
	};
}

/** Rich output of parse-source: the spec plus the full parse command result. */
export type ParseStepResult = {
	parseCommandResult: ParseMarkdownSourceCommandResult;
	sourceSpec: SourceSpec;
};

/** Rich output of plan-composition, consumed by downstream steps via outputOf. */
export type CompositionStepResult = {
	agentInput?: unknown;
	agentResult?: AgentRunResult;
	compositionPlan?: unknown;
	designContextBundleSelection?: DesignContextBundleSelection;
	designSkillSelection?: DesignSkillSelectionContract;
	patternLayerCandidates?: PatternLayerCandidate[];
	runnerRequest?: AgentRunnerRequest;
};

/** Rich output of derive-decoration-plan. */
export type DecorationStepResult = {
	decorationPlan?: DecorationPlanContract;
	patternLayerCandidates?: PatternLayerCandidate[];
};

/** Rich output of the validate step: the report plus the (re-derived) bundle selection. */
export type ValidationStepResult = {
	designContextBundleSelection?: DesignContextBundleSelection;
	validationReport: ValidationReportContract;
};

/** Rich output of generate-render-tree (agent triple + skill scaffolding). */
export type GenerationStepResult = AgentStepOutput & {
	generationSkillCatalog?: ScreenGenerationSkillBundleRef[];
	renderTreeGenerationSkill?: ScreenGenerationSkillBundleRef;
};

/** Rich output of propose-components (agent triple + bounded-check report). */
export type ProposalStepResult = AgentStepOutput & {
	componentProposalValidationReport?: ReturnType<typeof validateComponentProposal>;
};

/** Output of write-artifacts: the two side-effect write results for the projection. */
export type WriteArtifactsResult = {
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
};
