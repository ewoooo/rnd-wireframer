import type { Engine, EngineRequest } from "../contracts";

export type FakeEngine = Engine & { calls: EngineRequest[] };

export function createFakeEngine(respond: (request: EngineRequest) => unknown): FakeEngine {
	const calls: EngineRequest[] = [];
	return {
		calls,
		async execute(request) {
			calls.push(request);
			return { raw: respond(request) };
		},
	};
}
