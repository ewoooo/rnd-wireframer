import type { ContextStore, InferenceRuntime, StepInputRef } from "../contracts";

export async function resolveInput(
	jobId: string,
	jobInput: unknown,
	ref: StepInputRef,
	runtime: InferenceRuntime,
	contextStore: ContextStore,
): Promise<unknown> {
	switch (ref.kind) {
		case "job-input":
			return ref.path ? readPath(jobInput, ref.path) : jobInput;
		case "step-output":
			return runtime.artifactStore.readJson(jobId, `steps/${ref.stepId}/output.json`);
		case "context":
			return contextStore.readJson(ref.key);
		case "artifact":
			return runtime.artifactStore.readJson(jobId, ref.path);
		case "value":
			return ref.value;
	}
}

function readPath(value: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((current, key) => {
		if (current && typeof current === "object" && key in current) {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, value);
}
