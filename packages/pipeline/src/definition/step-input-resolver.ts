import { isRecord } from "@cx/types/guards";
import type { PipelineExecutionState, ResolvedStepInputs, StepInputRef } from "../public/types";

export class StepInputResolutionError extends Error {
	readonly code = "pipeline.step_input_ref_missing";
	readonly ref: string;

	constructor(ref: string) {
		super(`Pipeline step input reference is missing: ${ref}`);
		this.name = "StepInputResolutionError";
		this.ref = ref;
	}
}

export function createPipelineExecutionState(input: {
	input?: Record<string, unknown>;
	refs?: Record<string, unknown>;
	steps?: PipelineExecutionState["steps"];
}): PipelineExecutionState {
	return {
		input: input.input ?? {},
		refs: input.refs ?? {},
		retryCounts: {},
		steps: input.steps ?? {},
	};
}

export function resolveStepInputs(
	inputs: Record<string, StepInputRef> | undefined,
	state: PipelineExecutionState,
): ResolvedStepInputs {
	return Object.fromEntries(
		Object.entries(inputs ?? {}).map(([key, ref]) => [key, resolveStepInput(ref, state)]),
	);
}

export function resolveStepInput(ref: StepInputRef, state: PipelineExecutionState): unknown {
	if (ref.kind === "value") return ref.value;
	if (ref.kind === "step-output") {
		const stepState = state.steps[ref.stepId];
		const outputs = stepState?.outputs;
		if (!outputs || !(ref.outputName in outputs)) {
			throw new StepInputResolutionError(`step.${ref.stepId}.${ref.outputName}`);
		}
		const output = outputs[ref.outputName];
		if (output === undefined)
			throw new StepInputResolutionError(`step.${ref.stepId}.${ref.outputName}`);
		return output;
	}

	const [namespace, key, ...path] = ref.ref.split(".");
	if (!namespace || !key) throw new StepInputResolutionError(ref.ref);

	if (namespace === "input") return readPath(state.input[key], path, ref.ref);
	if (namespace === "ref") return readPath(state.refs[key], path, ref.ref);
	if (namespace === "step") {
		const outputs = state.steps[key]?.outputs;
		if (!outputs || !("result" in outputs)) throw new StepInputResolutionError(ref.ref);
		return readPath(outputs.result, path, ref.ref);
	}

	throw new StepInputResolutionError(ref.ref);
}

function readPath(value: unknown, path: string[], ref: string): unknown {
	let cursor = value;

	for (const segment of path) {
		if (!isRecord(cursor) || !(segment in cursor)) {
			throw new StepInputResolutionError(ref);
		}
		cursor = cursor[segment];
	}

	if (cursor === undefined) throw new StepInputResolutionError(ref);
	return cursor;
}
