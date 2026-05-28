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
	if (node.type === "area.static") {
		return renderStaticAreaNode({
			node,
			props,
			renderChildren,
		});
	}

	if (node.type === "area.dynamic") {
		return renderDynamicAreaNode({
			data,
			node,
			props,
			renderChildren,
		});
	}

	return undefined;
}
