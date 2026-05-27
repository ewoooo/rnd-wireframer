import type { ValidationIssue } from "./validation";

export type QualityIssueCategory =
	| "schema"
	| "reference"
	| "vocabulary"
	| "renderability"
	| "layout"
	| "component"
	| "hierarchy"
	| "sourceTrace";

export type QualityIssueOwner =
	| "source"
	| "prompt"
	| "catalog"
	| "pattern"
	| "component"
	| "renderer"
	| "unknown";

export type QualityIssue = {
	id: string;
	category: QualityIssueCategory;
	severity: "error" | "warning" | "info";
	message: string;
	path?: ReadonlyArray<string | number>;
	nodeId?: string;
	owner: QualityIssueOwner;
	originalCodes?: string[];
	validationIssues?: ValidationIssue[];
};

export type QualityReportSummary = {
	errorCount: number;
	warningCount: number;
	infoCount: number;
	categories: Partial<Record<QualityIssueCategory, number>>;
	owners: Partial<Record<QualityIssueOwner, number>>;
};

export type QualityReport = {
	schemaVersion: "quality-report.v1";
	ok: boolean;
	generatedAt: string;
	sourceId?: string;
	summary: QualityReportSummary;
	issues: QualityIssue[];
	nextActions: string[];
};
