import type { CompositionOutput, ValidationIssue } from "@cx/types";
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

	issues.push(...checkModeSelection(output));
	issues.push(...checkArchetypeCompleteness(output, deps));
	issues.push(...checkCatalogExistence(output, deps));
	issues.push(...checkSourceTracing(output, deps));
	issues.push(...checkProposePattern(output, deps));
	issues.push(...checkLayoutDraft(output, deps));
	issues.push(...checkDesignRefs(output, deps));
	issues.push(...checkAreaShape(output));
	issues.push(...checkGapReport(output));
	issues.push(...checkPropContract(output, deps));

	const hasError = issues.some((issue) => issue.severity === "error");
	return {
		ok: !hasError,
		issues,
		data: hasError ? undefined : output,
		retryHints: hasError ? buildRetryHints(issues) : undefined,
	};
}
