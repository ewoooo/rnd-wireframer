import type { CompositionOutput } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import { makeIssue } from "../shared/issue";

/**
 * Rule: gap-report 완전성 (SPEC §7.1)
 * - prddEvidence / consideredPrimitives / consideredComponentPatterns / suggestedPrimitive 4종 세트 필수
 */
export function checkGapReport(output: CompositionOutput): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	output.gapReports.forEach((gap, i) => {
		const missing: string[] = [];
		if (!gap.prddEvidence || !gap.prddEvidence.intent) missing.push("prddEvidence");
		if (!gap.consideredPrimitives) missing.push("consideredPrimitives");
		if (!gap.consideredComponentPatterns) missing.push("consideredComponentPatterns");
		if (!gap.suggestedPrimitive || !gap.suggestedPrimitive.name) missing.push("suggestedPrimitive");

		if (missing.length > 0) {
			issues.push(
				makeIssue(
					"gap-report.incomplete",
					"contract",
					`gapReport "${gap.id}" 에 필수 필드 누락: ${missing.join(", ")}`,
					{
						path: ["gapReports", i],
						nodeId: gap.id,
						data: { gapReportId: gap.id, missing },
					},
				),
			);
		}
	});

	return issues;
}
