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
		// Composition gets the layout catalog; render-tree and revision also get the
		// component catalog so claude builds nodes from real layout/component ids.
		const layoutCatalog = { source: "layout-catalog", id: undefined, version: undefined };
		const componentCatalog = { source: "component-catalog", id: undefined, version: undefined };
		expect(screenGenerationPipelineV1.steps[2]?.references).toEqual({ layoutCatalog });
		expect(screenGenerationPipelineV1.steps[3]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
		});
		expect(screenGenerationPipelineV1.steps[5]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
		});
		// Quality review pulls the review skillset (checklist + per-axis review skills).
		expect(screenGenerationPipelineV1.steps[7]?.references).toEqual({
			skillset: {
				source: "stage-skillset",
				id: "revise.quality-review",
				version: undefined,
			},
		});
		// Function steps carry no knowledge references.
		expect(screenGenerationPipelineV1.steps[4]?.references).toBeUndefined();
		expect(screenGenerationPipelineV1.steps[6]?.references).toBeUndefined();
	});

	it("every step output contract resolves", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(() => resolveOutputContractForInference(step.output.contractRef.id)).not.toThrow();
		}
	});
});
