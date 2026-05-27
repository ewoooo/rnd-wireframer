import type { AgentRunRequest, AgentSessionMode, AgentTaskDefinition } from "../contract";

export function resolveResumePolicy(
	task: AgentTaskDefinition,
	request: AgentRunRequest,
): AgentSessionMode {
	if (request.session?.mode === "resume") return "resume";
	return task.defaultSessionMode;
}
