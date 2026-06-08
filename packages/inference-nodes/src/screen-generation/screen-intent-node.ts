import type { AgentRunner, AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import type { SourceSpec } from "@cx/schema";
import { runAgentPromptNode } from "../agent";
import { buildScreenIntentAgentInput } from "./planning/generation";
import type { ScreenIntentAgentInput } from "./planning/types";

export type RunScreenIntentNodeInput = {
	onRunnerRequest?: (request: AgentRunnerRequest) => void;
	runner: AgentRunner;
	sourceSpec: SourceSpec;
};

export type RunScreenIntentNodeResult = {
	agentInput: ScreenIntentAgentInput;
	agentResult: AgentRunResult;
	runnerRequest?: AgentRunnerRequest;
};

export async function runScreenIntentNode(
	input: RunScreenIntentNodeInput,
): Promise<RunScreenIntentNodeResult> {
	const agentInput = buildScreenIntentAgentInput(input.sourceSpec);
	return runAgentPromptNode({
		agentInput,
		onRunnerRequest: input.onRunnerRequest,
		runner: input.runner,
		taskKind: "screen-intent",
	});
}
