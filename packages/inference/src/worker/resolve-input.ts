import type { ContextStore, StepInputRef } from "../contracts";

export async function resolveInput(
	jobInput: unknown,
	ref: StepInputRef,
	contextStore: ContextStore,
): Promise<unknown> {
	switch (ref.kind) {
		case "job-input":
			return ref.path ? readPath(jobInput, ref.path) : jobInput;
		case "context":
			return contextStore.readJson(ref.key);
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
