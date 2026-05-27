import type { QualityIssueCategory, QualityIssueOwner } from "./quality-report";

export type QualityBacklogItemStatus = "candidate" | "ready";

export type QualityBacklogItem = {
	id: string;
	status: QualityBacklogItemStatus;
	owner: Extract<QualityIssueOwner, "catalog" | "component" | "pattern">;
	category: QualityIssueCategory;
	severity: "error" | "warning" | "info";
	occurrences: number;
	sourceIds: string[];
	originalCodes: string[];
	messages: string[];
	nodeIds: string[];
};

export type QualityBacklogSummary = {
	candidateCount: number;
	readyCount: number;
	owners: Partial<Record<QualityBacklogItem["owner"], number>>;
};

export type QualityBacklog = {
	schemaVersion: "quality-backlog.v1";
	generatedAt: string;
	minOccurrences: number;
	summary: QualityBacklogSummary;
	items: QualityBacklogItem[];
};
