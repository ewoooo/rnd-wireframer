import type { SCHEMA_VERSION } from "./versions";

export type QualityInspectionLayer = "compose" | "revise" | "understand";

export type QualityInspectionFinding = {
	code: string;
	layer?: QualityInspectionLayer;
	message: string;
	path?: Array<string | number>;
	severity: "error" | "info" | "warning";
	suggestion?: string;
};

export type QualityInspectionScores = {
	actionClarity: number;
	densityFit: number;
	fidelity: number;
	hierarchy: number;
	patternFit: number;
	separation: number;
};

export type QualityInspectionContract = {
	findings: QualityInspectionFinding[];
	inspection: {
		compositionAligned: boolean;
		sourceFaithful: boolean;
		visualHierarchyClear: boolean;
	};
	scores?: QualityInspectionScores;
	schemaVersion: typeof SCHEMA_VERSION.qualityInspection;
	summary: {
		errorCount: number;
		warningCount: number;
	};
};
