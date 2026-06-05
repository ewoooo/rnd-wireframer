import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createQualityReviewPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude quality review agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			taskKind: "quality-review",
			context: input.context,
		},
	};
}
