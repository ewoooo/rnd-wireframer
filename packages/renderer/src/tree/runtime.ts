import { createNodeKindMap } from "../registry/node-kind-map";
import { resolveDisplayWhen, resolveProps } from "./bindings";
import type { RenderTreeNode, RenderTreeNodeKind, RenderTreeScreenNode } from "./types";

export type { RenderTreeNodeKind };

export interface ResolvedRenderNode {
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

export function resolveRenderNode(
	node: RenderTreeNode,
	data: Record<string, unknown>,
): ResolvedRenderNode | undefined {
	if (!resolveDisplayWhen(node.display?.when, data)) return undefined;

	return {
		kind: resolveNodeKind(node),
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

const kindByType = createNodeKindMap();

export function resolveNodeKind(node: RenderTreeNode): RenderTreeNodeKind {
	return kindByType.get(node.type) ?? "fallback";
}
