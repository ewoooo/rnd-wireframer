import { isRecord } from "@cx/schema";
import { defineRule, type RuleContext } from "./define-rule";
import { collectRenderNodesByMetadataId } from "./helpers";
import { collectSourceComponentsByRenderRef, isPrimitiveSourcePropValue } from "./source-spec";

/**
 * SourceSpec prop과 RenderTree prop의 원시 값 mismatch를 순회하며 콜백에 넘긴다.
 * source-prop-mismatch(비텍스트, error)와 source-text-reworded(문구, warning)가
 * 같은 순회를 공유한다 — 분류 기준은 "소스 값이 string인가" 하나뿐이다.
 */
export function forEachSourcePropMismatch(
	ctx: RuleContext,
	report: (mismatch: {
		sourceRef: string;
		propName: string;
		sourceValue: unknown;
		renderValue: unknown;
		path: ReadonlyArray<string | number>;
	}) => void,
): void {
	if (!ctx.sourceSpec) return;
	const sourceComponents = collectSourceComponentsByRenderRef(ctx.sourceSpec);
	if (sourceComponents.size === 0) return;
	const renderNodes = collectRenderNodesByMetadataId(ctx.artifact);

	for (const [sourceRef, component] of sourceComponents) {
		const renderNode = renderNodes.get(sourceRef);
		if (!renderNode || !isRecord(renderNode.props) || !isRecord(component.props)) continue;
		for (const [propName, sourceValue] of Object.entries(component.props)) {
			if (!isPrimitiveSourcePropValue(sourceValue)) continue;
			if (!(propName in renderNode.props)) continue;
			const renderValue = renderNode.props[propName];
			if (!isPrimitiveSourcePropValue(renderValue)) continue;
			if (renderValue === sourceValue) continue;
			report({
				sourceRef,
				propName,
				sourceValue,
				renderValue,
				path: [...(renderNode.path ?? []), "props", propName],
			});
		}
	}
}

export const sourcePropMismatchRule = defineRule({
	code: "source-prop-mismatch",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		forEachSourcePropMismatch(ctx, (mismatch) => {
			// 문구(string) 리워딩은 source-text-reworded(warning)의 영역이다.
			if (typeof mismatch.sourceValue === "string") return;
			ctx.report({
				message: `RenderTree changed SourceSpec prop ${mismatch.sourceRef}.${mismatch.propName}: expected ${JSON.stringify(mismatch.sourceValue)}, received ${JSON.stringify(mismatch.renderValue)}.`,
				path: [...mismatch.path],
			});
		});
	},
});
