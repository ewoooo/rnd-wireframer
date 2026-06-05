import type { DecoratedOutput, LayoutPatternVerification } from "@cx/types/decorated-output";
import type { ValidationIssue } from "@cx/types/validation";
import { makeIssue } from "../shared/issue";

/**
 * Rule: reasons 필수 (SPEC §7.2)
 * 모든 verification에 reasons[]가 비어있지 않음.
 */
export function checkReasonsPresent(decorated: DecoratedOutput): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	function check(
		verification: LayoutPatternVerification,
		extras: { path: ReadonlyArray<string | number>; nodeId: string; nodeKind: string },
	): void {
		if (!verification.reasons || verification.reasons.length === 0) {
			issues.push(
				makeIssue(
					"layout-pattern.verification.reasons-missing",
					"contract",
					`${extras.nodeKind} "${extras.nodeId}" verification에 reasons[] 누락`,
					{ path: [...extras.path, "reasons"], nodeId: extras.nodeId, data: { nodeKind: extras.nodeKind } },
				),
			);
		}
	}

	check(decorated.screen, {
		path: ["screen"],
		nodeId: decorated.source.composedScreenId,
		nodeKind: "screen",
	});
	for (const [areaId, verification] of Object.entries(decorated.areas)) {
		check(verification, { path: ["areas", areaId], nodeId: areaId, nodeKind: "area" });
	}
	for (const [decisionId, verification] of Object.entries(decorated.decisions)) {
		check(verification, { path: ["decisions", decisionId], nodeId: decisionId, nodeKind: "group" });
	}

	return issues;
}
