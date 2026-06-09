import type { AgentRunRequest, AgentSessionMode, AgentTaskDefinition } from "../contract";

export function resolveClaudeSessionMode(
	task: AgentTaskDefinition,
	request: AgentRunRequest,
): AgentSessionMode {
	if (request.session?.mode === "resume") return "resume";
	return task.defaultSessionMode;
}

export function assertClaudeResumeAllowed(request: AgentRunRequest): void {
	if (request.session?.mode === "resume" && !request.session.sessionId) {
		throw new Error("Claude resume requires a session id.");
	}
}

export function assertResolvedClaudeResumeAllowed(
	request: AgentRunRequest,
	sessionMode: AgentSessionMode,
): void {
	if (sessionMode === "resume" && !request.session?.sessionId) {
		throw new Error("Claude resume requires a session id.");
	}
}
