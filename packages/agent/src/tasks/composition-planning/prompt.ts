import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createCompositionPlanningPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude composition planning agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			context: input.context,
			taskKind: "composition-planning",
		},
	};
}
