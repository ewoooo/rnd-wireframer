import type { SCHEMA_VERSION } from "./versions";

export type SchemaValidationIssue = {
	code: string;
	message: string;
	path?: Array<string | number>;
	severity: "error" | "warning";
};

export type ValidationReportContract = {
	issues: SchemaValidationIssue[];
	ok: boolean;
	schemaVersion: typeof SCHEMA_VERSION.validationReport;
	summary: {
		errorCount: number;
		warningCount: number;
	};
	target: string;
};
