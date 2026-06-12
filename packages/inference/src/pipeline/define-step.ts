import type { InferenceStepDefinition } from "../contracts";

export function defineStep(step: InferenceStepDefinition): InferenceStepDefinition {
	if (Boolean(step.task) === Boolean(step.run)) {
		throw new Error(`Step ${step.id}: declare exactly one of task (claude) or run (function)`);
	}
	return step;
}
