import type { SourceSpec } from "@cx/schema";
import { defineRule } from "./define-rule";
import { STATE_COVERAGE_TERMS, STATEFUL_SURFACE_TERMS } from "./source-spec";

export const stateCoverageMissingRule = defineRule({
	code: "state-coverage-missing",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		if (!ctx.sourceSpec || !needsStateCoverage(ctx.sourceSpec)) return;
		const generatedText = JSON.stringify(ctx.artifact).toLowerCase();
		// 비교 대상 텍스트가 소문자화되므로 term도 소문자화해야 "stateRole" 같은
		// 혼합 표기 term이 매치된다 (레거시 구현의 잠복 버그 수정).
		const hasStateRole = STATE_COVERAGE_TERMS.some((term) =>
			generatedText.includes(term.toLowerCase()),
		);
		if (hasStateRole) return;

		ctx.report({
			message:
				"SourceSpec implies a stateful surface, but generated artifact does not expose loading, empty, error, disabled, or validation state coverage.",
			path: [],
		});
	},
});

function needsStateCoverage(sourceSpec: SourceSpec): boolean {
	const sourceText = JSON.stringify(sourceSpec).toLowerCase();
	return STATEFUL_SURFACE_TERMS.some((term) => sourceText.includes(term));
}
