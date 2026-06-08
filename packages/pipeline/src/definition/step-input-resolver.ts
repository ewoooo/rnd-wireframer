import { isRecord } from "@cx/types/guards";
import type {
	PipelineExecutionState,
	ReferenceResolver,
	ResolvedStepInputs,
	StepInputRef,
} from "../public/types";

/**
 * Per-run reference resolution: maps a declared reference name to pure data and
 * memoizes it so adapter loads (loadCatalog/loadContents) run once per run.
 */
export type ReferenceResolution = {
	resolveReference?: ReferenceResolver;
	cache: Map<string, Promise<unknown>>;
};

export function createReferenceResolution(
	resolveReference?: ReferenceResolver,
): ReferenceResolution {
	return { cache: new Map(), resolveReference };
}

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
		steps: input.steps ?? {},
	};
}

export async function resolveStepInputs(
	inputs: Record<string, StepInputRef> | undefined,
	state: PipelineExecutionState,
	resolution?: ReferenceResolution,
): Promise<ResolvedStepInputs> {
	const entries = await Promise.all(
		Object.entries(inputs ?? {}).map(async ([key, ref]) => {
			if (ref.kind === "refs") return [key, await resolveReferences(ref.names, state, resolution)];
			return [key, resolveStepInput(ref, state)];
		}),
	);
	return Object.fromEntries(entries);
}

async function resolveReferences(
	names: string[],
	state: PipelineExecutionState,
	resolution?: ReferenceResolution,
): Promise<Record<string, unknown>> {
	const resolved = await Promise.all(
		names.map((name) => resolveReferenceMemo(name, state, resolution)),
	);
	return Object.fromEntries(names.map((name, index) => [name, resolved[index]]));
}

function resolveReferenceMemo(
	name: string,
	state: PipelineExecutionState,
	resolution?: ReferenceResolution,
): Promise<unknown> {
	// No resolver provided: fall back to the raw adapter under state.refs[name].
	if (!resolution) return Promise.resolve(state.refs[name]);
	let pending = resolution.cache.get(name);
	if (!pending) {
		pending = Promise.resolve(
			resolution.resolveReference
				? resolution.resolveReference(name, state.refs)
				: state.refs[name],
		);
		resolution.cache.set(name, pending);
	}
	return pending;
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
	// `refs([...])` is resolved asynchronously in resolveStepInputs, never here.
	if (ref.kind === "refs") throw new StepInputResolutionError(`refs:${ref.names.join(",")}`);

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
