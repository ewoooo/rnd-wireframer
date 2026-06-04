import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
import { toBoolean, toText } from "../runtime/text";
import { resolveDisplayWhen, resolveProps } from "./bindings";
import type { RenderTreeNode, RenderTreeScreenNode } from "./types";

export interface ResolvedRenderNode {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}

export function getScreenRegions(node: RenderTreeScreenNode) {
	const children = Array.isArray(node.children) ? node.children : [];
	const screenRegionTypeBySlot = {
		bottomNode: RENDER_TREE_NODE_TYPE.screenBottom,
		contentsNode: RENDER_TREE_NODE_TYPE.screenContents,
		headerNode: RENDER_TREE_NODE_TYPE.screenHeader,
	} as const;

	return {
		bottomNode:
			children.find((child) => child.type === screenRegionTypeBySlot.bottomNode) ??
			createEmptyScreenRegionNode(node, screenRegionTypeBySlot.bottomNode),
		contentsNode:
			children.find((child) => child.type === screenRegionTypeBySlot.contentsNode) ??
			createEmptyScreenRegionNode(node, screenRegionTypeBySlot.contentsNode),
		headerNode:
			children.find((child) => child.type === screenRegionTypeBySlot.headerNode) ??
			createEmptyScreenRegionNode(node, screenRegionTypeBySlot.headerNode),
	};
}

function createEmptyScreenRegionNode(
	node: RenderTreeScreenNode,
	type:
		| typeof RENDER_TREE_NODE_TYPE.screenBottom
		| typeof RENDER_TREE_NODE_TYPE.screenContents
		| typeof RENDER_TREE_NODE_TYPE.screenHeader,
): RenderTreeNode {
	const idSuffixByType = {
		[RENDER_TREE_NODE_TYPE.screenBottom]: "bottom",
		[RENDER_TREE_NODE_TYPE.screenContents]: "contents",
		[RENDER_TREE_NODE_TYPE.screenHeader]: "header",
	} as const;
	const titleByType = {
		[RENDER_TREE_NODE_TYPE.screenBottom]: "Bottom",
		[RENDER_TREE_NODE_TYPE.screenContents]: "Contents",
		[RENDER_TREE_NODE_TYPE.screenHeader]: "Header",
	} as const;

	return {
		children: [],
		componentVersion: node.componentVersion,
		metadata: {
			id: `${node.metadata.id}.${idSuffixByType[type]}`,
			title: titleByType[type],
		},
		type,
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
