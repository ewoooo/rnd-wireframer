import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { proposalLimitExceededRule } from "../proposal-limit-exceeded";

function runRule(tree: Record<string, unknown>, maxProposals?: number) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		proposalOptions: maxProposals === undefined ? {} : { maxProposals },
		report: (issue) => issues.push(issue),
	};
	proposalLimitExceededRule.check(ctx);
	return issues;
}

function proposals(count: number) {
	return { proposals: Array.from({ length: count }, (_, index) => ({ name: `p-${index}` })) };
}

describe("proposal-limit-exceeded rule", () => {
	it("flags more proposals than the configured limit", () => {
		const issues = runRule(proposals(3), 2);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["proposals"]);
	});

	it("uses the default limit of 5 when none is configured", () => {
		expect(runRule(proposals(5))).toHaveLength(0);
		expect(runRule(proposals(6))).toHaveLength(1);
	});

	it("accepts a bounded proposal list", () => {
		expect(runRule(proposals(2), 2)).toHaveLength(0);
	});
});
