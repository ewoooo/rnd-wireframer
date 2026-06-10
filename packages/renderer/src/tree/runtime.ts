import {
	RENDER_TREE_NODE_TYPE,
	RENDER_TREE_STATE_ROLE_BEHAVIOR,
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
	const behavior = RENDER_TREE_STATE_ROLE_BEHAVIOR[node.display?.stateRole ?? "base"];
	const whenValue = resolveDisplayWhen(node.display?.when, data);

	// 가시성류(base/empty): when이 거짓이면 노드를 통째로 제거한다.
	if (behavior.kind === "visibility") {
		if (!whenValue) return undefined;
		return { node, props: resolveProps(node.props, data) };
	}

	// 상태류(disabled/loading/error/success/expanded): 노드는 항상 유지하고
	// when 평가 결과를 상태 prop으로 주입한다. resolveProps가 명시한 값보다 우선한다.
	const stateValue = behavior.source === "notWhen" ? !whenValue : whenValue;
	return {
		node,
		props: { ...resolveProps(node.props, data), [behavior.prop]: stateValue },
	};
}

export { toBoolean, toText };
