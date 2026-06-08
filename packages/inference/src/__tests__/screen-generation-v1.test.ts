import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

describe("screenGenerationPipelineV1", () => {
	it("declares 5 ordered steps with the right engines", () => {
		expect(screenGenerationPipelineV1.id).toBe("screen-generation");
		expect(screenGenerationPipelineV1.version).toBe("v1");
		expect(screenGenerationPipelineV1.steps.map((s) => [s.id, s.engine])).toEqual([
			["01-source-spec", "function"],
			["02-screen-intent", "claude"],
			["03-composition", "claude"],
			["04-render-tree", "claude"],
			["05-quality", "claude"],
		]);
	});

	it("uses prompt.id as the taskKind for every claude step", () => {
		const claudeSteps = screenGenerationPipelineV1.steps.filter((s) => s.engine === "claude");
		expect(claudeSteps.map((s) => s.prompt?.id)).toEqual([
			"screen-intent",
			"composition-planning",
			"screen-generation",
			"quality-review",
		]);
		for (const step of claudeSteps) {
			expect(step.references ?? {}).toEqual({});
		}
	});

	it("every step output contract resolves", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(() => resolveOutputContractForInference(step.output.contractRef.id)).not.toThrow();
		}
	});
});
