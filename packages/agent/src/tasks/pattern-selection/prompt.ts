import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createPatternSelectionPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude pattern selection agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			taskKind: "pattern-selection",
			context: input.context,
		},
	};
}
