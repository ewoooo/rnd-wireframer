import type { SCHEMA_VERSION } from "./versions";

export type AgentRequestContract = {
	context?: unknown;
	query: string;
	schemaVersion: typeof SCHEMA_VERSION.agentRequest;
	taskKind: "quality-review" | "screen-generation" | "screen-revision";
};
