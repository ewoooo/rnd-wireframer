import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { collectSourceSpecRefs } from "./source-spec";

/**
 * sourceRef는 plan의 추적 메타데이터일 뿐 RenderTree 정합성이 아니다.
 * 형식 변덕(짧은 ID ↔ JSONPath)으로 완성된 화면을 hard-fail시키지 않도록
 * source-ref-not-materialized와 동일하게 warning이다 (registry에 선언).
 */
export const unknownSourceRefRule = defineRule({
	code: "unknown-source-ref",
	target: "composition-plan",
	requires: ["sourceSpec"],
	check(ctx) {
		if (!ctx.sourceSpec) return;
		const availableRefs = collectSourceSpecRefs(ctx.sourceSpec);
		const sections = Array.isArray(ctx.tree.sections) ? ctx.tree.sections : [];

		sections.forEach((section, sectionIndex) => {
			if (!isRecord(section) || !Array.isArray(section.sourceRefs)) return;
			section.sourceRefs.forEach((sourceRef, sourceRefIndex) => {
				if (typeof sourceRef !== "string" || sourceRef.length === 0) return;
				if (availableRefs.has(sourceRef)) return;
				ctx.report({
					message: `CompositionPlan sourceRef does not exist in SourceSpec: ${sourceRef}.`,
					path: ["sections", sectionIndex, "sourceRefs", sourceRefIndex],
				});
			});
		});
	},
});
