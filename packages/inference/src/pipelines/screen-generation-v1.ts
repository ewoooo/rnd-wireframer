import { context, definePipeline, defineStep, jobInput, outputContractRef } from "../pipeline";

/**
 * screen-generation@v1 — declarative only.
 * prompt.id is the @cx/agent AgentTaskKind; output.contractRef is the @cx/schema id.
 * claude steps carry no references: @cx/agent's task definitions own prompts/skills.
 */
export const screenGenerationPipelineV1 = definePipeline({
	id: "screen-generation",
	version: "v1",
	steps: [
		defineStep({
			id: "01-source-spec",
			engine: "function",
			inputs: { job: jobInput() },
			run: { id: "source-spec-mvp" },
			output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
		}),
		defineStep({
			id: "02-screen-intent",
			engine: "claude",
			inputs: { sourceSpec: context("source-spec") },
			prompt: { id: "screen-intent" },
			output: { contractRef: outputContractRef("screen-intent"), writeToContext: "screen-intent" },
		}),
		defineStep({
			id: "03-composition",
			engine: "claude",
			inputs: { sourceSpec: context("source-spec"), screenIntent: context("screen-intent") },
			prompt: { id: "composition-planning" },
			output: {
				contractRef: outputContractRef("composition-plan"),
				writeToContext: "composition-plan",
			},
		}),
		defineStep({
			id: "04-render-tree",
			engine: "claude",
			inputs: {
				compositionPlan: context("composition-plan"),
				screenIntent: context("screen-intent"),
			},
			prompt: { id: "screen-generation" },
			output: { contractRef: outputContractRef("render-tree"), writeToContext: "render-tree" },
		}),
		defineStep({
			id: "05-validation",
			engine: "function",
			inputs: {
				compositionPlan: context("composition-plan"),
				renderTree: context("render-tree"),
				screenIntent: context("screen-intent"),
				sourceSpec: context("source-spec"),
			},
			run: { id: "deterministic-validation" },
			output: {
				contractRef: outputContractRef("validation-report"),
				writeToContext: "validation-report",
			},
		}),
		defineStep({
			id: "06-revision",
			engine: "claude",
			inputs: {
				compositionPlan: context("composition-plan"),
				renderTree: context("render-tree"),
				screenIntent: context("screen-intent"),
				sourceSpec: context("source-spec"),
				validationReport: context("validation-report"),
			},
			prompt: { id: "screen-revision" },
			runWhen: { contextValidationReportHasErrors: "validation-report" },
			output: { contractRef: outputContractRef("render-tree"), writeToContext: "render-tree" },
		}),
		defineStep({
			id: "07-validation-after-revision",
			engine: "function",
			inputs: {
				compositionPlan: context("composition-plan"),
				renderTree: context("render-tree"),
				screenIntent: context("screen-intent"),
				sourceSpec: context("source-spec"),
			},
			run: { id: "deterministic-validation" },
			runWhen: { contextValidationReportHasErrors: "validation-report" },
			output: {
				contractRef: outputContractRef("validation-report"),
				failJobWhenValidationReportHasErrors: true,
				writeToContext: "validation-report",
			},
		}),
		defineStep({
			id: "08-quality",
			engine: "claude",
			inputs: {
				compositionPlan: context("composition-plan"),
				renderTree: context("render-tree"),
				validationReport: context("validation-report"),
			},
			prompt: { id: "quality-review" },
			output: {
				contractRef: outputContractRef("quality-inspection"),
				writeToContext: "quality-inspection",
			},
		}),
	],
});
