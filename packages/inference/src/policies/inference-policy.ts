import type { InferenceStepDefinition } from "../contracts";

export const VALIDATION_REPORT_FAILURE_CODE = "deterministic_validation_failed";

export type StepOutputPolicyFailure = {
	code: string;
	message: string;
};

export async function shouldRunInferenceStep(
	runWhen: InferenceStepDefinition["runWhen"],
	context: {
		readJson<T>(key: string): Promise<T>;
	},
): Promise<boolean> {
	if (!runWhen) return true;
	if (runWhen.kind === "context-validation-report-has-errors") {
		const report = await context.readJson<unknown>(runWhen.contextKey);
		return hasValidationReportErrors(report);
	}
	return true;
}

export function evaluateStepOutputPolicy(
	step: InferenceStepDefinition,
	raw: unknown,
): StepOutputPolicyFailure | undefined {
	if (
		step.output.failWhen?.kind === "validation-report-has-errors" &&
		hasValidationReportErrors(raw)
	) {
		return {
			code: VALIDATION_REPORT_FAILURE_CODE,
			message: "Deterministic validation still has errors after one revision attempt.",
		};
	}
	return undefined;
}

export function hasValidationReportErrors(input: unknown): boolean {
	return readValidationReportErrorCount(input) > 0;
}

export function readValidationReportErrorCount(input: unknown): number {
	const summary = readRecord(input)?.summary;
	const errorCount = readRecord(summary)?.errorCount;
	return typeof errorCount === "number" ? errorCount : 0;
}

function readRecord(input: unknown): Record<string, unknown> | undefined {
	if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
	return input as Record<string, unknown>;
}
