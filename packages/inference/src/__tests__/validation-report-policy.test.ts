import { describe, expect, it } from "vitest";
import {
	hasValidationReportErrors,
	readValidationReportErrorCount,
} from "../policies/inference-policy";

describe("validation report policy", () => {
	it("reads validation error counts from report summaries", () => {
		const report = { summary: { errorCount: 2, warningCount: 1 } };

		expect(readValidationReportErrorCount(report)).toBe(2);
		expect(hasValidationReportErrors(report)).toBe(true);
	});

	it("treats malformed reports as zero-error reports", () => {
		expect(readValidationReportErrorCount(undefined)).toBe(0);
		expect(readValidationReportErrorCount({ summary: { errorCount: "2" } })).toBe(0);
		expect(hasValidationReportErrors({ summary: null })).toBe(false);
	});
});
