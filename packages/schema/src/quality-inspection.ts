import type { SCHEMA_VERSION } from "./versions";

export type QualityInspectionFinding = {
	code: string;
	message: string;
	path?: Array<string | number>;
	severity: "error" | "info" | "warning";
	suggestion?: string;
};

export type QualityInspectionContract = {
	findings: QualityInspectionFinding[];
	inspection: {
		compositionAligned: boolean;
		sourceFaithful: boolean;
		visualHierarchyClear: boolean;
	};
	schemaVersion: typeof SCHEMA_VERSION.qualityInspection;
	summary: {
		errorCount: number;
		warningCount: number;
	};
};
