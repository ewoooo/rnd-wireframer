import { validationBoundary } from "@cx/validation";
import type { ValidationOperation, ValidationReport } from "@cx/validation/types";
import { describe, expect, it } from "vitest";

describe("@cx/validation public API", () => {
	it("exposes the pure validation package boundary", () => {
		expect(validationBoundary.packageName).toBe("@cx/validation");
		expect(validationBoundary.owns).toContain("validation-report-build");
		expect(validationBoundary.rejects).toContain("file-system-write");
		expect(validationBoundary.rejects).toContain("workflow-state-transition");
	});

	it("types validation reports against public issue contracts", () => {
		const operation: ValidationOperation = "dto-contract-check";
		const report: ValidationReport = {
			issues: [],
			ok: true,
			summary: {
				errorCount: 0,
				warningCount: 0,
			},
			target: "agent-result",
		};

		expect(operation).toBe("dto-contract-check");
		expect(report.ok).toBe(true);
	});
});
