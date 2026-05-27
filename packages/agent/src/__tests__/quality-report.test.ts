import type { ValidationIssue } from "@cx/types";
import { describe, expect, it } from "vitest";
import { createQualityBacklog } from "../validate/quality-backlog";
import { createQualityReport } from "../validate/quality-report";

describe("createQualityReport", () => {
	it("collapses detailed validation codes into MVP quality categories", () => {
		const issues: ValidationIssue[] = [
			{
				code: "composition.visual-hierarchy.missing",
				layer: "contract",
				severity: "warning",
				message: "primary CTA hierarchy is unclear",
			},
			{
				code: "layout-pattern.draft.unknown",
				layer: "contract",
				severity: "error",
				message: "unknown layout pattern",
			},
			{
				code: "reference.missing-area",
				layer: "reference",
				severity: "error",
				message: "missing area",
			},
		];

		const report = createQualityReport({
			issues,
			generatedAt: "2026-05-27T00:00:00.000Z",
			sourceId: "screen-1",
		});

		expect(report.ok).toBe(false);
		expect(report.summary.errorCount).toBe(2);
		expect(report.summary.warningCount).toBe(1);
		expect(report.summary.categories.hierarchy).toBe(1);
		expect(report.summary.categories.layout).toBe(1);
		expect(report.summary.categories.reference).toBe(1);
		expect(report.issues.map((issue) => issue.originalCodes?.[0])).toEqual([
			"composition.visual-hierarchy.missing",
			"layout-pattern.draft.unknown",
			"reference.missing-area",
		]);
		expect(report.nextActions).toContain("Regenerate with the quality report as retry context.");
		expect(report.nextActions).toContain("Review layout pattern selection or spacing tokens.");
	});

	it("extracts repeated catalog, pattern, and component gaps into backlog items", () => {
		const first = createQualityReport({
			issues: [
				{
					code: "layout-pattern.draft.unknown",
					layer: "contract",
					severity: "error",
					message: "unknown layout pattern",
					nodeId: "area-1",
				},
				{
					code: "composition.visual-hierarchy.missing",
					layer: "contract",
					severity: "warning",
					message: "primary CTA hierarchy is unclear",
				},
			],
			generatedAt: "2026-05-27T00:00:00.000Z",
			sourceId: "screen-1",
		});
		const second = createQualityReport({
			issues: [
				{
					code: "layout-pattern.draft.unknown",
					layer: "contract",
					severity: "warning",
					message: "unknown layout pattern",
					nodeId: "area-2",
				},
				{
					code: "composition.primitive.unknown",
					layer: "contract",
					severity: "error",
					message: "unknown component primitive",
				},
			],
			generatedAt: "2026-05-27T00:00:00.000Z",
			sourceId: "screen-2",
		});

		const backlog = createQualityBacklog({
			reports: [first, second],
			generatedAt: "2026-05-27T00:00:00.000Z",
		});

		expect(backlog.summary.readyCount).toBe(1);
		expect(backlog.summary.candidateCount).toBe(1);
		expect(backlog.items[0]).toMatchObject({
			status: "ready",
			owner: "pattern",
			category: "layout",
			occurrences: 2,
			sourceIds: ["screen-1", "screen-2"],
			nodeIds: ["area-1", "area-2"],
		});
		expect(backlog.items.map((item) => item.owner)).toEqual(["pattern", "component"]);
	});
});
