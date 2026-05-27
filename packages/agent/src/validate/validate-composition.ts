import type { CompositionOutput } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import { buildRetryHints } from "./retry-hint";
import { checkArchetypeCompleteness } from "./rules/compose/archetype-completeness";
import { checkAreaShape } from "./rules/compose/area-shape";
import { checkCatalogExistence } from "./rules/compose/catalog-existence";
import { checkDesignRefs } from "./rules/compose/design-refs";
import { checkGapReport } from "./rules/compose/gap-report";
import { checkLayoutDraft } from "./rules/compose/layout-draft";
import { checkModeSelection } from "./rules/compose/mode-selection";
import { checkPropContract } from "./rules/compose/prop-contract";
import { checkProposePattern } from "./rules/compose/propose-pattern";
import { checkSourceTracing } from "./rules/compose/source-tracing";
import { getValidatorContext } from "./rules/shared/deck-lookup";
import type { ValidatorDeps, ValidatorResult } from "./types";

/**
 * Validator #1 — Compose 직후 검수.
 * SPEC §7.1 의 모든 룰을 순차 실행하고 issue를 누적한다.
 *
 * 결과는 기존 `{ok, issues, data?}` ValidationResult 형식에 retryHints[]를 더한 모양.
 * (메모리 룰: validation result single shape)
 */
export function validateComposition(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidatorResult<CompositionOutput> {
	const issues: ValidationIssue[] = [];
	const resolvedDeps = { ...deps, validationContext: getValidatorContext(deps) };

	issues.push(...checkModeSelection(output));
	issues.push(...checkArchetypeCompleteness(output, resolvedDeps));
	issues.push(...checkCatalogExistence(output, resolvedDeps));
	issues.push(...checkSourceTracing(output, resolvedDeps));
	issues.push(...checkProposePattern(output, resolvedDeps));
	issues.push(...checkLayoutDraft(output, resolvedDeps));
	issues.push(...checkDesignRefs(output, resolvedDeps));
	issues.push(...checkAreaShape(output));
	issues.push(...checkGapReport(output));
	issues.push(...checkPropContract(output, resolvedDeps));

	const hasError = issues.some((issue) => issue.severity === "error");
	return {
		ok: !hasError,
		issues,
		data: hasError ? undefined : output,
		retryHints: hasError ? buildRetryHints(issues) : undefined,
	};
}
