import type { SCHEMA_VERSION } from "./versions";

export type QualityInspectionContract = {
	inspection: Record<string, unknown>;
	schemaVersion: typeof SCHEMA_VERSION.qualityInspection;
};
