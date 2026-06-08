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
			contextValidationReportHasErrors: "validation-report",
		});
		expect(screenGenerationPipelineV1.steps[6]?.output.failJobWhenValidationReportHasErrors).toBe(
			true,
		);
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
		for (const step of claudeSteps) {
			expect("references" in step ? step.references : undefined).toBeUndefined();
		}
	});

	it("every step output contract resolves", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(() => resolveOutputContractForInference(step.output.contractRef.id)).not.toThrow();
		}
	});
});
