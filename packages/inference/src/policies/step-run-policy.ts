import type { InferenceStepDefinition } from "../contracts";
import { hasValidationReportErrors } from "./validation-report-policy";

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
