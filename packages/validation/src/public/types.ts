import type { validationBoundary } from "./contract";
import type { ValidationIssueCode, ValidationSeverity } from "./registry";

export type {
	ValidationCodeMeta,
	ValidationIssueCode,
	ValidationLayer,
	ValidationSeverity,
} from "./registry";

export type ValidationBoundary = typeof validationBoundary;
export type ValidationBoundaryName = ValidationBoundary["name"];
export type ValidationPackageName = ValidationBoundary["packageName"];

export type ValidationOperation = ValidationBoundary["owns"][number];

export type ValidationTarget =
	| "agent-result"
	| "component-proposal"
	| "composition-plan"
	| "component-usage"
	| "layout-props"
	| "output-contract"
	| "render-tree"
	| "schema-artifact"
	| "table-generation-result";

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
