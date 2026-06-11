import {
	contexts,
	definePipeline,
	defineStep,
	failOnValidationReportErrors,
	jobInput,
	knowledge,
	onValidationReportErrors,
	outputContractRef,
	referenceCatalog,
	referenceIndex,
} from "../pipeline";

/**
 * screen-generation@v1 — declarative only.
 * A step's `task` names both the claude work and the skillset it auto-loads
 * (docs/skills/skillsets/{task}.md). `output.contractRef` is the @cx/schema id;
 * the step output lands in context under the contract id unless overridden.
 */
export const screenGenerationPipelineV1 = definePipeline({
	id: "screen-generation",
	version: "v1",
	steps: [
		defineStep({
			id: "01-source-spec",
			run: { id: "source-spec-mvp" },
			inputs: { job: jobInput() },
			output: { contractRef: outputContractRef("source-spec") },
		}),
		defineStep({
			id: "02-screen-intent",
			task: "screen-intent",
			inputs: contexts("source-spec"),
			references: { referenceIndex: referenceIndex("screen") },
			output: { contractRef: outputContractRef("screen-intent") },
		}),
		defineStep({
			id: "03-composition",
			task: "composition-planning",
			inputs: contexts("source-spec", "screen-intent"),
			references: {
				layoutCatalog: knowledge("layout-catalog"),
				referenceCatalog: referenceCatalog("screen"),
			},
			output: { contractRef: outputContractRef("composition-plan") },
		}),
		defineStep({
			id: "04-render-tree",
			task: "screen-generation",
			inputs: contexts("source-spec", "composition-plan", "screen-intent"),
			references: {
				componentCatalog: knowledge("component-catalog"),
				layoutCatalog: knowledge("layout-catalog"),
			},
			output: { contractRef: outputContractRef("render-tree") },
		}),
		defineStep({
			id: "05-validation",
			run: { id: "deterministic-validation" },
			inputs: contexts("composition-plan", "render-tree", "screen-intent", "source-spec"),
			output: { contractRef: outputContractRef("validation-report") },
		}),
		defineStep({
			id: "06-revision",
			task: "screen-revision",
			inputs: contexts(
				"composition-plan",
				"render-tree",
				"screen-intent",
				"source-spec",
				"validation-report",
			),
			references: {
				componentCatalog: knowledge("component-catalog"),
				layoutCatalog: knowledge("layout-catalog"),
			},
			runWhen: onValidationReportErrors("validation-report"),
			output: {
				contractRef: outputContractRef("render-tree"),
			},
		}),
		defineStep({
			id: "07-validation-after-revision",
			run: { id: "deterministic-validation" },
			inputs: contexts("composition-plan", "render-tree", "screen-intent", "source-spec"),
			runWhen: onValidationReportErrors("validation-report"),
			output: {
				contractRef: outputContractRef("validation-report"),
				failWhen: failOnValidationReportErrors,
			},
		}),
		defineStep({
			id: "08-quality",
			task: "quality-review",
			inputs: contexts("composition-plan", "render-tree", "validation-report"),
			output: { contractRef: outputContractRef("quality-inspection") },
		}),
	],
});
