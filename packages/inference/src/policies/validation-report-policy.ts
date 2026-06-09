export const VALIDATION_REPORT_FAILURE_CODE = "deterministic_validation_failed";

export function hasValidationReportErrors(input: unknown): boolean {
	return readValidationReportErrorCount(input) > 0;
}

export function readValidationReportErrorCount(input: unknown): number {
	const summary = readRecord(input)?.summary;
	const errorCount = readRecord(summary)?.errorCount;
	return typeof errorCount === "number" ? errorCount : 0;
}

function readRecord(input: unknown): Record<string, unknown> | undefined {
	if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
	return input as Record<string, unknown>;
}
