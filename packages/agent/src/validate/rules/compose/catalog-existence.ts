import type { CompositionOutput } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import { getValidatorContext, primitiveHasVariant } from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";
import type { ValidatorDeps } from "../../types";

/**
 * Rule: reuse-primitive / reuse-pattern decision의 ref가 catalog에 존재하고,
 * 지정 variant가 카드 variants 목록 안에 있는지 검사한다. (SPEC §7.1 primitive 존재 / primitive variant / componentPattern 존재)
 */
export function checkCatalogExistence(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const index = getValidatorContext(deps).catalog;

	output.decisions.forEach((decision, i) => {
		const sel = decision.selection;
		if (sel.mode === "reuse-primitive") {
			const card = index.primitives.get(sel.primitiveId);
			if (!card) {
				issues.push(
					makeIssue(
						"composition.primitive.unknown",
						"reference",
						`primitive "${sel.primitiveId}" 가 catalog에 없음`,
						{
							path: ["decisions", i, "selection", "primitiveId"],
							nodeId: decision.id,
							data: { decisionId: decision.id, primitiveId: sel.primitiveId },
						},
					),
				);
				return;
			}
			if (!primitiveHasVariant(card, sel.variant)) {
				issues.push(
					makeIssue(
						"composition.primitive.variant.unknown",
						"reference",
						`primitive "${sel.primitiveId}" 에 variant "${sel.variant}" 가 없음`,
						{
							path: ["decisions", i, "selection", "variant"],
							nodeId: decision.id,
							data: { decisionId: decision.id, primitiveId: sel.primitiveId, variant: sel.variant },
						},
					),
				);
			}
		} else if (sel.mode === "reuse-pattern") {
			if (!index.componentPatterns.has(sel.componentPatternId)) {
				issues.push(
					makeIssue(
						"composition.component-pattern.unknown",
						"reference",
						`componentPattern "${sel.componentPatternId}" 가 catalog에 없음 (registered/proposed 둘 다)`,
						{
							path: ["decisions", i, "selection", "componentPatternId"],
							nodeId: decision.id,
							data: { decisionId: decision.id, componentPatternId: sel.componentPatternId },
						},
					),
				);
			}
		}
	});

	return issues;
}
