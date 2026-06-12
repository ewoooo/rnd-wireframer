import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { proposalNearestMatchUnknownRule } from "../proposal-nearest-match-unknown";

function runRule(tree: Record<string, unknown>, catalogComponentTypes?: string[]) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		proposalOptions: { catalogComponentTypes },
		report: (issue) => issues.push(issue),
	};
	proposalNearestMatchUnknownRule.check(ctx);
	return issues;
}

describe("proposal-nearest-match-unknown rule", () => {
	it("flags a nearestCatalogMatch outside the catalog component types", () => {
		const issues = runRule({ proposals: [{ nearestCatalogMatch: "GhostComponent" }] }, [
			"ActionButton",
		]);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["proposals", 0, "nearestCatalogMatch"]);
	});

	it("skips entirely when catalogComponentTypes is not provided", () => {
		const issues = runRule({ proposals: [{ nearestCatalogMatch: "GhostComponent" }] });
		expect(issues).toHaveLength(0);
	});

	it("accepts known catalog matches and non-string values", () => {
		const issues = runRule(
			{ proposals: [{ nearestCatalogMatch: "ActionButton" }, { nearestCatalogMatch: 1 }] },
			["ActionButton"],
		);
		expect(issues).toHaveLength(0);
	});
});
