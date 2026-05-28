export type AgentTaskKind =
	| "composition-planning"
	| "pattern-selection"
	| "quality-review"
	| "screen-generation"
	| "screen-intent"
	| "screen-revision";

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
