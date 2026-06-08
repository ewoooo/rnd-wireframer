import { describe, expect, it } from "vitest";
import {
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	knowledge,
	outputContractRef,
} from "../pipeline";

const step = defineStep({
	id: "01-analyze",
	engine: "function",
	inputs: { job: jobInput() },
	references: { skill: knowledge("skill", "screen-generation") },
	run: { id: "source-spec-mvp" },
	output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
});

describe("pipeline authoring", () => {
	it("builds refs and step literals", () => {
		expect(step.inputs?.job).toEqual({ kind: "job-input", path: undefined });
		expect(step.references?.skill).toEqual({ source: "skill", id: "screen-generation", version: undefined });
		expect(step.output.contractRef).toEqual({ source: "output-contract", id: "source-spec", version: undefined });
	});

	it("registry resolves by id@version and throws on unknown", () => {
		const reg = createPipelineRegistry();
		reg.register(definePipeline({ id: "screen-generation", version: "v1", steps: [step] }));
		expect(reg.get("screen-generation", "v1").steps).toHaveLength(1);
		expect(() => reg.get("screen-generation", "v2")).toThrow();
	});
});
