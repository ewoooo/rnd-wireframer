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

	const [namespace, key, ...path] = ref.ref.split(".");
	if (!namespace || !key) throw new StepInputResolutionError(ref.ref);

	if (namespace === "input") return readPath(state.input[key], path, ref.ref);
	if (namespace === "ref") return readPath(state.refs[key], path, ref.ref);
	if (namespace === "step") {
		const stepState = state.steps[key];
		if (!stepState || !("output" in stepState)) throw new StepInputResolutionError(ref.ref);
		return readPath(stepState.output, path, ref.ref);
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

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}
