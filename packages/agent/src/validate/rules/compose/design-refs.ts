import type { CompositionOutput, ValidationIssue } from "@cx/types";

import { indexDesignDeck } from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";
import type { ValidatorDeps } from "../../types";

/**
 * Rule: designRefs (SPEC §7.1 design reference)
 * - screen.designRefs / area.designRefs 는 필수 (비어있지 않음)
 * - decision.designRefs 는 optional — 검사하지 않음
 * - 모든 designRef.document 는 designDeck에 등록된 문서여야 함
 */
export function checkDesignRefs(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const index = indexDesignDeck(deps.designDeck);

	function verifyRefs(
		refs: { document: string; section?: string; reason: string }[] | undefined,
		extras: { path: ReadonlyArray<string | number>; nodeId: string; required: boolean },
	): void {
		if (!refs || refs.length === 0) {
			if (extras.required) {
				issues.push(
					makeIssue(
						"composition.design-refs.missing",
						"reference",
						`"${extras.nodeId}" 에 designRefs[] 누락`,
						{ path: extras.path, nodeId: extras.nodeId },
					),
				);
			}
			return;
		}
		refs.forEach((ref, j) => {
			if (!index.documents.has(ref.document as never)) {
				issues.push(
					makeIssue(
						"composition.design-refs.missing",
						"reference",
						`designRef.document "${ref.document}" 가 designDeck에 등록되지 않음`,
						{
							path: [...extras.path, j, "document"],
							nodeId: extras.nodeId,
							data: { document: ref.document },
						},
					),
				);
			}
		});
	}

	verifyRefs(output.screen.designRefs, {
		path: ["screen", "designRefs"],
		nodeId: output.screen.screenId,
		required: true,
	});

	output.areas.forEach((area, i) => {
		verifyRefs(area.designRefs, {
			path: ["areas", i, "designRefs"],
			nodeId: area.areaId,
			required: true,
		});
	});

	// decision-level designRefs 는 검사하지 않음 (optional)

	return issues;
}
