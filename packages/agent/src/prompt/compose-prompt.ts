import type { AgentPromptArtifact, AgentTaskDefinition, AgentTaskInput } from "../contract";

export function composePrompt(
	task: AgentTaskDefinition,
	input: AgentTaskInput,
): AgentPromptArtifact {
	return task.createPrompt(input);
}
