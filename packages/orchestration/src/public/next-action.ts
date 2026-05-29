import type { BuildGenerationNextActionInput, GenerationNextAction } from "./types";

/**
 * Converts validation and quality summaries into a deterministic pipeline recommendation.
 * It never runs a revision itself; @cx/pipeline owns stage execution and artifact writes.
 */
export function buildGenerationNextAction(
	input: BuildGenerationNextActionInput,
): GenerationNextAction {
	const validationReport = readReport(input.validationReport);
	const initialValidationReport = readReport(input.initialValidationReport);
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

function readReport(input: unknown): { errorCount: number; warningCount: number } | undefined {
	if (!isRecord(input) || !isRecord(input.summary)) return undefined;
	const errorCount = input.summary.errorCount;
	const warningCount = input.summary.warningCount;
	if (typeof errorCount !== "number" || typeof warningCount !== "number") return undefined;
	return { errorCount, warningCount };
}

function readQualityInspection(input: unknown): { errorCount: number; warningCount: number } {
	const summary = readReport(input);
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

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}
