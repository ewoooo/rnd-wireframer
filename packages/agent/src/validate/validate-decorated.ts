import type { CompositionOutput, DecoratedOutput, ValidationIssue } from "@cx/types";

import { checkDraftHandoff } from "./rules/decorate/draft-handoff";
import { checkLayoutPatternFinal } from "./rules/decorate/layout-pattern";
import { checkReasonsPresent } from "./rules/decorate/reasons";
import { buildRetryHints } from "./retry-hint";
import type { ValidatorDeps, ValidatorResult } from "./types";

/**
 * Validator #2 — Decorate 직후 검수. SPEC §7.2.
 *
 * 트리 불변 검사는 Schema E (DecoratedOutput) 가 트리/props/bindings 필드를 *애초에 가지지 않게* 설계해
 * 구조적으로 강제한다. (TypeScript 타입 자체가 불변성을 보장)
 *
 * 동적 검사 대상:
 * - layoutPattern 존재 / variant / 노드 종류 호환성
 * - 모든 verification reasons[] 필수
 * - Compose draft → Decorate verification 핸드오프 정합성
 *   (verdict ↔ 실제 변경 일관, 변경 시 3종 세트 필수, area/decision key 매칭)
 */
export interface ValidateDecoratedDeps extends ValidatorDeps {
	composition: CompositionOutput;
}

export function validateDecorated(
	decorated: DecoratedOutput,
	deps: ValidateDecoratedDeps,
): ValidatorResult<DecoratedOutput> {
	const issues: ValidationIssue[] = [];

	issues.push(...checkLayoutPatternFinal(decorated, deps));
	issues.push(...checkReasonsPresent(decorated));
	issues.push(...checkDraftHandoff(decorated, deps.composition, deps.designDeck));

	const hasError = issues.some((issue) => issue.severity === "error");
	return {
		ok: !hasError,
		issues,
		data: hasError ? undefined : decorated,
		retryHints: hasError ? buildRetryHints(issues) : undefined,
	};
}
