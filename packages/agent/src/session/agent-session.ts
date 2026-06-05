import type { AgentSessionMode } from "../contract";

export type AgentSession = {
	mode: AgentSessionMode;
	sessionId?: string;
	reason?: string;
};
