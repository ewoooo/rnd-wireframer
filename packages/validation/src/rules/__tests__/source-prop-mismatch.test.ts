import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { sourcePropMismatchRule } from "../source-prop-mismatch";

function buildSourceSpec(componentProps: Record<string, unknown>): SourceSpec {
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
										componentType: "TitleMain",
										props: componentProps,
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
	sourcePropMismatchRule.check(ctx);
	return issues;
}

describe("source-prop-mismatch rule", () => {
	it("flags a render node that rewrites a primitive source prop", () => {
		const issues = runRule(buildSourceSpec({ title: "원래 제목" }), {
			children: [
				{
					type: "TitleMain",
					metadata: { id: "title-1" },
					props: { title: "바뀐 제목" },
				},
			],
		});
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["children", 0, "props", "title"]);
	});

	it("accepts preserved source props and ignores non-primitive values", () => {
		const issues = runRule(buildSourceSpec({ title: "원래 제목", meta: { a: 1 } }), {
			children: [
				{
					type: "TitleMain",
					metadata: { id: "title-1" },
					props: { title: "원래 제목", meta: { a: 2 } },
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
