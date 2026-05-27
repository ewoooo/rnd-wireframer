import type { AgentRunRequest, AgentRunResult } from "../contract";

export type AgentRunLog = {
	taskKind: string;
	sessionMode?: string;
};

export function createAgentRunLog(_request: AgentRunRequest, result: AgentRunResult): AgentRunLog {
	return {
		taskKind: result.taskKind,
		sessionMode: result.session.mode,
	};
}
