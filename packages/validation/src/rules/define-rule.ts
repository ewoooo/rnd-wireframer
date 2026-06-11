import type { SourceSpec } from "@cx/schema";
import type { ValidationIssueCode } from "../public/registry";
import type { ValidationTarget } from "../public/types";
import type { IssuePath } from "./helpers";

/**
 * 품질 rule이 받는 실행 컨텍스트.
 * report()는 rule 자신의 code·severity(registry 조회)를 자동으로 채운다 —
 * rule이 자기 code 외의 issue를 발생시키는 드리프트를 구조적으로 차단한다.
 */
export type RuleContext = {
	/** 검증 대상 트리 (validateRenderTree의 input) */
	tree: Record<string, unknown>;
	/** materialization 검사 대상 산출물 (options.generatedArtifact ?? tree) */
	artifact: unknown;
	sourceSpec?: SourceSpec;
	report: (issue: { message: string; path: IssuePath }) => void;
};

export type QualityRule = {
	code: ValidationIssueCode;
	target: ValidationTarget;
	/** 선언된 입력이 없으면 엔진이 rule을 건너뛴다 (enable 조건) */
	requires?: ReadonlyArray<"sourceSpec">;
	check: (ctx: RuleContext) => void;
};

export function defineRule(rule: QualityRule): QualityRule {
	return rule;
}
