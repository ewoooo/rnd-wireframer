import type { AgentSession } from "./agent-session";

export type AgentSessionStore = {
	read: (sessionId: string) => AgentSession | undefined;
	write: (sessionId: string, session: AgentSession) => void;
};

export function createMemorySessionStore(
	initialSessions: Record<string, AgentSession> = {},
): AgentSessionStore {
	const sessions = new Map(Object.entries(initialSessions));

	return {
		read: (sessionId) => sessions.get(sessionId),
		write: (sessionId, session) => {
			sessions.set(sessionId, session);
		},
	};
}
