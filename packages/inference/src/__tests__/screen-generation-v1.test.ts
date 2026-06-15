import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

describe("screenGenerationPipelineV1", () => {
	it("declares ordered validation and one-shot revision steps", () => {
		expect(screenGenerationPipelineV1.id).toBe("screen-generation");
		expect(screenGenerationPipelineV1.version).toBe("v1");
		// 02는 screen-intent + composition-planning 통합 step. 03은 결번으로 남긴다.
		expect(screenGenerationPipelineV1.steps.map((s) => [s.id, s.task ?? s.run?.id])).toEqual([
			["01-source-spec", "source-spec-mvp"],
			["02-intent-composition", "intent-composition"],
			["04-render-tree", "screen-generation"],
			["05-validation", "deterministic-validation"],
			["06-revision", "screen-revision"],
			["07-validation-after-revision", "deterministic-validation"],
			["08-quality", "quality-review"],
			["09-design-revision", "screen-revision"],
			["10-validation-after-design-revision", "deterministic-validation"],
			["11-component-proposal", "component-proposal"],
		]);
		expect(screenGenerationPipelineV1.steps[4]?.runWhen).toEqual({
			contextKey: "validation-report",
			kind: "context-validation-report-has-errors",
		});
		expect(screenGenerationPipelineV1.steps[5]?.output.failWhen).toEqual({
			kind: "validation-report-has-errors",
		});
		// Design loop: quality error findings가 directive로 남을 때만 1회 수정한다.
		expect(screenGenerationPipelineV1.steps[7]?.runWhen).toEqual({
			contextKey: "quality-inspection",
			kind: "context-quality-has-revision-directives",
		});
		expect(screenGenerationPipelineV1.steps[8]?.runWhen).toEqual({
			contextKey: "quality-inspection",
			kind: "context-quality-has-revision-directives",
		});
		expect(screenGenerationPipelineV1.steps[8]?.output.failWhen).toEqual({
			kind: "validation-report-has-errors",
		});
		// Component proposal은 side artifact — 실패해도 잡은 성공하고, 잡이
		// succeeded로 기록된 뒤 background로 돈다.
		expect(screenGenerationPipelineV1.steps[9]?.optional).toBe(true);
		expect(screenGenerationPipelineV1.steps[9]?.background).toBe(true);
		for (const step of screenGenerationPipelineV1.steps.slice(0, 9)) {
			expect(step.optional).toBeUndefined();
		}
	});

	it("declares task names whose skillsets load implicitly; references carry only extras", () => {
		const claudeSteps = screenGenerationPipelineV1.steps.filter((s) => s.task);
		expect(claudeSteps.map((s) => s.task)).toEqual([
			"intent-composition",
			"screen-generation",
			"screen-revision",
			"quality-review",
			"screen-revision",
			"component-proposal",
		]);
		// No step re-declares its own skillset — runStep injects it from the task name.
		for (const step of screenGenerationPipelineV1.steps) {
			expect(step.references?.skillset).toBeUndefined();
		}

		const layoutCatalog = { source: "layout-catalog", id: undefined };
		const componentCatalog = { source: "component-catalog", id: undefined };
		// 통합 step이 layout catalog와 reference catalog를 받는다. intent 선확정 →
		// catalog 참조 순서는 prompt 계약이 강제한다.
		expect(screenGenerationPipelineV1.steps[1]?.references).toEqual({
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
		expect(screenGenerationPipelineV1.steps[2]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
			...selectedReferenceMounts,
		});
		expect(screenGenerationPipelineV1.steps[4]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
			...selectedReferenceMounts,
		});
		// Quality review needs only its own skillset (implicit).
		expect(screenGenerationPipelineV1.steps[6]?.references).toBeUndefined();
		// Design revision uses the same knowledge as contract revision.
		expect(screenGenerationPipelineV1.steps[7]?.references).toEqual({
			componentCatalog,
			layoutCatalog,
			...selectedReferenceMounts,
		});
		// Component proposal은 nearest match 근거로 component catalog만 본다.
		expect(screenGenerationPipelineV1.steps[9]?.references).toEqual({ componentCatalog });
		// Function steps carry no knowledge references.
		expect(screenGenerationPipelineV1.steps[3]?.references).toBeUndefined();
		expect(screenGenerationPipelineV1.steps[5]?.references).toBeUndefined();
		expect(screenGenerationPipelineV1.steps[8]?.references).toBeUndefined();
	});

	it("writes every step output to context under the contract id by default", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			if (step.id === "02-intent-composition") continue;
			expect(step.output.writeToContext).toBeUndefined();
			expect(step.output.spread).toBeUndefined();
		}
		// 02는 통합 출력을 기존 context 키 2개로 펼치고 자체 키는 만들지 않는다 —
		// 하류 step의 contexts("screen-intent", "composition-plan") 읽기가 그대로 동작한다.
		expect(screenGenerationPipelineV1.steps[1]?.output.writeToContext).toBe(false);
		expect(screenGenerationPipelineV1.steps[1]?.output.spread).toEqual({
			screenIntent: "screen-intent",
			compositionPlan: "composition-plan",
		});
		// 06-revision overwrites render-tree and 07 overwrites validation-report via the default.
		expect(screenGenerationPipelineV1.steps[4]?.output.contractRef.id).toBe("render-tree");
		expect(screenGenerationPipelineV1.steps[5]?.output.contractRef.id).toBe("validation-report");
	});

	it("passes SourceSpec through to render-tree generation", () => {
		expect(screenGenerationPipelineV1.steps[2]?.inputs).toMatchObject({
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
