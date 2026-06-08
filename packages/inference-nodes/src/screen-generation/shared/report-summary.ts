import { isRecord } from "@cx/schema";

export type ReportSummary = { errorCount: number; warningCount: number };

/**
 * Reads { errorCount, warningCount } from a report-shaped value's `summary`.
 * Returns undefined when the value is not a report with a numeric summary, so callers
 * that need a defaulted count coalesce themselves. Shared by next-action and
 * design-context, which both inspect validation/quality reports passed in as unknown.
 */
export function readReportSummary(input: unknown): ReportSummary | undefined {
	if (!isRecord(input) || !isRecord(input.summary)) return undefined;
	const { errorCount, warningCount } = input.summary;
	if (typeof errorCount !== "number" || typeof warningCount !== "number") return undefined;
	return { errorCount, warningCount };
}
