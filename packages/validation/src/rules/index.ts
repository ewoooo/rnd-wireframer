import type { QualityRule } from "./define-rule";
import { singleSectionDividerRule } from "./single-section-divider";

export type { QualityRule, RuleContext } from "./define-rule";
export { defineRule } from "./define-rule";

/** 등록된 품질 rule 전부. 새 rule은 여기 한 줄 추가로 등록된다. */
export const QUALITY_RULES: readonly QualityRule[] = [singleSectionDividerRule];
