import type { AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import type { ScreenGenerationAgentInput } from "@cx/orchestration/types";
import type { ParseMarkdownSourceCommandResult } from "@cx/pipeline/parser";
import type { SideEffectExecutionResult } from "@cx/pipeline/types";
import type { SourceSpec } from "@cx/schema";

export type GenerationSmokeOptions = {
	outDir?: string;
	runId?: string;
	useAI?: boolean;
};

export type GenerationSmokeSummary = {
	agentPayload?: unknown;
	areaCount: number;
	componentCount: number;
	ok: boolean;
	outDir: string;
	screenCode?: string;
	session?: AgentRunResult["session"];
	sourcePath: string;
};

export type GenerationSmokeResult = {
	agentInput?: ScreenGenerationAgentInput;
	agentResult?: AgentRunResult;
	outDir: string;
	parseCommandResult: ParseMarkdownSourceCommandResult;
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
	runId: string;
	runnerRequest?: AgentRunnerRequest;
	sourcePath: string;
	sourceSpec?: SourceSpec;
	summary: GenerationSmokeSummary;
};
