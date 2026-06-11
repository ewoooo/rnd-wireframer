import { describe, expect, it } from "vitest";
import { actionButtonDefaultTypeMissingRule } from "../action-button-default-type-missing";
import type { RuleContext } from "../define-rule";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	actionButtonDefaultTypeMissingRule.check(ctx);
	return issues;
}

function treeWithActionButton(props: Record<string, unknown>, type = "kiki.ActionButton") {
	return {
		type: "Screen",
		children: [{ type: "Screen.Bottom", children: [{ type, props }] }],
	};
}

describe("action-button-default-type-missing rule", () => {
	it("flags TwoButton text props without explicit Default type", () => {
		const issues = runRule(
			treeWithActionButton({
				button: "2",
				primaryText: "홈으로",
				secondaryText: "내 정보로",
			}),
		);

		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["children", 0, "children", 0, "props", "type"]);
	});

	it("accepts explicit Default TwoButton props", () => {
		const issues = runRule(
			treeWithActionButton({
				button: "2",
				primaryText: "홈으로",
				secondaryText: "내 정보로",
				type: "Default",
			}),
		);

		expect(issues).toHaveLength(0);
	});

	it("accepts Ai TwoButton props when they use Ai text slots", () => {
		const issues = runRule(
			treeWithActionButton({
				button: "2",
				leftText: "추천",
				rightText: "적용",
				type: "Ai",
			}),
		);

		expect(issues).toHaveLength(0);
	});

	it("also canonicalizes bare ActionButton node types", () => {
		const issues = runRule(
			treeWithActionButton(
				{
					button: "2",
					primaryText: "홈으로",
					secondaryText: "내 정보로",
				},
				"ActionButton",
			),
		);

		expect(issues).toHaveLength(1);
	});
});
