import type { SCHEMA_VERSION } from "./versions";

export type AgentResultContract = {
	payload: unknown;
	schemaVersion: typeof SCHEMA_VERSION.agentResult;
	taskKind: "quality-review" | "screen-generation" | "screen-revision";
};
