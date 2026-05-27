import type { SCHEMA_VERSION } from "./versions";

export type GenerationContext = {
	schemaVersion: typeof SCHEMA_VERSION.generationContext;
	context: Record<string, unknown>;
};
