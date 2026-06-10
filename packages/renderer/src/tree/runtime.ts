import {
	RENDER_TREE_NODE_TYPE,
	type RenderTreeScreenRegionNodeType,
	SCREEN_REGION_TYPE_BY_NODE_TYPE,
} from "@cx/schema";
import { toBoolean, toText } from "../runtime/text";
import { resolveDisplayWhen, resolveProps } from "./bindings";
import type { RenderTreeNode, RenderTreeScreenNode } from "./types";

export interface ResolvedRenderNode {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}

export function getScreenRegions(node: RenderTreeScreenNode) {
	const children = Array.isArray(node.children) ? node.children : [];
	const regionNode = (type: RenderTreeScreenRegionNodeType) =>
		children.find((child) => child.type === type) ?? createEmptyScreenRegionNode(node, type);

	return {
		bottomNode: regionNode(RENDER_TREE_NODE_TYPE.screenBottom),
		contentsNode: regionNode(RENDER_TREE_NODE_TYPE.screenContents),
		headerNode: regionNode(RENDER_TREE_NODE_TYPE.screenHeader),
	};
}

function createEmptyScreenRegionNode(
	node: RenderTreeScreenNode,
	type: RenderTreeScreenRegionNodeType,
): RenderTreeNode {
	const regionKey = SCREEN_REGION_TYPE_BY_NODE_TYPE[type];

	return {
		children: [],
		componentVersion: node.componentVersion,
		metadata: {
			id: `${node.metadata.id}.${regionKey}`,
			title: regionKey.charAt(0).toUpperCase() + regionKey.slice(1),
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
