import {
	assertClaudeResumeAllowed,
	resolveClaudeSessionMode,
} from "../claude/claude-session-policy";
import type { AgentRunRequest, AgentRunResult, AgentRuntime } from "../contract";
import { resolveTaskDefinition } from "./resolve-task-runner";

export async function runAgentTask(
	runtime: AgentRuntime,
	request: AgentRunRequest,
): Promise<AgentRunResult> {
	const task = resolveTaskDefinition(request.taskKind);
	const prompt = task.createPrompt(request.input);
	assertClaudeResumeAllowed(request);
	const sessionMode = resolveClaudeSessionMode(task, request);

	return runtime.run({
		...request,
		prompt,
		session: {
			...request.session,
			mode: sessionMode,
		},
	});
}
