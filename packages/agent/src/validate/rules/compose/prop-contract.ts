import type { PrimitiveCard } from "@cx/types/ai-deck";
import type { ComponentPropContract } from "@cx/types/component-catalog";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import { getValidatorContext } from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";
import type { ValidatorDeps } from "../../types";

/**
 * Rule: prop contract / token-role (SPEC §7.1)
 *
 * v1 검사 범위 (얕은 검증):
 * - reuse-primitive decision의 props가 primitive 카드 contract에 정의된 prop만 사용
 * - required prop이 누락되지 않음
 * - tokenRole이 선언된 prop은 값이 string (token ref) 이어야 함 — raw number 금지
 *
 * variantTokens 정합 / scale 검사 등 깊은 검증은 후속 단계.
 */
export function checkPropContract(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const index = getValidatorContext(deps).catalog;

	output.decisions.forEach((decision, i) => {
		if (decision.selection.mode !== "reuse-primitive") return;
		const card = index.primitives.get(decision.selection.primitiveId);
		if (!card) return; // catalog-existence 룰이 이미 잡음

		const contractByName = mapContracts(card);

		// declared 외 prop 사용
		for (const propName of Object.keys(decision.props)) {
			const contract = contractByName.get(propName);
			if (!contract) {
				issues.push(
					makeIssue(
						"composition.prop-contract.violation",
						"contract",
						`primitive "${card.id}" 에 선언되지 않은 prop "${propName}" 사용`,
						{
							path: ["decisions", i, "props", propName],
							nodeId: decision.id,
							data: { decisionId: decision.id, primitiveId: card.id, prop: propName },
						},
					),
				);
				continue;
			}
			if (contract.tokenRole && !isTokenLikeValue(decision.props[propName])) {
				issues.push(
					makeIssue(
						"composition.token-role.violation",
						"tokens",
						`prop "${propName}" 은(는) tokenRole=${contract.tokenRole} 이지만 token ref가 아닌 raw 값`,
						{
							path: ["decisions", i, "props", propName],
							nodeId: decision.id,
							data: {
								decisionId: decision.id,
								primitiveId: card.id,
								prop: propName,
								tokenRole: contract.tokenRole,
								value: decision.props[propName],
							},
						},
					),
				);
			}
		}

		// required 누락
		for (const [name, contract] of contractByName) {
			if (contract.required && !(name in decision.props)) {
				issues.push(
					makeIssue(
						"composition.prop-contract.violation",
						"contract",
						`primitive "${card.id}" 의 required prop "${name}" 누락`,
						{
							path: ["decisions", i, "props"],
							nodeId: decision.id,
							data: { decisionId: decision.id, primitiveId: card.id, missingProp: name },
						},
					),
				);
			}
		}
	});

	return issues;
}

function mapContracts(card: PrimitiveCard): Map<string, ComponentPropContract> {
	const m = new Map<string, ComponentPropContract>();
	for (const { name, contract } of card.props) m.set(name, contract);
	return m;
}

function isTokenLikeValue(value: unknown): boolean {
	if (typeof value !== "string") return false;
	// 단순 휴리스틱: dot-path 형식 (예: "color.surface.primary", "spacing.md")
	return /\./.test(value) && !/^\d/.test(value);
}
