import type { EngineRequest } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createFunctionEngine } from "../engine/function-engine";

const baseRequest: EngineRequest = {
	inputs: { a: 1 },
	references: {},
	outputContract: { id: "source-spec", version: "v1", data: { jsonSchema: {} } } as never,
};

describe("function engine", () => {
	it("dispatches a registered function by run.id with the full request", async () => {
		const engine = createFunctionEngine({ echo: (req) => ({ echoed: req.inputs }) });
		const result = await engine.execute({ ...baseRequest, run: { id: "echo" } });
		expect(result.raw).toEqual({ echoed: { a: 1 } });
	});

	it("throws on missing run or unknown function", async () => {
		const engine = createFunctionEngine({});
		await expect(engine.execute(baseRequest)).rejects.toThrow();
		await expect(engine.execute({ ...baseRequest, run: { id: "nope" } })).rejects.toThrow();
	});
});
