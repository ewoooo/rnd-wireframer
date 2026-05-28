import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createScreenIntentPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude screen intent agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			context: input.context,
			taskKind: "screen-intent",
		},
	};
}
