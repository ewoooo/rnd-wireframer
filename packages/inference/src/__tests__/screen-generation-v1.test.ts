import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

describe("screenGenerationPipelineV1", () => {
	it("declares ordered validation and one-shot revision steps", () => {
		expect(screenGenerationPipelineV1.id).toBe("screen-generation");
		expect(screenGenerationPipelineV1.version).toBe("v1");
		expect(screenGenerationPipelineV1.steps.map((s) => [s.id, s.engine])).toEqual([
			["01-source-spec", "function"],
			["02-screen-intent", "claude"],
			["03-composition", "claude"],
			["04-render-tree", "claude"],
			["05-validation", "function"],
			["06-revision", "claude"],
			["07-validation-after-revision", "function"],
			["08-quality", "claude"],
		]);
		expect(screenGenerationPipelineV1.steps[5]?.runWhen).toEqual({
			contextKey: "validation-report",
			kind: "context-validation-report-has-errors",
		});
		expect(screenGenerationPipelineV1.steps[6]?.output.failWhen).toEqual({
			kind: "validation-report-has-errors",
		});
	});

	it("uses prompt.id as the taskKind for every claude step", () => {
		const claudeSteps = screenGenerationPipelineV1.steps.filter((s) => s.engine === "claude");
		expect(claudeSteps.map((s) => s.prompt?.id)).toEqual([
			"screen-intent",
			"composition-planning",
			"screen-generation",
			"screen-revision",
			"quality-review",
		]);
		expect(screenGenerationPipelineV1.steps[1]?.references).toEqual({
			skillset: {
				source: "stage-skillset",
				id: "understand.screen-intent",
				version: undefined,
			},
		});
		expect(
			screenGenerationPipelineV1.steps.slice(2).every((step) => step.references === undefined),
		).toBe(true);
	});

	it("every step output contract resolves", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(() => resolveOutputContractForInference(step.output.contractRef.id)).not.toThrow();
		}
	});
});
