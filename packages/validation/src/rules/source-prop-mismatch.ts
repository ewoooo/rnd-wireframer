import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { collectRenderNodesByMetadataId } from "./helpers";
import { collectSourceComponentsByRenderRef, isPrimitiveSourcePropValue } from "./source-spec";

export const sourcePropMismatchRule = defineRule({
	code: "source-prop-mismatch",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
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
				ctx.report({
					message: `RenderTree changed SourceSpec prop ${sourceRef}.${propName}: expected ${JSON.stringify(sourceValue)}, received ${JSON.stringify(renderValue)}.`,
					path: [...(renderNode.path ?? []), "props", propName],
				});
			}
		}
	},
});
