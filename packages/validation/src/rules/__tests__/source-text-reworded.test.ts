import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { sourceTextRewordedRule } from "../source-text-reworded";

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
	sourceTextRewordedRule.check(ctx);
	return issues;
}

describe("source-text-reworded rule", () => {
	it("flags string copy rewording as its own (warning) code", () => {
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

	it("ignores non-string mismatches and preserved copy", () => {
		const issues = runRule(buildSourceSpec({ title: "원래 제목", showLogo: true }), {
			children: [
				{
					type: "TitleMain",
					metadata: { id: "title-1" },
					props: { title: "원래 제목", showLogo: false },
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
