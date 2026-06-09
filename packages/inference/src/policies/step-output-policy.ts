import type { InferenceStepDefinition } from "../contracts";
import {
	hasValidationReportErrors,
	VALIDATION_REPORT_FAILURE_CODE,
} from "./validation-report-policy";

export type StepOutputPolicyFailure = {
	code: string;
	message: string;
};

export function evaluateStepOutputPolicy(
	step: InferenceStepDefinition,
	raw: unknown,
): StepOutputPolicyFailure | undefined {
	if (shouldFailForValidationReportErrors(step, raw)) {
		return {
			code: VALIDATION_REPORT_FAILURE_CODE,
			message: "Deterministic validation still has errors after one revision attempt.",
		};
	}
	return undefined;
}

function shouldFailForValidationReportErrors(step: InferenceStepDefinition, raw: unknown): boolean {
	return (
		step.output.failWhen?.kind === "validation-report-has-errors" && hasValidationReportErrors(raw)
	);
}
