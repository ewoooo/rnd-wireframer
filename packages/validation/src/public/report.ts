import type { ValidationIssue, ValidationReport } from "./types";

/**
 * Validation 결과의 단일 모양({ ok, issues, summary, target })에서 severity별 issue를
 * 추출하는 표준 헬퍼다. 소비자가 `report.issues`를 직접 severity로 필터링하지 않고
 * 이 헬퍼를 거치게 해서 severity 판정 로직을 한곳에 고정한다.
 */
export function errorsOf(report: ValidationReport): ValidationIssue[] {
	return report.issues.filter((issue) => issue.severity === "error");
}

export function warningsOf(report: ValidationReport): ValidationIssue[] {
	return report.issues.filter((issue) => issue.severity === "warning");
}
