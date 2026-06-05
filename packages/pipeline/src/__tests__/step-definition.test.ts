import {
	createPipelineExecutionState,
	definePipeline,
	defineStep,
	from,
	resolveStepInputs,
	StepInputResolutionError,
	value,
} from "@cx/pipeline/definition";
import type { OutputContract, StepPipelineDefinition } from "@cx/pipeline/types";
import { describe, expect, it } from "vitest";

const OUTPUT_CONTRACT = {
	artifactKind: "test-artifact",
	schemaVersion: "test-artifact.v0.1",
} satisfies OutputContract;

describe("pipeline step definition helpers", () => {
	it("expresses the current screen inference order as Step definitions without executing it", () => {
		const pipeline = definePipeline({
			id: "screen-inference",
			steps: [
				defineStep({
					execute: () => ({ content: "# Source" }),
					id: "read-source",
					inputs: { source: from("input.source") },
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ sourceSpec: {} }),
					id: "parse-source",
					inputs: { sourceFile: from("step.read-source") },
					usesAI: false,
				}),
				defineStep({
					id: "derive-screen-intent",
					inputs: { sourceSpec: from("step.parse-source.sourceSpec") },
					output: OUTPUT_CONTRACT,
					prompt: { id: "screen-intent" },
					usesAI: true,
				}),
				defineStep({
					id: "plan-composition",
					inputs: {
						layoutCatalogs: from("ref.layoutCatalogs"),
						screenIntent: from("step.derive-screen-intent"),
						skillBundles: from("ref.skillBundles"),
						sourceSpec: from("step.parse-source.sourceSpec"),
					},
					output: OUTPUT_CONTRACT,
					prompt: { id: "composition-planning" },
					usesAI: true,
				}),
				defineStep({
					execute: () => ({ decorationPlan: {}, layerCandidates: [] }),
					id: "derive-decoration-plan",
					inputs: {
						compositionPlan: from("step.plan-composition"),
						layoutCatalogs: from("ref.layoutCatalogs"),
						sourceSpec: from("step.parse-source.sourceSpec"),
					},
					usesAI: false,
				}),
				defineStep({
					id: "select-pattern",
					inputs: {
						decorationPlan: from("step.derive-decoration-plan.decorationPlan"),
						designContextBundles: from("ref.designContextBundles"),
						designSkillSelection: from("step.plan-composition.designSkillSelection"),
						layerCandidates: from("step.derive-decoration-plan.layerCandidates"),
						sourceSpec: from("step.parse-source.sourceSpec"),
					},
					output: OUTPUT_CONTRACT,
					prompt: { id: "pattern-selection" },
					usesAI: true,
				}),
				defineStep({
					id: "generate-render-tree",
					inputs: {
						componentCatalogs: from("ref.componentCatalogs"),
						compositionPlan: from("step.plan-composition"),
						designContextBundles: from("ref.designContextBundles"),
						layerCandidates: from("step.derive-decoration-plan.layerCandidates"),
						patternSelection: from("step.select-pattern"),
						skillBundles: from("ref.skillBundles"),
						sourceSpec: from("step.parse-source.sourceSpec"),
					},
					output: OUTPUT_CONTRACT,
					prompt: { id: "screen-generation" },
					usesAI: true,
				}),
				defineStep({
					execute: () => ({ ok: true }),
					id: "validate-render-tree",
					inputs: {
						schema: value(OUTPUT_CONTRACT),
						target: from("step.generate-render-tree"),
					},
					output: OUTPUT_CONTRACT,
					usesAI: false,
				}),
				defineStep({
					id: "propose-components",
					inputs: {
						candidate: from("step.generate-render-tree"),
						componentCatalogs: from("ref.componentCatalogs"),
						sourceSpec: from("step.parse-source.sourceSpec"),
					},
					output: OUTPUT_CONTRACT,
					prompt: { id: "component-proposal" },
					usesAI: true,
				}),
				defineStep({
					id: "review-quality",
					inputs: {
						candidate: from("step.generate-render-tree"),
						componentProposal: from("step.propose-components"),
						validationReport: from("step.validate-render-tree"),
					},
					output: OUTPUT_CONTRACT,
					prompt: { id: "quality-review" },
					usesAI: true,
				}),
				defineStep({
					id: "revise-render-tree-if-invalid",
					inputs: {
						previousCandidate: from("step.generate-render-tree"),
						qualityInspection: from("step.review-quality"),
						validationReport: from("step.validate-render-tree"),
					},
					output: OUTPUT_CONTRACT,
					prompt: { id: "screen-revision" },
					usesAI: true,
				}),
				defineStep({
					execute: () => ({ ok: true }),
					id: "validate-render-tree-after-revision",
					inputs: {
						schema: value(OUTPUT_CONTRACT),
						target: from("step.revise-render-tree-if-invalid"),
					},
					output: OUTPUT_CONTRACT,
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ finalResult: {} }),
					id: "write-artifacts",
					inputs: {
						finalCandidate: from("step.revise-render-tree-if-invalid"),
						finalValidation: from("step.validate-render-tree-after-revision"),
					},
					usesAI: false,
				}),
			],
		}) satisfies StepPipelineDefinition;

		expect(pipeline.steps.map((step) => step.id)).toEqual([
			"read-source",
			"parse-source",
			"derive-screen-intent",
			"plan-composition",
			"derive-decoration-plan",
			"select-pattern",
			"generate-render-tree",
			"validate-render-tree",
			"propose-components",
			"review-quality",
			"revise-render-tree-if-invalid",
			"validate-render-tree-after-revision",
			"write-artifacts",
		]);
		expect(pipeline.steps.find((step) => step.id === "generate-render-tree")).toMatchObject({
			usesAI: true,
		});
	});
});

describe("pipeline step input resolver", () => {
	it("resolves input, ref, step, nested step, and literal values", () => {
		const source = { path: "source.md" };
		const layoutCatalogs = { screen: { id: "layout.screen.sample" } };
		const schema = { schemaVersion: "sample.v0.1" };
		const state = createPipelineExecutionState({
			input: { source },
			refs: { layoutCatalogs },
			steps: {
				"derive-decoration-plan": {
					output: {
						decorationPlan: { rhythm: "compact" },
						layerCandidates: [{ layout: "layout.area.sample" }],
					},
					status: "completed",
				},
				"parse-source": {
					output: { sourceSpec: { screenCode: "NOVA" } },
					status: "completed",
				},
			},
		});

		expect(
			resolveStepInputs(
				{
					layerCandidates: from("step.derive-decoration-plan.layerCandidates"),
					layoutCatalogs: from("ref.layoutCatalogs"),
					schema: value(schema),
					source: from("input.source"),
					sourceSpec: from("step.parse-source.sourceSpec"),
				},
				state,
			),
		).toEqual({
			layerCandidates: [{ layout: "layout.area.sample" }],
			layoutCatalogs,
			schema,
			source,
			sourceSpec: { screenCode: "NOVA" },
		});
	});

	it("throws a distinct missing-ref error for unresolved Step inputs", () => {
		const state = createPipelineExecutionState({
			steps: {
				"parse-source": {
					output: {},
					status: "completed",
				},
			},
		});

		expect(() =>
			resolveStepInputs({ sourceSpec: from("step.parse-source.sourceSpec") }, state),
		).toThrow(StepInputResolutionError);
		expect(() =>
			resolveStepInputs({ sourceSpec: from("step.parse-source.sourceSpec") }, state),
		).toThrow("Pipeline step input reference is missing: step.parse-source.sourceSpec");
	});
});
