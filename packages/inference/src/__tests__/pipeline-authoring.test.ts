import { describe, expect, it } from "vitest";
import {
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	skillset,
} from "../pipeline";

const step = defineStep({
	id: "01-analyze",
	inputs: { job: jobInput() },
	references: { extraSkillset: skillset("screen-generation") },
	run: { id: "source-spec-mvp" },
	output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
});

describe("pipeline authoring", () => {
	it("builds refs and step literals", () => {
		expect(step.inputs?.job).toEqual({ kind: "job-input", path: undefined });
		expect(step.references?.extraSkillset).toEqual({
			source: "skillset",
			id: "screen-generation",
		});
		expect(step.output.contractRef).toEqual({
			source: "output-contract",
			id: "source-spec",
		});
	});

	it("rejects a step declaring both task and run, or neither", () => {
		expect(() =>
			defineStep({
				id: "bad-both",
				task: "screen-intent",
				run: { id: "fake" },
				output: { contractRef: outputContractRef("source-spec") },
			}),
		).toThrow(/exactly one of task/);
		expect(() =>
			defineStep({
				id: "bad-neither",
				output: { contractRef: outputContractRef("source-spec") },
			}),
		).toThrow(/exactly one of task/);
	});

	it("registry resolves by id@version and throws on unknown", () => {
		const reg = createPipelineRegistry();
		reg.register(definePipeline({ id: "screen-generation", version: "v1", steps: [step] }));
		expect(reg.get("screen-generation", "v1").steps).toHaveLength(1);
		expect(() => reg.get("screen-generation", "v2")).toThrow();
	});
});
