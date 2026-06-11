import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import {
	collectMaterializationSourceRefs,
	collectSourceRefLabelIndex,
	refIsMaterialized,
} from "./source-spec";

export const sourceRefNotMaterializedRule = defineRule({
	code: "source-ref-not-materialized",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		if (!ctx.sourceSpec) return;
		const generatedText = JSON.stringify(ctx.artifact);
		const labelIndex = collectSourceRefLabelIndex(ctx.sourceSpec);
		const sourceRefs = collectMaterializationSourceRefs(ctx.sourceSpec);

		sourceRefs.forEach((sourceRef) => {
			if (refIsMaterialized(sourceRef, generatedText, labelIndex)) return;
			ctx.report({
				message: `SourceSpec ref is not visible in generated artifact: ${sourceRef}.`,
				path: [],
			});
		});
	},
});

/** 같은 코드의 composition-plan 측 변형: plan의 section sourceRefs가 산출물에 보이는지 검사한다. */
export const compositionPlanSourceRefNotMaterializedRule = defineRule({
	code: "source-ref-not-materialized",
	target: "composition-plan",
	requires: ["generatedArtifact"],
	check(ctx) {
		const generatedText = JSON.stringify(ctx.artifact);
		const labelIndex = ctx.sourceSpec
			? collectSourceRefLabelIndex(ctx.sourceSpec)
			: new Map<string, string[]>();
		const sections = Array.isArray(ctx.tree.sections) ? ctx.tree.sections : [];

		sections.forEach((section, sectionIndex) => {
			if (!isRecord(section) || !Array.isArray(section.sourceRefs)) return;
			section.sourceRefs.forEach((sourceRef, sourceRefIndex) => {
				if (typeof sourceRef !== "string" || sourceRef.length === 0) return;
				if (refIsMaterialized(sourceRef, generatedText, labelIndex)) return;
				ctx.report({
					message: `CompositionPlan sourceRef is not visible in generated artifact: ${sourceRef}.`,
					path: ["sections", sectionIndex, "sourceRefs", sourceRefIndex],
				});
			});
		});
	},
});
