import type { AgentTaskInput } from "./task-catalog";
import type { AgentRunner } from "./task-runner-contract";

export type AgentSessionMode = "new" | "resume";

export type AgentSessionRequest = {
	mode?: AgentSessionMode;
	sessionId?: string;
	reason?: string;
};

export type AgentRunRequest = {
	taskKind: string;
	input: AgentTaskInput;
	session?: AgentSessionRequest;
};

export type AgentRunResult = {
	taskKind: string;
	session: {
		mode: AgentSessionMode;
		sessionId?: string;
	};
	payload: unknown;
};

export type AgentRuntime = {
	run: AgentRunner;
};
