import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

describe("screenGenerationPipelineV1", () => {
	it("declares ordered validation and one-shot revision steps", () => {
		expect(screenGenerationPipelineV1.id).toBe("screen-generation");
		expect(screenGenerationPipelineV1.version).toBe("v1");
		expect(screenGenerationPipelineV1.steps.map((s) => [s.id, s.task ?? s.run?.id])).toEqual([
			["01-source-spec", "source-spec-mvp"],
			["02-screen-intent", "screen-intent"],
			["03-composition", "composition-planning"],
			["04-render-tree", "screen-generation"],
			["05-validation", "deterministic-validation"],
			["06-revision", "screen-revision"],
			["07-validation-after-revision", "deterministic-validation"],
			["08-quality", "quality-review"],
			["09-design-revision", "screen-revision"],
			["10-validation-after-design-revision", "deterministic-validation"],
		]);
		expect(screenGenerationPipelineV1.steps[5]?.runWhen).toEqual({
			contextKey: "validation-report",
			kind: "context-validation-report-has-errors",
		});
		expect(screenGenerationPipelineV1.steps[6]?.output.failWhen).toEqual({
			kind: "validation-report-has-errors",
		});
		// Design loop: quality error findings가 directive로 남을 때만 1회 수정한다.
		expect(screenGenerationPipelineV1.steps[8]?.runWhen).toEqual({
			contextKey: "quality-inspection",
			kind: "context-quality-has-revision-directives",
		});
		expect(screenGenerationPipelineV1.steps[9]?.runWhen).toEqual({
			contextKey: "quality-inspection",
			kind: "context-quality-has-revision-directives",
		});
		expect(screenGenerationPipelineV1.steps[9]?.output.failWhen).toEqual({
			kind: "validation-report-has-errors",
		});
	});

	it("declares task names whose skillsets load implicitly; references carry only extras", () => {
		const claudeSteps = screenGenerationPipelineV1.steps.filter((s) => s.task);
		expect(claudeSteps.map((s) => s.task)).toEqual([
			"screen-intent",
			"composition-planning",
			"screen-generation",
			"screen-revision",
			"quality-review",
			"screen-revision",
		]);
		// No step re-declares its own skillset — runStep injects it from the task name.
		for (const step of screenGenerationPipelineV1.steps) {
			expect(step.references?.skillset).toBeUndefined();
		}

		const layoutCatalog = { source: "layout-catalog", id: undefined };
		const componentCatalog = { source: "component-catalog", id: undefined };
		expect(screenGenerationPipelineV1.steps[1]?.references).toEqual({
			referenceAreaIndex: { source: "reference-area-index" },
			referenceIndex: { source: "reference-screen-index" },
		});
		// Composition gets the layout catalog; render-tree and revision also get the
		// component catalog so claude builds nodes from real layout/component ids.
		expect(screenGenerationPipelineV1.steps[2]?.references).toEqual({
			layoutCatalog,
			referenceAreaCatalog: { source: "reference-area-catalog" },
			referenceCatalog: { source: "reference-screen-catalog" },
		});
		// Render-tree and revision also mount only the reference bodies the
		// composition plan adopted (designTrace.usedReferenceIds) — the design
		// SOT reaches generation without injecting the whole catalog.
		const selectedReferenceMounts = {
			selectedAreaReferences: {
				source: "reference-area-catalog",
				selectFromContext: {
					contextKey: "composition-plan",
					path: ["designTrace", "usedReferenceIds"],
				},
			},
			selectedScreenReferences: {
				source: "reference-screen-catalog",
				selectFromContext: {
					contextKey: "composition-plan",
					path: ["designTrace", "usedReferenceIds"],
				},
			},
		};
		expect(screenGenerationPipelineV1.steps[3]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
			...selectedReferenceMounts,
		});
		expect(screenGenerationPipelineV1.steps[5]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
			...selectedReferenceMounts,
		});
		// Quality review needs only its own skillset (implicit).
		expect(screenGenerationPipelineV1.steps[7]?.references).toBeUndefined();
		// Design revision uses the same knowledge as contract revision.
		expect(screenGenerationPipelineV1.steps[8]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
			...selectedReferenceMounts,
		});
		// Function steps carry no knowledge references.
		expect(screenGenerationPipelineV1.steps[4]?.references).toBeUndefined();
		expect(screenGenerationPipelineV1.steps[6]?.references).toBeUndefined();
		expect(screenGenerationPipelineV1.steps[9]?.references).toBeUndefined();
	});

	it("writes every step output to context under the contract id by default", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(step.output.writeToContext).toBeUndefined();
		}
		// 06-revision overwrites render-tree and 07 overwrites validation-report via the default.
		expect(screenGenerationPipelineV1.steps[5]?.output.contractRef.id).toBe("render-tree");
		expect(screenGenerationPipelineV1.steps[6]?.output.contractRef.id).toBe("validation-report");
	});

	it("passes SourceSpec through to render-tree generation", () => {
		expect(screenGenerationPipelineV1.steps[3]?.inputs).toMatchObject({
			compositionPlan: { kind: "context", key: "composition-plan" },
			screenIntent: { kind: "context", key: "screen-intent" },
			sourceSpec: { kind: "context", key: "source-spec" },
		});
	});

	it("every step output contract resolves", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(() => resolveOutputContractForInference(step.output.contractRef.id)).not.toThrow();
		}
	});
});
