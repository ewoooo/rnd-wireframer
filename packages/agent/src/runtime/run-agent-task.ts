import type { AgentRunRequest, AgentRunResult, AgentRuntime } from "../contract";
import { composePrompt } from "../prompt";
import { resolveSessionMode } from "../session";
import { resolveTaskDefinition } from "./resolve-task-runner";

export async function runAgentTask(
	runtime: AgentRuntime,
	request: AgentRunRequest,
): Promise<AgentRunResult> {
	const task = resolveTaskDefinition(request.taskKind);
	const prompt = composePrompt(task, request.input);
	const sessionMode = resolveSessionMode(task, request);

	return runtime.run({
		...request,
		prompt,
		session: {
			...request.session,
			mode: sessionMode,
		},
	});
}
