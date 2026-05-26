import type { CompositionOutput, ValidationIssue } from "@cx/types";

import { makeIssue } from "../shared/issue";

/**
 * Rule: area/screen shape (SPEC §7.1 screen strategy / visual hierarchy)
 * - area 마다 role / visualIntent 존재
 * - decision 마다 emphasis 존재
 * - screen strategy enum 유효 (타입 자체가 union이므로 런타임 데이터 검증)
 */

const VALID_STRATEGY = new Set([
	"task-flow",
	"comparison",
	"decision-summary",
	"error-recovery",
	"form-entry",
	"detail-reading",
	"confirmation",
	"support",
]);

const VALID_EMPHASIS = new Set(["high", "medium", "low"]);

export function checkAreaShape(output: CompositionOutput): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	if (!VALID_STRATEGY.has(output.screen.strategy)) {
		issues.push(
			makeIssue(
				"composition.screen.strategy.invalid",
				"contract",
				`screen.strategy "${output.screen.strategy}" 가 enum 값이 아님`,
				{ path: ["screen", "strategy"], nodeId: output.screen.screenId },
			),
		);
	}

	output.areas.forEach((area, i) => {
		if (!area.role || !area.visualIntent) {
			issues.push(
				makeIssue(
					"composition.visual-hierarchy.missing",
					"contract",
					`area "${area.areaId}" 의 role/visualIntent 누락`,
					{
						path: ["areas", i],
						nodeId: area.areaId,
						data: { areaId: area.areaId, role: area.role, visualIntent: area.visualIntent },
					},
				),
			);
		}
	});

	output.decisions.forEach((decision, i) => {
		if (!VALID_EMPHASIS.has(decision.emphasis)) {
			issues.push(
				makeIssue(
					"composition.visual-hierarchy.missing",
					"contract",
					`decision "${decision.id}" 의 emphasis "${decision.emphasis}" 가 유효하지 않음`,
					{
						path: ["decisions", i, "emphasis"],
						nodeId: decision.id,
						data: { decisionId: decision.id, emphasis: decision.emphasis },
					},
				),
			);
		}
	});

	return issues;
}
