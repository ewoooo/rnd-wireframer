import type {
	QualityIssue,
	QualityIssueCategory,
	QualityIssueOwner,
	QualityReport,
	ValidationIssue,
	ValidationLayer,
} from "@cx/types";

const CATEGORY_BY_LAYER: Record<ValidationLayer, QualityIssueCategory> = {
	schema: "schema",
	"node-type": "vocabulary",
	contract: "renderability",
	reference: "reference",
	tokens: "layout",
	version: "renderability",
};

const CATEGORY_BY_CODE_PREFIX: Array<{
	prefix: string;
	category: QualityIssueCategory;
	owner: QualityIssueOwner;
}> = [
	{ prefix: "composition.source-ref", category: "sourceTrace", owner: "source" },
	{ prefix: "composition.source-refs", category: "sourceTrace", owner: "source" },
	{ prefix: "composition.primitive", category: "component", owner: "component" },
	{ prefix: "composition.component-pattern", category: "component", owner: "catalog" },
	{ prefix: "composition.prop-contract", category: "component", owner: "component" },
	{ prefix: "composition.visual-hierarchy", category: "hierarchy", owner: "prompt" },
	{ prefix: "composition.completeness", category: "hierarchy", owner: "prompt" },
	{ prefix: "composition.design-refs", category: "hierarchy", owner: "prompt" },
	{ prefix: "layout-pattern", category: "layout", owner: "pattern" },
	{ prefix: "reference", category: "reference", owner: "prompt" },
	{ prefix: "node-type", category: "vocabulary", owner: "catalog" },
	{ prefix: "tokens", category: "layout", owner: "pattern" },
	{ prefix: "schema", category: "schema", owner: "prompt" },
];

const OWNER_BY_CATEGORY: Record<QualityIssueCategory, QualityIssueOwner> = {
	schema: "prompt",
	reference: "prompt",
	vocabulary: "catalog",
	renderability: "renderer",
	layout: "pattern",
	component: "component",
	hierarchy: "prompt",
	sourceTrace: "source",
};

export interface CreateQualityReportInput {
	issues: ValidationIssue[];
	generatedAt: string;
	sourceId?: string;
	nextActions?: string[];
}

export function createQualityReport(input: CreateQualityReportInput): QualityReport {
	const qualityIssues = input.issues.map(toQualityIssue);
	const summary = summarizeQualityIssues(qualityIssues);

	return {
		schemaVersion: "quality-report.v1",
		ok: summary.errorCount === 0,
		generatedAt: input.generatedAt,
		sourceId: input.sourceId,
		summary,
		issues: qualityIssues,
		nextActions: input.nextActions ?? buildNextActions(qualityIssues),
	};
}

function toQualityIssue(issue: ValidationIssue, index: number): QualityIssue {
	const mapped = CATEGORY_BY_CODE_PREFIX.find((entry) => issue.code.startsWith(entry.prefix));
	const category = mapped?.category ?? CATEGORY_BY_LAYER[issue.layer];
	const owner = mapped?.owner ?? OWNER_BY_CATEGORY[category] ?? "unknown";

	return {
		id: `quality-${String(index + 1).padStart(3, "0")}`,
		category,
		severity: issue.severity,
		message: issue.message,
		path: issue.path,
		nodeId: issue.nodeId,
		owner,
		originalCodes: [issue.code],
		validationIssues: [issue],
	};
}

function summarizeQualityIssues(issues: QualityIssue[]): QualityReport["summary"] {
	const summary: QualityReport["summary"] = {
		errorCount: 0,
		warningCount: 0,
		infoCount: 0,
		categories: {},
		owners: {},
	};

	for (const issue of issues) {
		if (issue.severity === "error") summary.errorCount += 1;
		if (issue.severity === "warning") summary.warningCount += 1;
		if (issue.severity === "info") summary.infoCount += 1;
		summary.categories[issue.category] = (summary.categories[issue.category] ?? 0) + 1;
		summary.owners[issue.owner] = (summary.owners[issue.owner] ?? 0) + 1;
	}

	return summary;
}

function buildNextActions(issues: QualityIssue[]): string[] {
	const owners = new Set(issues.map((issue) => issue.owner));
	const actions = [
		["prompt", "Regenerate with the quality report as retry context."],
		["catalog", "Check component or pattern catalog vocabulary gaps."],
		["pattern", "Review layout pattern selection or spacing tokens."],
		["component", "Check component props, aliases, and renderer surface."],
		["renderer", "Run RenderTree projection and renderer smoke tests."],
		["source", "Review source parsing and sourceRef traceability."],
	] as const;

	return actions.filter(([owner]) => owners.has(owner)).map(([, action]) => action);
}
