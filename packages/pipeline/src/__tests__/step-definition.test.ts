import {
	createPipelineExecutionState,
	definePipeline,
	defineStep,
	from,
	refInput,
	resolveStepInputs,
	StepInputResolutionError,
	stepOutput,
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
					inputs: { sourceFile: stepOutput("read-source", "result") },
					usesAI: false,
				}),
				defineStep({
					id: "derive-screen-intent",
					inputs: { source: stepOutput("parse-source", "result") },
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "screen-intent" },
					usesAI: true,
				}),
				defineStep({
					id: "plan-composition",
					inputs: {
						intent: stepOutput("derive-screen-intent", "result"),
						layoutCatalogs: refInput("layoutCatalogs"),
						skillBundles: refInput("skillBundles"),
						source: stepOutput("parse-source", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "composition-planning" },
					usesAI: true,
				}),
				defineStep({
					execute: () => ({ decorationPlan: {}, layerCandidates: [] }),
					id: "derive-decoration-plan",
					inputs: {
						composition: stepOutput("plan-composition", "result"),
						layoutCatalogs: refInput("layoutCatalogs"),
						source: stepOutput("parse-source", "result"),
					},
					usesAI: false,
				}),
				defineStep({
					id: "select-pattern",
					inputs: {
						composition: stepOutput("plan-composition", "result"),
						decoration: stepOutput("derive-decoration-plan", "result"),
						designContextBundles: refInput("designContextBundles"),
						layoutCatalogs: refInput("layoutCatalogs"),
						source: stepOutput("parse-source", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "pattern-selection" },
					usesAI: true,
				}),
				defineStep({
					id: "generate-render-tree",
					inputs: {
						componentCatalogs: refInput("componentCatalogs"),
						composition: stepOutput("plan-composition", "result"),
						decoration: stepOutput("derive-decoration-plan", "result"),
						designContextBundles: refInput("designContextBundles"),
						intent: stepOutput("derive-screen-intent", "result"),
						pattern: stepOutput("select-pattern", "result"),
						skillBundles: refInput("skillBundles"),
						source: stepOutput("parse-source", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "screen-generation" },
					usesAI: true,
				}),
				defineStep({
					execute: () => ({ ok: true }),
					id: "validate-render-tree",
					inputs: {
						schema: value(OUTPUT_CONTRACT),
						target: stepOutput("generate-render-tree", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					usesAI: false,
				}),
				defineStep({
					id: "propose-components",
					inputs: {
						candidate: stepOutput("generate-render-tree", "result"),
						componentCatalogs: refInput("componentCatalogs"),
						source: stepOutput("parse-source", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "component-proposal" },
					usesAI: true,
				}),
				defineStep({
					id: "review-quality",
					inputs: {
						candidate: stepOutput("generate-render-tree", "result"),
						componentProposal: stepOutput("propose-components", "result"),
						validation: stepOutput("validate-render-tree", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "quality-review" },
					usesAI: true,
				}),
				defineStep({
					id: "revise-render-tree-if-invalid",
					inputs: {
						generation: stepOutput("generate-render-tree", "result"),
						quality: stepOutput("review-quality", "result"),
						validation: stepOutput("validate-render-tree", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					prompt: { id: "screen-revision" },
					usesAI: true,
				}),
				defineStep({
					execute: () => ({ ok: true }),
					id: "validate-render-tree-after-revision",
					inputs: {
						schema: value(OUTPUT_CONTRACT),
						target: stepOutput("revise-render-tree-if-invalid", "result"),
					},
					output: { result: OUTPUT_CONTRACT },
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ finalResult: {} }),
					id: "write-artifacts",
					inputs: {
						finalCandidate: stepOutput("revise-render-tree-if-invalid", "result"),
						finalValidation: stepOutput("validate-render-tree-after-revision", "result"),
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
					outputs: {
						result: {
							decorationPlan: { rhythm: "compact" },
							layerCandidates: [{ layout: "layout.area.sample" }],
						},
					},
					status: "completed",
				},
				"parse-source": {
					output: { sourceSpec: { screenCode: "NOVA" } },
					outputs: { result: { sourceSpec: { screenCode: "NOVA" } } },
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
					sourceStepResult: stepOutput("parse-source", "result"),
				},
				state,
			),
		).toEqual({
			layerCandidates: [{ layout: "layout.area.sample" }],
			layoutCatalogs,
			schema,
			source,
			sourceSpec: { screenCode: "NOVA" },
			sourceStepResult: { sourceSpec: { screenCode: "NOVA" } },
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
