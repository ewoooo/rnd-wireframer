import type { SCHEMA_VERSION } from "./versions";

export type DraftCandidateContract = {
	candidate: Record<string, unknown>;
	schemaVersion: typeof SCHEMA_VERSION.draftCandidate;
};
