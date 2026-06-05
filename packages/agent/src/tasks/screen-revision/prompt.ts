import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createScreenRevisionPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude revision agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			taskKind: "screen-revision",
			context: input.context,
			previousResult: input.previousResult,
		},
	};
}
