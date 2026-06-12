import { describe, expect, it } from "vitest";
import { bottomCtaStateUngatedRule } from "../bottom-cta-state-ungated";
import type { RuleContext } from "../define-rule";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	bottomCtaStateUngatedRule.check(ctx);
	return issues;
}

function bottomWith(buttons: Array<Record<string, unknown>>) {
	return {
		type: "Screen",
		children: [{ type: "Screen.Bottom", children: buttons }],
	};
}

describe("bottom-cta-state-ungated rule", () => {
	it("flags a state-variant bottom CTA without display.when", () => {
		const issues = runRule(
			bottomWith([{ type: "ActionButton", display: { stateRole: "loading" } }]),
		);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["children", 0, "children", 0, "display", "when"]);
	});

	it("accepts a state-variant bottom CTA gated by display.when", () => {
		const issues = runRule(
			bottomWith([
				{
					type: "ActionButton",
					display: { stateRole: "loading", when: { bind: "$.state.loading" } },
				},
			]),
		);
		expect(issues).toHaveLength(0);
	});

	it("ignores base-state and stateless CTAs", () => {
		const issues = runRule(
			bottomWith([
				{ type: "ActionButton", display: { stateRole: "base" } },
				{ type: "ActionButton" },
			]),
		);
		expect(issues).toHaveLength(0);
	});

	it("ignores ActionButtons outside Screen.Bottom", () => {
		const issues = runRule({
			type: "Screen",
			children: [
				{
					type: "Screen.Contents",
					children: [{ type: "ActionButton", display: { stateRole: "error" } }],
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
