import type { CompositionDecision, CompositionOutput } from "@cx/types/composition-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import type { ValidationIssue, ValidationResult } from "@cx/types/validation";
import type { CatalogIndex, DesignIndex, LayoutPatternIndex } from "./rules/shared/deck-lookup";

/**
 * Shared validator types.
 * SPEC §7 / database/AI-COMPOSITION-SPEC.md 참조.
 */

export interface ValidatorDeps {
	/** Validator 기준. 미지정 시 SSOT(@cx/components, @cx/pattern-store, docs/design)에서 직접 생성한다. */
	validationContext?: ValidatorContext;
	/** sourceRef 추적 대조용 PRDD Screen Record (Schema A). */
	prddScreenRecord: PrddScreenRecord;
}

export interface ValidatorContext {
	catalog: CatalogIndex;
	design: DesignIndex;
	layoutPatterns: LayoutPatternIndex;
}

/**
 * 좁은 재시도 인터페이스. Validator가 위반을 호출자에게 돌려줄 때
 * 어느 범위로 LLM 재호출을 좁힐지 직접 알려준다.
 */
export type RetryScope = "decision" | "area" | "screen";

export interface RetryHint {
	scope: RetryScope;
	/** decisionIds 또는 areaIds. screen scope면 screenId 단일. */
	targetIds: string[];
	issues: ValidationIssue[];
	/** LLM 재호출용 사전 포맷팅된 위반 목록. */
	promptFragment: string;
}

export interface ValidatorResult<T> extends ValidationResult<T> {
	retryHints?: RetryHint[];
}

export type ComposeCheck = (output: CompositionOutput, deps: ValidatorDeps) => ValidationIssue[];

/** decision id로 빠른 lookup용 헬퍼 타입. */
export type DecisionIndex = ReadonlyMap<string, CompositionDecision>;
