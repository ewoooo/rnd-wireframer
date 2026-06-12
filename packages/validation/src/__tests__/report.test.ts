import { describe, expect, it } from "vitest";
import { errorsOf, warningsOf } from "../public/report";
import type { ValidationReport } from "../public/types";

function makeReport(): ValidationReport {
	return {
		issues: [
			{ code: "schema-invalid", message: "boom", severity: "error" },
			{ code: "state-coverage-missing", message: "missing state", severity: "warning" },
			{ code: "duplicate-id", message: "dup", severity: "error" },
		],
		ok: false,
		summary: { errorCount: 2, warningCount: 1 },
		target: "render-tree",
	};
}

describe("errorsOf / warningsOf", () => {
	it("returns only error-severity issues", () => {
		const errors = errorsOf(makeReport());
		expect(errors).toHaveLength(2);
		expect(errors.every((issue) => issue.severity === "error")).toBe(true);
	});

	it("returns only warning-severity issues", () => {
		const warnings = warningsOf(makeReport());
		expect(warnings).toHaveLength(1);
		expect(warnings[0]?.code).toBe("state-coverage-missing");
	});

	it("partitions issues exhaustively across error and warning", () => {
		const report = makeReport();
		expect(errorsOf(report).length + warningsOf(report).length).toBe(report.issues.length);
	});
});
