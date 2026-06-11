import {
	contexts,
	definePipeline,
	defineStep,
	failOnValidationReportErrors,
	jobInput,
	knowledge,
	onQualityRevisionDirectives,
	onValidationReportErrors,
	outputContractRef,
	referenceCatalog,
	referenceIndex,
	referenceSelection,
} from "../pipeline";

/**
 * 03-composition이 designTrace.usedReferenceIds에 채택한 디자인 SOT reference만
 * 골라 body째로 04/06에 마운트한다. 전체 catalog 주입은 03까지만 — 생성/수정
 * 단계는 채택된 정답지 구조 규칙을 직접 보고 작업한다.
 */
const selectedReferenceMounts = {
	selectedScreenReferences: referenceSelection("screen", "composition-plan", [
		"designTrace",
		"usedReferenceIds",
	]),
	selectedAreaReferences: referenceSelection("area", "composition-plan", [
		"designTrace",
		"usedReferenceIds",
	]),
};

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
			references: {
				referenceIndex: referenceIndex("screen"),
				referenceAreaIndex: referenceIndex("area"),
			},
			output: { contractRef: outputContractRef("screen-intent") },
		}),
		defineStep({
			id: "03-composition",
			task: "composition-planning",
			inputs: contexts("source-spec", "screen-intent"),
			references: {
				layoutCatalog: knowledge("layout-catalog"),
				referenceCatalog: referenceCatalog("screen"),
				referenceAreaCatalog: referenceCatalog("area"),
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
				...selectedReferenceMounts,
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
				...selectedReferenceMounts,
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
			inputs: contexts(
				"composition-plan",
				"render-tree",
				"validation-report",
				"screen-intent",
				"source-spec",
			),
			output: { contractRef: outputContractRef("quality-inspection") },
		}),
		// Design loop: schema는 통과했지만 디자인 품질 error가 directive로 남으면
		// 1회 한정으로 구조를 개선한다. SourceSpec 보존은 10의 deterministic
		// 재검증이 기계적으로 보장한다(source-ref-not-materialized 등).
		defineStep({
			id: "09-design-revision",
			task: "screen-revision",
			inputs: contexts(
				"composition-plan",
				"render-tree",
				"screen-intent",
				"source-spec",
				"quality-inspection",
			),
			references: {
				componentCatalog: knowledge("component-catalog"),
				layoutCatalog: knowledge("layout-catalog"),
				...selectedReferenceMounts,
			},
			runWhen: onQualityRevisionDirectives("quality-inspection"),
			output: { contractRef: outputContractRef("render-tree") },
		}),
		defineStep({
			id: "10-validation-after-design-revision",
			run: { id: "deterministic-validation" },
			inputs: contexts("composition-plan", "render-tree", "screen-intent", "source-spec"),
			runWhen: onQualityRevisionDirectives("quality-inspection"),
			output: {
				contractRef: outputContractRef("validation-report"),
				failWhen: failOnValidationReportErrors,
			},
		}),
	],
});
