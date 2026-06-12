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

/**
 * Revision이 기계적으로 소비하는 수정 지시. error finding 중 구조 수정으로
 * 해결 가능한 것만 directive로 승격된다 — directive가 1개 이상이면 design-revision
 * step이 실행된다. SourceSpec 항목 자체를 고치는 지시는 만들 수 없다.
 */
export type QualityRevisionDirective = {
	action: "adjust-rhythm" | "change-component" | "change-layout" | "change-structure";
	evidence?: {
		referenceIds?: string[];
		skillIds?: string[];
		sourceRefs?: string[];
	};
	findingCode: string;
	mustPreserveSourceRefs: string[];
	path: Array<string | number>;
	suggestedChange: string;
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
	revisionDirectives?: QualityRevisionDirective[];
	scores?: QualityInspectionScores;
	schemaVersion: typeof SCHEMA_VERSION.qualityInspection;
	summary: {
		errorCount: number;
		warningCount: number;
	};
};
