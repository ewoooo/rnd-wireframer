import { describe, expect, it } from "vitest";
import { formatBatchReport } from "./format-batch-report";
import type { BatchResult } from "./run-batch";

function entry(overrides: Partial<BatchResult["results"][number]>) {
	return {
		errorCount: 0,
		ok: true,
		runDir: "/runs/x",
		runId: "b-x",
		screen: "X",
		validationOk: true,
		warningCount: 0,
		...overrides,
	};
}

describe("formatBatchReport", () => {
	it("lists ok and failed screens with the summary line", () => {
		const result: BatchResult = {
			batchId: "demo",
			failCount: 1,
			okCount: 1,
			results: [
				entry({ screen: "A", warningCount: 2 }),
				entry({ screen: "B", ok: false, error: "parse error" }),
			],
		};

		const report = formatBatchReport(result);
		expect(report).toContain("Batch demo: 2 screen(s)");
		expect(report).toContain("ok   A  0 err  2 warn");
		expect(report).toContain("FAIL B  (parse error)");
		expect(report).toContain("Summary: 1 ok, 1 fail");
	});
});
