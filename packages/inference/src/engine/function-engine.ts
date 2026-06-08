import type { Engine, EngineRequest } from "../contracts";

export type InferenceFunction = (request: EngineRequest) => unknown | Promise<unknown>;

export function createFunctionEngine(functions: Record<string, InferenceFunction>): Engine {
	return {
		async execute(request) {
			if (!request.run) throw new Error("function engine requires step.run");
			const fn = functions[request.run.id];
			if (!fn) throw new Error(`Unknown function: ${request.run.id}`);
			return { raw: await fn(request) };
		},
	};
}
