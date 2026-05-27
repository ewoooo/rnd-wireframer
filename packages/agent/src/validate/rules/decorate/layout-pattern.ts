import type { DecoratedOutput, LayoutPatternVerification } from "@cx/types/decorated-output";
import type { ValidationIssue } from "@cx/types/validation";
import type { ValidatorDeps } from "../../types";
import {
	getValidatorContext,
	layoutPatternHasVariant,
	suggestLayoutPatterns,
} from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";

/**
 * Rule: layoutPattern 존재 / variant / 노드 종류 호환성 (SPEC §7.2)
 */
export function checkLayoutPatternFinal(
	decorated: DecoratedOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const index = getValidatorContext(deps).layoutPatterns;

	function check(
		verification: LayoutPatternVerification,
		nodeKind: "screen" | "area" | "group",
		extras: { path: ReadonlyArray<string | number>; nodeId: string },
	): void {
		const { layoutPatternId, variant } = verification.finalLayoutPattern;
		const card = index.patterns.get(layoutPatternId);
		if (!card) {
			issues.push(
				makeIssue(
					"layout-pattern.draft.unknown",
					"reference",
					`${nodeKind} "${extras.nodeId}" 의 finalLayoutPattern.layoutPatternId "${layoutPatternId}" 가 layoutPatternStore에 없음`,
					{
						path: [...extras.path, "finalLayoutPattern", "layoutPatternId"],
						nodeId: extras.nodeId,
						data: {
							nodeKind,
							layoutPatternId,
							suggestions: suggestLayoutPatterns(index, {
								nodeKind,
								requestedId: layoutPatternId,
							}),
						},
					},
				),
			);
			return;
		}
		if (!layoutPatternHasVariant(card, variant)) {
			issues.push(
				makeIssue(
					"layout-pattern.variant.unknown",
					"reference",
					`layoutPattern "${layoutPatternId}" 에 variant "${variant}" 가 없음`,
					{
						path: [...extras.path, "finalLayoutPattern", "variant"],
						nodeId: extras.nodeId,
						data: { nodeKind, layoutPatternId, variant },
					},
				),
			);
		}
		if (!card.appliesTo.includes(nodeKind)) {
			issues.push(
				makeIssue(
					"layout-pattern.node-kind.incompatible",
					"contract",
					`layoutPattern "${layoutPatternId}" 은(는) ${nodeKind} 노드에 적용 불가 (적용 가능: ${card.appliesTo.join(", ")})`,
					{
						path: [...extras.path, "finalLayoutPattern", "layoutPatternId"],
						nodeId: extras.nodeId,
						data: {
							nodeKind,
							layoutPatternId,
							appliesTo: card.appliesTo,
							suggestions: suggestLayoutPatterns(index, {
								nodeKind,
								requestedId: layoutPatternId,
								selectedPattern: card,
							}),
						},
					},
				),
			);
		}
	}

	check(decorated.screen, "screen", {
		path: ["screen"],
		nodeId: decorated.source.composedScreenId,
	});
	for (const [areaId, verification] of Object.entries(decorated.areas)) {
		check(verification, "area", {
			path: ["areas", areaId],
			nodeId: areaId,
		});
	}
	for (const [decisionId, verification] of Object.entries(decorated.decisions)) {
		check(verification, "group", {
			path: ["decisions", decisionId],
			nodeId: decisionId,
		});
	}

	return issues;
}
