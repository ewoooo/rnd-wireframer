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

/** claude CLI 응답 envelope의 사용량 메타. 필드는 CLI가 주는 만큼만 채워진다. */
export type AgentUsage = {
	inputTokens?: number;
	outputTokens?: number;
	cacheCreationInputTokens?: number;
	cacheReadInputTokens?: number;
	totalCostUsd?: number;
	durationMs?: number;
};

export type AgentRunResult = {
	taskKind: string;
	session: {
		mode: AgentSessionMode;
		sessionId?: string;
	};
	payload: unknown;
	usage?: AgentUsage;
};

export type AgentRuntime = {
	run: AgentRunner;
};
