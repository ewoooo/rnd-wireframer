import { isRecord } from "@cx/schema";
import { readReportSummary } from "../shared/report-summary";
import type { BuildGenerationNextActionInput, GenerationNextAction } from "./types";

/**
 * Converts validation and quality summaries into a deterministic pipeline recommendation.
 * It never runs a revision itself; @cx/pipeline owns stage execution and artifact writes.
 */
export function buildGenerationNextAction(
	input: BuildGenerationNextActionInput,
): GenerationNextAction {
	const validationReport = readReportSummary(input.validationReport);
	const initialValidationReport = readReportSummary(input.initialValidationReport);
	const qualityInspection = readQualityInspection(input.qualityInspection);
	const activeReport = validationReport ?? initialValidationReport;

	if (input.retryCount > 0 && activeReport?.errorCount) {
		return {
			action: "request-human-review",
			reason: "Validation still has errors after a revision attempt.",
		};
	}

	if (activeReport?.errorCount) {
		return {
			action: "request-revision",
			reason: "Validation report contains schema or semantic errors.",
			target: "contract",
		};
	}

	if (input.retryCount > 0 && qualityInspection.errorCount) {
		return {
			action: "request-human-review",
			reason: "Quality review still has P0 findings after a revision attempt.",
		};
	}

	if (qualityInspection.errorCount > 0) {
		return {
			action: "request-revision",
			reason: "Quality review contains P0 findings.",
			target: "quality",
		};
	}

	if ((activeReport?.warningCount ?? 0) > 0 || qualityInspection.warningCount > 0) {
		return {
			action: "request-human-review",
			reason: "Only warnings remain; preserve artifacts for human review.",
		};
	}

	return {
		action: "write-artifacts",
		reason: "Validation and quality review have no blocking findings.",
	};
}

function readQualityInspection(input: unknown): { errorCount: number; warningCount: number } {
	const summary = readReportSummary(input);
	if (summary) return summary;
	if (!isRecord(input) || !Array.isArray(input.findings)) {
		return { errorCount: 0, warningCount: 0 };
	}
	return {
		errorCount: input.findings.filter(
			(finding) => isRecord(finding) && finding.severity === "error",
		).length,
		warningCount: input.findings.filter(
			(finding) => isRecord(finding) && finding.severity === "warning",
		).length,
	};
}
