import { describe, expect, it } from "vitest";
import { actionButtonLabelMissingRule } from "../action-button-label-missing";
import type { RuleContext } from "../define-rule";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	actionButtonLabelMissingRule.check(ctx);
	return issues;
}

function treeWithActionButton(props: Record<string, unknown>) {
	return {
		type: "Screen",
		children: [{ type: "Screen.Bottom", children: [{ type: "kiki.ActionButton", props }] }],
	};
}

describe("action-button-label-missing rule", () => {
	it("flags a single CTA without primaryText — tooltip text/left are not the label", () => {
		const issues = runRule(treeWithActionButton({ button: "1", text: "다음", left: 0 }));

		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["children", 0, "children", 0, "props"]);
	});

	it("flags the implicit button='2' default without both labels (the '버튼 | 버튼' case)", () => {
		const issues = runRule(treeWithActionButton({ text: "다음", left: 0, type: "Default" }));

		expect(issues).toHaveLength(1);
	});

	it("accepts button='1' with primaryText", () => {
		const issues = runRule(treeWithActionButton({ button: "1", primaryText: "다음" }));

		expect(issues).toHaveLength(0);
	});

	it("accepts button='2' with both labels", () => {
		const issues = runRule(
			treeWithActionButton({
				button: "2",
				secondaryText: "내 정보로",
				primaryText: "홈으로",
				type: "Default",
			}),
		);

		expect(issues).toHaveLength(0);
	});

	it("ignores non-Default variants — Ai/Gift use different label props", () => {
		const issues = runRule(treeWithActionButton({ type: "Ai", button: "1", buttonText: "적용" }));

		expect(issues).toHaveLength(0);
	});
});
