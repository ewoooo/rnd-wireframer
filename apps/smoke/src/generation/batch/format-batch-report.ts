import type { BatchResult } from "./run-batch";

/** Render a batch result as a human-readable multi-line report. */
export function formatBatchReport(result: BatchResult): string {
	const lines: string[] = [];
	lines.push(`Batch ${result.batchId}: ${result.results.length} screen(s)`);

	for (const entry of result.results) {
		if (entry.error) {
			lines.push(`  FAIL ${entry.screen}  (${entry.error})`);
			continue;
		}
		const status = entry.ok ? "ok  " : "FAIL";
		lines.push(
			`  ${status} ${entry.screen}  ${entry.errorCount} err  ${entry.warningCount} warn`,
		);
	}

	lines.push(`Summary: ${result.okCount} ok, ${result.failCount} fail`);
	return lines.join("\n");
}
