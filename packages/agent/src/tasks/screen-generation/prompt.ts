import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createScreenGenerationPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude generation agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			taskKind: "screen-generation",
			context: input.context,
		},
	};
}
