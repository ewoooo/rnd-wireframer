import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { unknownSourceRefRule } from "../unknown-source-ref";

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
								sourceAreaId: "area-1",
								children: [
									{
										sourceId: "title-1",
										roleAlias: "page-title",
										componentType: "TitleMain",
										props: {},
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

function runRule(sourceSpec: SourceSpec, plan: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree: plan,
		artifact: undefined,
		sourceSpec,
		report: (issue) => issues.push(issue),
	};
	unknownSourceRefRule.check(ctx);
	return issues;
}

describe("unknown-source-ref rule", () => {
	it("flags composition plan source refs that do not exist in the SourceSpec", () => {
		const issues = runRule(buildSourceSpec(), {
			sections: [{ sourceRefs: ["title-1", "ghost-ref"] }],
		});
		expect(issues).toHaveLength(1);
		expect(issues[0]?.message).toContain("ghost-ref");
		expect(issues[0]?.path).toEqual(["sections", 0, "sourceRefs", 1]);
	});

	it("accepts refs by sourceId, roleAlias, componentType, area id, screenCode, and route", () => {
		const issues = runRule(buildSourceSpec(), {
			sections: [
				{ sourceRefs: ["title-1", "page-title", "TitleMain", "area-1", "SCR-001", "/sample"] },
			],
		});
		expect(issues).toHaveLength(0);
	});

	it("ignores sections without sourceRefs and empty refs", () => {
		const issues = runRule(buildSourceSpec(), {
			sections: [{ title: "no refs" }, { sourceRefs: ["", 42] }],
		});
		expect(issues).toHaveLength(0);
	});
});
