import type { AgentPromptArtifact, AgentTaskInput } from "../../contract";

export function createComponentProposalPrompt(input: AgentTaskInput): AgentPromptArtifact {
	return {
		system: "You are the Claude component-proposal agent for RND Screen Generator.",
		user: input.query,
		metadata: {
			taskKind: "component-proposal",
			context: input.context,
		},
	};
}
