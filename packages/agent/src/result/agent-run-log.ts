import type { AgentRunRequest, AgentRunResult } from "../contract";

export type AgentRunLog = {
	taskKind: string;
	sessionMode?: string;
	hasRawText: boolean;
};

export function createAgentRunLog(request: AgentRunRequest, result: AgentRunResult): AgentRunLog {
	return {
		taskKind: request.taskKind,
		sessionMode: result.session.mode,
		hasRawText: Boolean(result.rawText),
	};
}
