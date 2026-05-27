import type { AgentRunRequest, AgentRunResult, AgentSessionMode } from "../contract";

export type NormalizeAgentResultInput = {
	request: AgentRunRequest;
	sessionMode: AgentSessionMode;
	payload: unknown;
	sessionId?: string;
};

export function normalizeAgentResult(input: NormalizeAgentResultInput): AgentRunResult {
	return {
		taskKind: input.request.taskKind,
		session: {
			mode: input.sessionMode,
			sessionId: input.sessionId,
		},
		payload: input.payload,
	};
}
