import type { CompositionOutput, LayoutPatternDraft } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import type { ValidatorDeps } from "../../types";
import {
	getValidatorContext,
	layoutPatternHasVariant,
	suggestLayoutPatterns,
} from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";

/**
 * Rule: layoutPattern draft (SPEC §7.1 layoutPattern draft 필수 / 정합성)
 * - screen / 모든 area에 layoutPatternDraft 존재
 * - draft.layoutPatternId 가 store에 존재, variant 일치, node kind 호환
 * - decision-level draft도 있으면 동일 검사 (선택적)
 */
export function checkLayoutDraft(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const index = getValidatorContext(deps).layoutPatterns;

	function verifyDraft(
		draft: LayoutPatternDraft | undefined,
		nodeKind: "screen" | "area" | "group",
		extras: { path: ReadonlyArray<string | number>; nodeId: string; required: boolean },
	): void {
		if (!draft) {
			if (extras.required) {
				issues.push(
					makeIssue(
						"layout-pattern.draft.missing",
						"contract",
						`${nodeKind} "${extras.nodeId}" 에 layoutPatternDraft 누락`,
						{ path: extras.path, nodeId: extras.nodeId, data: { nodeKind } },
					),
				);
			}
			return;
		}
		const card = index.patterns.get(draft.layoutPatternId);
		if (!card) {
			issues.push(
				makeIssue(
					"layout-pattern.draft.unknown",
					"reference",
					`${nodeKind} "${extras.nodeId}" 의 layoutPatternId "${draft.layoutPatternId}" 가 layoutPatternStore에 없음`,
					{
						path: [...extras.path, "layoutPatternId"],
						nodeId: extras.nodeId,
						data: {
							nodeKind,
							layoutPatternId: draft.layoutPatternId,
							suggestions: suggestLayoutPatterns(index, {
								nodeKind,
								requestedId: draft.layoutPatternId,
							}),
						},
					},
				),
			);
			return;
		}
		if (!layoutPatternHasVariant(card, draft.variant)) {
			issues.push(
				makeIssue(
					"layout-pattern.variant.unknown",
					"reference",
					`layoutPattern "${draft.layoutPatternId}" 에 variant "${draft.variant}" 가 없음`,
					{
						path: [...extras.path, "variant"],
						nodeId: extras.nodeId,
						data: { nodeKind, layoutPatternId: draft.layoutPatternId, variant: draft.variant },
					},
				),
			);
		}
		if (!card.appliesTo.includes(nodeKind)) {
			issues.push(
				makeIssue(
					"layout-pattern.node-kind.incompatible",
					"contract",
					`layoutPattern "${draft.layoutPatternId}" 은(는) ${nodeKind} 노드에 적용 불가 (적용 가능: ${card.appliesTo.join(", ")})`,
					{
						path: [...extras.path, "layoutPatternId"],
						nodeId: extras.nodeId,
						data: {
							nodeKind,
							layoutPatternId: draft.layoutPatternId,
							appliesTo: card.appliesTo,
							suggestions: suggestLayoutPatterns(index, {
								nodeKind,
								requestedId: draft.layoutPatternId,
								selectedPattern: card,
							}),
						},
					},
				),
			);
		}
	}

	verifyDraft(output.screen.layoutPatternDraft, "screen", {
		path: ["screen", "layoutPatternDraft"],
		nodeId: output.screen.screenId,
		required: true,
	});

	output.areas.forEach((area, i) => {
		verifyDraft(area.layoutPatternDraft, "area", {
			path: ["areas", i, "layoutPatternDraft"],
			nodeId: area.areaId,
			required: true,
		});
	});

	output.decisions.forEach((decision, i) => {
		verifyDraft(decision.layoutPatternDraft, "group", {
			path: ["decisions", i, "layoutPatternDraft"],
			nodeId: decision.id,
			required: false,
		});
	});

	return issues;
}
