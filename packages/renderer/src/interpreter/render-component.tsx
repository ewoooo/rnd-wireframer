import type { ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";
import type { RendererRuntime } from "./types";

export function renderComponent({
	node,
	props,
	renderNode,
	runtime,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
	renderNode?: (node: RenderTreeNode) => ReactNode;
	runtime: RendererRuntime;
}): ReactNode {
	const component = runtime.resolveComponent({ node, props, renderNode });
	if (component !== undefined) return component;

	return runtime.onMissingComponent({ node });
}
