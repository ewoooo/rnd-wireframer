import type { AgentTaskDefinition, AgentTaskKind } from "../contract";
import { AgentTaskNotFoundError } from "../errors/agent-error";
import { agentTaskCatalog } from "../tasks";

export function resolveTaskDefinition(taskKind: AgentTaskKind): AgentTaskDefinition {
	const task = agentTaskCatalog[taskKind];
	if (!task) throw new AgentTaskNotFoundError(taskKind);
	return task;
}
