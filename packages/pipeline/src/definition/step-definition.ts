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
	assertStepInputOrder(definition.steps);
	return {
		...definition,
		artifacts: definition.artifacts?.map(copyArtifactRule),
		steps: definition.steps.map((step) => defineStep(step)),
	};
}

/**
 * Validate that every `stepOutput(id)` input refers to a step declared earlier in
 * the array. Steps run in declaration order with no feedback/skip, so a forward
 * (or self) reference can never resolve — catch it at definition time.
 */
function assertStepInputOrder(steps: StepPipelineDefinition["steps"]): void {
	const seen = new Set<string>();
	for (const step of steps) {
		for (const ref of Object.values(step.inputs ?? {})) {
			if (ref.kind === "step-output" && !seen.has(ref.stepId)) {
				throw new Error(
					`Pipeline step "${step.id}" reads "${ref.stepId}" which is not declared before it.`,
				);
			}
		}
		seen.add(step.id);
	}
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
