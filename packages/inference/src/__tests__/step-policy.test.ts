import type { InferenceStepDefinition } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { evaluateStepOutputPolicy, shouldRunInferenceStep } from "../policies/inference-policy";

describe("step policies", () => {
	it("fails output only when the step opts into validation-report failure", () => {
		const step = createStep({ failWhen: { kind: "validation-report-has-errors" } });

		expect(
			evaluateStepOutputPolicy(step, {
				summary: { errorCount: 1 },
			}),
		).toMatchObject({
			code: "deterministic_validation_failed",
		});
		expect(evaluateStepOutputPolicy(createStep(), { summary: { errorCount: 1 } })).toBeUndefined();
		expect(evaluateStepOutputPolicy(step, { summary: { errorCount: 0 } })).toBeUndefined();
	});

	it("runs conditional steps only when the referenced validation report has errors", async () => {
		await expect(
			shouldRunInferenceStep(
				{ contextKey: "validation-report", kind: "context-validation-report-has-errors" },
				{ readJson: async <T>() => ({ summary: { errorCount: 1 } }) as T },
			),
		).resolves.toBe(true);
		await expect(
			shouldRunInferenceStep(
				{ contextKey: "validation-report", kind: "context-validation-report-has-errors" },
				{ readJson: async <T>() => ({ summary: { errorCount: 0 } }) as T },
			),
		).resolves.toBe(false);
		await expect(
			shouldRunInferenceStep(undefined, {
				readJson: async () => {
					throw new Error("should not read context");
				},
			}),
		).resolves.toBe(true);
	});

	it("runs design revision only when quality inspection carries revision directives", async () => {
		const condition = {
			contextKey: "quality-inspection",
			kind: "context-quality-has-revision-directives",
		} as const;
		await expect(
			shouldRunInferenceStep(condition, {
				readJson: async <T>() =>
					({
						revisionDirectives: [
							{
								findingCode: "density-overload",
								action: "change-structure",
								path: ["children", 0],
								mustPreserveSourceRefs: ["CB-1", "CB-2"],
								suggestedChange: "Split the agreement stack into its own section.",
							},
						],
					}) as T,
			}),
		).resolves.toBe(true);
		await expect(
			shouldRunInferenceStep(condition, {
				readJson: async <T>() => ({ revisionDirectives: [] }) as T,
			}),
		).resolves.toBe(false);
		await expect(
			shouldRunInferenceStep(condition, {
				readJson: async <T>() => ({ summary: { errorCount: 2 } }) as T,
			}),
		).resolves.toBe(false);
	});
});

function createStep(
	output: Partial<InferenceStepDefinition["output"]> = {},
): InferenceStepDefinition {
	return {
		id: "validate",
		output: {
			contractRef: { id: "validation-report", source: "output-contract" },
			...output,
		},
		run: { id: "deterministic-validation" },
	};
}
