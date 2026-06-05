import type { SCHEMA_VERSION } from "./versions";

export type ApplyResultContract = {
	appliedArtifacts: Array<{
		kind: string;
		uri: string;
		version?: string;
	}>;
	ok: boolean;
	schemaVersion: typeof SCHEMA_VERSION.applyResult;
};
