import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { proposalSourceEvidenceMissingRule } from "../proposal-source-evidence-missing";

function runRule(tree: Record<string, unknown>, allowedRefs?: string[]) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		proposalOptions: { allowedRefs },
		report: (issue) => issues.push(issue),
	};
	proposalSourceEvidenceMissingRule.check(ctx);
	return issues;
}

describe("proposal-source-evidence-missing rule", () => {
	it("flags source evidence that is not in allowedRefs", () => {
		const issues = runRule({ proposals: [{ sourceEvidence: ["known-ref", "ghost-ref"] }] }, [
			"known-ref",
		]);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.message).toContain("ghost-ref");
		expect(issues[0]?.path).toEqual(["proposals", 0, "sourceEvidence", 1]);
	});

	it("skips entirely when allowedRefs is not provided", () => {
		const issues = runRule({ proposals: [{ sourceEvidence: ["anything"] }] });
		expect(issues).toHaveLength(0);
	});

	it("accepts evidence contained in allowedRefs", () => {
		const issues = runRule({ proposals: [{ sourceEvidence: ["known-ref"] }] }, ["known-ref"]);
		expect(issues).toHaveLength(0);
	});
});
