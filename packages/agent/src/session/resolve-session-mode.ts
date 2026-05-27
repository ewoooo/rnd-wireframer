import type { AgentRunRequest, AgentSessionMode, AgentTaskDefinition } from "../contract";
import { resolveResumePolicy } from "./resume-policy";

export function resolveSessionMode(
	task: AgentTaskDefinition,
	request: AgentRunRequest,
): AgentSessionMode {
	return resolveResumePolicy(task, request);
}
