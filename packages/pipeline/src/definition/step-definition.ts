import type {
	PipelineArtifactRule,
	PipelineStep,
	StepInputRef,
	StepPipelineDefinition,
} from "../public/types";

export function from(ref: string): StepInputRef {
	return { kind: "ref", ref };
}

export function value(input: unknown): StepInputRef {
	return { kind: "value", value: input };
}

export function defineStep<Step extends PipelineStep>(step: Step): Step {
	return {
		...step,
		inputs: { ...(step.inputs ?? {}) },
	};
}

export function definePipeline<Definition extends StepPipelineDefinition>(
	definition: Definition,
): Definition {
	return {
		...definition,
		artifacts: definition.artifacts?.map(copyArtifactRule),
		feedback: definition.feedback?.map((rule) => ({ ...rule })),
		steps: definition.steps.map((step) => defineStep(step)),
	};
}

function copyArtifactRule(rule: PipelineArtifactRule): PipelineArtifactRule {
	return {
		...rule,
		from:
			rule.from.kind === "step-collection"
				? { ...rule.from, stepIds: [...rule.from.stepIds] }
				: { ...rule.from },
	};
}
