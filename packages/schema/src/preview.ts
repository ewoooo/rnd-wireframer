import type { SCHEMA_VERSION } from "./versions";

export type PreviewContract = {
	preview: Record<string, unknown>;
	schemaVersion: typeof SCHEMA_VERSION.preview;
};
