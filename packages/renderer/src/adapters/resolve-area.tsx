import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
import type { ReactNode } from "react";
import { renderDynamicAreaNode, renderStaticAreaNode } from "../nodes/area";
import type { RenderTreeNode } from "../tree/types";

export function resolveArea({
	data,
	node,
	props,
	renderChildren,
}: {
	data: Record<string, unknown>;
	node: RenderTreeNode;
	props: Record<string, unknown>;
	renderChildren: () => ReactNode;
}): ReactNode | undefined {
	if (node.type === RENDER_TREE_NODE_TYPE.areaStatic) {
		return renderStaticAreaNode({
			node,
			props,
			renderChildren,
		});
	}

	if (node.type === RENDER_TREE_NODE_TYPE.areaDynamic) {
		return renderDynamicAreaNode({
			data,
			node,
			props,
			renderChildren,
		});
	}

	return undefined;
}
