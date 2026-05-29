import { toBoolean, toText } from "../runtime/text";
import { resolveDisplayWhen, resolveProps } from "./bindings";
import type { RenderTreeNode, RenderTreeScreenNode } from "./types";

export interface ResolvedRenderNode {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}

export function getScreenRegions(node: RenderTreeScreenNode) {
	const [headerNode, contentsNode, bottomNode] = node.children;

	return {
		bottomNode,
		contentsNode,
		headerNode,
	};
}

export function resolveRenderNode(
	node: RenderTreeNode,
	data: Record<string, unknown>,
): ResolvedRenderNode | undefined {
	if (!resolveDisplayWhen(node.display?.when, data)) return undefined;

	return {
		node,
		props: resolveProps(node.props, data),
	};
}

export { toBoolean, toText };
