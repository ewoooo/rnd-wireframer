import type { EngineRequest } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createFakeEngine } from "../testing/fake-engine";

const req: EngineRequest = {
	inputs: { a: 1 },
	references: {},
	outputContract: { id: "x", version: "v1", data: { jsonSchema: {} } } as never,
};

describe("createFakeEngine", () => {
	it("records calls and returns the programmed raw", async () => {
		const engine = createFakeEngine((r) => ({ seen: r.inputs }));
		const result = await engine.execute(req);
		expect(result.raw).toEqual({ seen: { a: 1 } });
		expect(engine.calls).toHaveLength(1);
		expect(engine.calls[0]?.outputContract.id).toBe("x");
	});
});
