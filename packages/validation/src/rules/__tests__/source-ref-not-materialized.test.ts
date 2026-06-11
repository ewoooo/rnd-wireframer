import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { sourceRefNotMaterializedRule } from "../source-ref-not-materialized";

function buildSourceSpec(): SourceSpec {
	return {
		sourceShape: {
			screen: {
				screenCode: "SCR-001",
				route: "/sample",
				regions: [
					{
						children: [
							{
								sourceAreaId: "999",
								children: [
									{
										sourceId: "cta-submit",
										componentType: "ActionButton",
										props: { label: "제출하기" },
									},
								],
							},
						],
					},
				],
			},
		},
	} as unknown as SourceSpec;
}

function runRule(sourceSpec: SourceSpec, artifact: unknown) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree: artifact as Record<string, unknown>,
		artifact,
		sourceSpec,
		report: (issue) => issues.push(issue),
	};
	sourceRefNotMaterializedRule.check(ctx);
	return issues;
}

describe("source-ref-not-materialized rule", () => {
	it("flags a source ref that is absent from the generated artifact", () => {
		const issues = runRule(buildSourceSpec(), { children: [] });
		expect(issues).toHaveLength(1);
		expect(issues[0]?.message).toContain("cta-submit");
	});

	it("accepts refs materialized by id", () => {
		const issues = runRule(buildSourceSpec(), {
			children: [{ metadata: { id: "cta-submit" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("accepts refs materialized by a visible label (folded into a parent prop)", () => {
		const issues = runRule(buildSourceSpec(), {
			children: [{ type: "TextField", props: { buttonLabel: "제출하기" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("does not flag purely numeric structural refs", () => {
		const issues = runRule(buildSourceSpec(), {
			children: [{ metadata: { id: "cta-submit" } }],
		});
		expect(issues.some((issue) => issue.message.includes("999"))).toBe(false);
	});
});
