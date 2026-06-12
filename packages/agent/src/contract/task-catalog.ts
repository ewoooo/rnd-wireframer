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
