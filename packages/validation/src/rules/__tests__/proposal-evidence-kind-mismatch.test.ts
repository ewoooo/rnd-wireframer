import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { proposalEvidenceKindMismatchRule } from "../proposal-evidence-kind-mismatch";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	proposalEvidenceKindMismatchRule.check(ctx);
	return issues;
}

describe("proposal-evidence-kind-mismatch rule", () => {
	it("flags a ux-improvement proposal without referenceEvidence", () => {
		const issues = runRule({
			proposals: [{ kind: "ux-improvement", sourceEvidence: ["X"], referenceEvidence: [] }],
		});
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["proposals", 0, "referenceEvidence"]);
	});

	it("flags a source-gap proposal without sourceEvidence", () => {
		const issues = runRule({ proposals: [{ kind: "source-gap", sourceEvidence: [] }] });
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["proposals", 0, "sourceEvidence"]);
	});

	it("accepts a ux-improvement proposal backed by referenceEvidence", () => {
		const issues = runRule({
			proposals: [{ kind: "ux-improvement", referenceEvidence: ["screen-age-verification"] }],
		});
		expect(issues).toHaveLength(0);
	});

	it("accepts a source-gap proposal backed by sourceEvidence", () => {
		const issues = runRule({ proposals: [{ kind: "source-gap", sourceEvidence: ["FieldX"] }] });
		expect(issues).toHaveLength(0);
	});
});
