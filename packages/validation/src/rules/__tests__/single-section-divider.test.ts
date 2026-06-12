import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { singleSectionDividerRule } from "../single-section-divider";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	singleSectionDividerRule.check(ctx);
	return issues;
}

describe("single-section-divider rule", () => {
	it("flags a lone contents section with a section divider", () => {
		const issues = runRule({
			type: "Screen",
			children: [
				{
					type: "Screen.Contents",
					children: [{ type: "area.stack", props: { divider: "section" } }],
				},
			],
		});
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["children", 0, "children", 0, "props", "divider"]);
	});

	it("allows section dividers between multiple sections", () => {
		const issues = runRule({
			type: "Screen",
			children: [
				{
					type: "Screen.Contents",
					children: [
						{ type: "area.stack", props: { divider: "section" } },
						{ type: "area.stack", props: {} },
					],
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
