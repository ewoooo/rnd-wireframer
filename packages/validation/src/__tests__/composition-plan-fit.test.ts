import { SCHEMA_VERSION } from "@cx/schema";
import { validateSchemaArtifact } from "@cx/validation";
import { describe, expect, it } from "vitest";

const base = {
	schemaVersion: SCHEMA_VERSION.compositionPlan,
	screenLayout: "layout.screen.mobile",
	layoutStrategy: "s",
	sections: [
		{ priority: 1, role: "content", sourceRefs: ["a"], strategy: "s", targetRegion: "contents" },
	],
	visualHierarchy: "v",
	primaryUserAction: "p",
	sectionRhythm: "r",
	density: "medium",
	patternRationale: "pr",
	rejectedPatterns: [],
	currentFitAssessment: { supportsJudgment: false, problems: ["타이틀이 판단을 가린다"] },
	compositionProposal: {
		shouldChangeAreaComposite: true,
		recommendedAreas: ["summary", "options"],
	},
};

describe("composition-plan JSON Schema — currentFit/proposal", () => {
	it("신규 필드 포함 객체는 통과한다", () => {
		expect(validateSchemaArtifact("composition-plan", base).ok).toBe(true);
	});
	it("currentFitAssessment 누락 시 거부한다", () => {
		const { currentFitAssessment, ...rest } = base;
		expect(validateSchemaArtifact("composition-plan", rest).ok).toBe(false);
	});
	it("compositionProposal.recommendedAreas는 문자열 배열이어야 한다", () => {
		expect(
			validateSchemaArtifact("composition-plan", {
				...base,
				compositionProposal: { shouldChangeAreaComposite: true, recommendedAreas: [1] },
			}).ok,
		).toBe(false);
	});
});
