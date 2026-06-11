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
