import type { AgentRunner, AgentRunnerRequest } from "@cx/agent/contract";
import type { ScreenGenerationAgentInput } from "@cx/orchestration/types";

export function createFakeGenerationAgentRunner(input: {
	agentInput: ScreenGenerationAgentInput;
	onRequest: (request: AgentRunnerRequest) => void;
}): AgentRunner {
	return async (request) => {
		input.onRequest(request);

		return {
			payload: {
				receivedTaskKind: request.taskKind,
				smoke: true,
				sourceSummary: input.agentInput.context.sourceSummary,
			},
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		};
	};
}
