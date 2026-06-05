import type {
	OutputContract,
	PipelineArtifactRule,
	PipelineStep,
	StepInputRef,
	StepPipelineDefinition,
} from "../public/types";

export function from(ref: string): StepInputRef {
	return { kind: "ref", ref };
}

export function refInput(ref: string): StepInputRef {
	return { kind: "ref", ref: ref.includes(".") ? ref : `ref.${ref}` };
}

export function stepOutput(stepId: string, outputName: string): StepInputRef {
	return { kind: "step-output", outputName, stepId };
}

/** Declares the named references a step needs; the engine resolves them to pure data. */
export function refs(names: string[]): StepInputRef {
	return { kind: "refs", names };
}

export function value(input: unknown): StepInputRef {
	return { kind: "value", value: input };
}

export function contract(contractId: string): OutputContract {
	return {
		artifactKind: contractId,
		schemaVersion: `${contractId}.v0.1`,
	};
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
