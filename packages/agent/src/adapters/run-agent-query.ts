import type { AgentRunResult, AgentRuntime, AgentTaskInput, AgentTaskKind } from "../contract";
import { runAgentTask } from "../runtime/run-agent-task";

export type AgentQueryRequest = {
	taskKind: AgentTaskKind;
	query: string;
	context?: unknown;
	previousResult?: unknown;
	sessionId?: string;
	resume?: boolean;
};

export async function runAgentQuery(
	runtime: AgentRuntime,
	request: AgentQueryRequest,
): Promise<AgentRunResult> {
	const input: AgentTaskInput = {
		query: request.query,
		context: request.context,
		previousResult: request.previousResult,
	};

	return runAgentTask(runtime, {
		taskKind: request.taskKind,
		input,
		session: {
			mode: request.resume ? "resume" : undefined,
			sessionId: request.sessionId,
			reason: request.resume ? "explicit-resume" : undefined,
		},
	});
}
