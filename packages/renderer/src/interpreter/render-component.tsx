import type { ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";
import type { RendererRuntime } from "./types";

export function renderComponent({
	node,
	props,
	runtime,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
	runtime: RendererRuntime;
}): ReactNode {
	const component = runtime.resolveComponent({ node, props });
	if (component !== undefined) return component;

	return runtime.onMissingComponent({ node });
}
