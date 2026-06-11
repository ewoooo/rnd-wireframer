import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { stateCoverageMissingRule } from "../state-coverage-missing";

function buildSourceSpec(componentType: string): SourceSpec {
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
								children: [{ sourceId: "field-1", componentType, props: {} }],
							},
						],
					},
				],
			},
		},
	} as unknown as SourceSpec;
}

function runRule(sourceSpec: SourceSpec, artifact: unknown) {
	const issues: Array<{ message: string }> = [];
	const ctx: RuleContext = {
		tree: artifact as Record<string, unknown>,
		artifact,
		sourceSpec,
		report: (issue) => issues.push(issue),
	};
	stateCoverageMissingRule.check(ctx);
	return issues;
}

describe("state-coverage-missing rule", () => {
	it("flags a stateful surface without any state coverage in the artifact", () => {
		const issues = runRule(buildSourceSpec("SearchInput"), {
			children: [{ type: "TitleMain", props: { title: "제목" } }],
		});
		expect(issues).toHaveLength(1);
	});

	it("accepts artifacts that expose state coverage", () => {
		const issues = runRule(buildSourceSpec("SearchInput"), {
			children: [{ type: "ActionButton", display: { stateRole: "loading" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("matches mixed-case coverage terms like stateRole against the lowercased artifact", () => {
		// 과거 구현은 소문자화된 텍스트에 "stateRole"을 그대로 비교해 절대 매치되지 않았다.
		const issues = runRule(buildSourceSpec("SearchInput"), {
			children: [{ type: "Badge", display: { stateRole: "highlight" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("skips surfaces that imply no statefulness", () => {
		const issues = runRule(buildSourceSpec("TitleMain"), {
			children: [{ type: "TitleMain", props: { title: "제목" } }],
		});
		expect(issues).toHaveLength(0);
	});
});
