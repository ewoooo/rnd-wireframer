import type { validationBoundary } from "./contract";

export type ValidationBoundary = typeof validationBoundary;
export type ValidationBoundaryName = ValidationBoundary["name"];
export type ValidationPackageName = ValidationBoundary["packageName"];

export type ValidationOperation = ValidationBoundary["owns"][number];

export type ValidationTarget =
	| "agent-result"
	| "component-usage"
	| "layout-props"
	| "render-tree"
	| "schema-artifact"
	| "table-generation-result";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssueCode =
	| "json-invalid"
	| "schema-invalid"
	| "required-field-missing"
	| "duplicate-id"
	| "unknown-component-type"
	| "unknown-prop"
	| "invalid-prop-type"
	| "invalid-enum-value"
	| "readonly-prop-written"
	| "invalid-render-node"
	| "invalid-layout-prop"
	| "unknown-pattern-ref";

export type ValidationIssue = {
	code: ValidationIssueCode;
	message: string;
	path?: Array<string | number>;
	severity: ValidationSeverity;
};

export type ValidationReport = {
	issues: ValidationIssue[];
	ok: boolean;
	summary: {
		errorCount: number;
		warningCount: number;
	};
	target: ValidationTarget;
};
