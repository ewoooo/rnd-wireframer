import { bottomCtaStateUngatedRule } from "./bottom-cta-state-ungated";
import type { QualityRule } from "./define-rule";
import { singleSectionDividerRule } from "./single-section-divider";
import { sourcePropMismatchRule } from "./source-prop-mismatch";
import {
	compositionPlanSourceRefNotMaterializedRule,
	sourceRefNotMaterializedRule,
} from "./source-ref-not-materialized";
import { stateCoverageMissingRule } from "./state-coverage-missing";
import { unknownSourceRefRule } from "./unknown-source-ref";

export type { QualityRule, RuleContext } from "./define-rule";
export { defineRule } from "./define-rule";

/** 등록된 품질 rule 전부. 새 rule은 여기 한 줄 추가로 등록된다. */
export const QUALITY_RULES: readonly QualityRule[] = [
	bottomCtaStateUngatedRule,
	compositionPlanSourceRefNotMaterializedRule,
	singleSectionDividerRule,
	sourcePropMismatchRule,
	sourceRefNotMaterializedRule,
	stateCoverageMissingRule,
	unknownSourceRefRule,
];
