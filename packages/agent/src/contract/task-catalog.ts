export type AgentTaskKind = "screen-generation" | "screen-revision" | "quality-review";

export type AgentTaskInput = {
	query: string;
	context?: unknown;
	previousResult?: unknown;
};

export type AgentPromptArtifact = {
	system: string;
	user: string;
	metadata?: Record<string, unknown>;
};

export type AgentTaskDefinition = {
	kind: AgentTaskKind;
	description: string;
	defaultSessionMode: "new" | "resume";
	createPrompt: (input: AgentTaskInput) => AgentPromptArtifact;
};
