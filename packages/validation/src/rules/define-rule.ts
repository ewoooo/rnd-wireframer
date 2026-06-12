import type { SourceSpec } from "@cx/schema";
import type { ValidationIssueCode } from "../public/registry";
import type { ValidationTarget } from "../public/types";
import type { IssuePath } from "./helpers";

/** component-proposal 품질 rule이 참조하는 경계 옵션. validators의 공개 옵션 타입과 동일 모양. */
export type ComponentProposalRuleOptions = {
	allowedRefs?: string[];
	catalogComponentTypes?: string[];
	maxProposals?: number;
};

/**
 * 품질 rule이 받는 실행 컨텍스트.
 * report()는 rule 자신의 code·severity(registry 조회)를 자동으로 채운다 —
 * rule이 자기 code 외의 issue를 발생시키는 드리프트를 구조적으로 차단한다.
 */
export type RuleContext = {
	/** 검증 대상 산출물 (target에 따라 RenderTree, CompositionPlan, proposal 객체) */
	tree: Record<string, unknown>;
	/** materialization 검사 대상. render-tree에서는 generatedArtifact ?? tree, composition-plan에서는 generatedArtifact */
	artifact: unknown;
	sourceSpec?: SourceSpec;
	proposalOptions?: ComponentProposalRuleOptions;
	report: (issue: { message: string; path: IssuePath }) => void;
};

export type QualityRule = {
	code: ValidationIssueCode;
	target: ValidationTarget;
	/** 선언된 입력이 없으면 엔진이 rule을 건너뛴다 (enable 조건). generatedArtifact는 ctx.artifact 존재 여부로 판정한다 */
	requires?: ReadonlyArray<"generatedArtifact" | "sourceSpec">;
	check: (ctx: RuleContext) => void;
};

export function defineRule(rule: QualityRule): QualityRule {
	return rule;
}
