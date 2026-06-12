export class AgentTaskNotFoundError extends Error {
	constructor(taskKind: string) {
		super(`Agent task is not registered: ${taskKind}`);
		this.name = "AgentTaskNotFoundError";
	}
}

export class AgentRunnerNotConfiguredError extends Error {
	constructor() {
		super("Agent runner is not configured yet.");
		this.name = "AgentRunnerNotConfiguredError";
	}
}
