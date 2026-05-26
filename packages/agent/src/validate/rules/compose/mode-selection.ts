import type { CompositionOutput, ValidationIssue } from "@cx/types";

import { makeIssue } from "../shared/issue";

/**
 * Rule: CompositionDecision.mode 와 selection.mode 가 일치하고,
 * propose/gap 모드는 각 컬렉션에 대응 항목을 가져야 한다. (SPEC §7.1 mode union 정합성 / proposed 참조 / gap 참조)
 */
export function checkModeSelection(output: CompositionOutput): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	const proposedIds = new Set(output.proposedComponentPatterns.map((p) => p.id));
	const gapIds = new Set(output.gapReports.map((g) => g.id));

	output.decisions.forEach((decision, index) => {
		if (decision.mode !== decision.selection.mode) {
			issues.push(
				makeIssue(
					"composition.mode.mismatch",
					"contract",
					`decision.mode "${decision.mode}" 가 selection.mode "${decision.selection.mode}" 와 불일치`,
					{
						path: ["decisions", index],
						nodeId: decision.id,
						data: { decisionId: decision.id, decisionMode: decision.mode, selectionMode: decision.selection.mode },
					},
				),
			);
			return;
		}

		if (decision.selection.mode === "propose-pattern") {
			const ref = decision.selection.proposedComponentPatternId;
			if (!proposedIds.has(ref)) {
				issues.push(
					makeIssue(
						"composition.proposed.reference-missing",
						"reference",
						`propose-pattern decision이 가리킨 proposedComponentPatternId "${ref}" 가 proposedComponentPatterns에 없음`,
						{
							path: ["decisions", index, "selection", "proposedComponentPatternId"],
							nodeId: decision.id,
							data: { decisionId: decision.id, missingId: ref },
						},
					),
				);
			}
		}

		if (decision.selection.mode === "report-gap") {
			const ref = decision.selection.gapReportId;
			if (!gapIds.has(ref)) {
				issues.push(
					makeIssue(
						"composition.gap.reference-missing",
						"reference",
						`report-gap decision이 가리킨 gapReportId "${ref}" 가 gapReports에 없음`,
						{
							path: ["decisions", index, "selection", "gapReportId"],
							nodeId: decision.id,
							data: { decisionId: decision.id, missingId: ref },
						},
					),
				);
			}
		}
	});

	return issues;
}
