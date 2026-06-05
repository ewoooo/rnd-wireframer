import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import type {
	AgentRunner,
	AgentRunnerRequest,
	AgentRunResult,
	AgentTaskKind,
} from "@cx/agent/contract";

export type AgentPromptNodeInput<TAgentInput extends { context?: unknown; query: string }> = {
	agentInput: TAgentInput;
	onRunnerRequest?: (request: AgentRunnerRequest) => void;
	previousResult?: unknown;
	runner: AgentRunner;
	taskKind: AgentTaskKind;
};

export type AgentPromptNodeResult<TAgentInput> = {
	agentInput: TAgentInput;
	agentResult: AgentRunResult;
	runnerRequest?: AgentRunnerRequest;
};

export async function runAgentPromptNode<TAgentInput extends { context?: unknown; query: string }>(
	input: AgentPromptNodeInput<TAgentInput>,
): Promise<AgentPromptNodeResult<TAgentInput>> {
	let runnerRequest: AgentRunnerRequest | undefined;
	const runtime = createAgentRuntime({
		runner: async (request) => {
			runnerRequest = request;
			input.onRunnerRequest?.(request);
			return input.runner(request);
		},
	});

	const agentResult = await runAgentQuery(runtime, {
		context: input.agentInput.context,
		previousResult: input.previousResult,
		query: input.agentInput.query,
		taskKind: input.taskKind,
	});

	return {
		agentInput: input.agentInput,
		agentResult,
		runnerRequest,
	};
}
