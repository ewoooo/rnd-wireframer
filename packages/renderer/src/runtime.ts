import type { RenderTreeNodeKind } from "@cx/types/component-catalog";
import { resolveDisplayWhen, resolveProps } from "./bindings";
import { createRendererKindMap } from "./renderer-kind-contract";
import type { RenderTreeNode, RenderTreeScreenNode } from "./schema";

export type { RenderTreeNodeKind };

export interface RenderableTreeNode {
	kind: RenderTreeNodeKind;
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

export function getRenderableTreeNode(
	node: RenderTreeNode,
	data: Record<string, unknown>,
): RenderableTreeNode | undefined {
	if (!resolveDisplayWhen(node.display?.when, data)) return undefined;

	return {
		kind: getRenderTreeNodeKind(node),
		node,
		props: resolveProps(node.props, data),
	};
}

export function toText(value: unknown, fallback = "") {
	if (value === undefined || value === null) return fallback;
	return String(value);
}

export function toBoolean(value: unknown, fallback = false) {
	if (value === undefined || value === null) return fallback;
	return Boolean(value);
}

const kindByType = createRendererKindMap();

export function getRenderTreeNodeKind(node: RenderTreeNode): RenderTreeNodeKind {
	return kindByType.get(node.type) ?? "fallback";
}
