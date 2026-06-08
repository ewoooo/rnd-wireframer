import type { InferenceStepDefinition } from "../contracts";

export function defineStep<const T extends InferenceStepDefinition>(step: T): T {
	return step;
}
