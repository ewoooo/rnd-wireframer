import { actionButtonDefaultTypeMissingRule } from "./action-button-default-type-missing";
import { actionButtonLabelMissingRule } from "./action-button-label-missing";
import { bottomCtaStateUngatedRule } from "./bottom-cta-state-ungated";
import type { QualityRule } from "./define-rule";
import { proposalEvidenceKindMismatchRule } from "./proposal-evidence-kind-mismatch";
import { proposalLimitExceededRule } from "./proposal-limit-exceeded";
import { proposalNearestMatchUnknownRule } from "./proposal-nearest-match-unknown";
import { proposalSourceEvidenceMissingRule } from "./proposal-source-evidence-missing";
import { singleSectionDividerRule } from "./single-section-divider";
import { sourcePropMismatchRule } from "./source-prop-mismatch";
import {
	compositionPlanSourceRefNotMaterializedRule,
	sourceRefNotMaterializedRule,
} from "./source-ref-not-materialized";
import { sourceTextRewordedRule } from "./source-text-reworded";
import { stateCoverageMissingRule } from "./state-coverage-missing";
import { unknownSourceRefRule } from "./unknown-source-ref";

export type { QualityRule, RuleContext } from "./define-rule";
export { defineRule } from "./define-rule";

/** 등록된 품질 rule 전부. 새 rule은 여기 한 줄 추가로 등록된다. */
export const QUALITY_RULES: readonly QualityRule[] = [
	actionButtonDefaultTypeMissingRule,
	actionButtonLabelMissingRule,
	bottomCtaStateUngatedRule,
	compositionPlanSourceRefNotMaterializedRule,
	proposalEvidenceKindMismatchRule,
	proposalLimitExceededRule,
	proposalNearestMatchUnknownRule,
	proposalSourceEvidenceMissingRule,
	singleSectionDividerRule,
	sourcePropMismatchRule,
	sourceRefNotMaterializedRule,
	sourceTextRewordedRule,
	stateCoverageMissingRule,
	unknownSourceRefRule,
];
