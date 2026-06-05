import type { SCHEMA_VERSION } from "./versions";

export type AgentResultContract = {
	payload: unknown;
	schemaVersion: typeof SCHEMA_VERSION.agentResult;
	taskKind:
		| "composition-planning"
		| "quality-review"
		| "screen-generation"
		| "screen-intent"
		| "screen-revision";
};
