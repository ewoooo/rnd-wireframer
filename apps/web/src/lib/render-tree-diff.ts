import type { RenderTree, RenderTreeNode } from "@cx/renderer";

export type RenderTreeDiffSummary = {
	changedLayoutCount: number;
	changedPropCount: number;
	leftNodeCount: number;
	missingInLeftCount: number;
	missingInRightCount: number;
	rightNodeCount: number;
	sharedNodeCount: number;
};

export function diffRenderTrees(
	left: RenderTree | undefined,
	right: RenderTree | undefined,
): RenderTreeDiffSummary {
	const leftNodes = flattenRenderTree(left);
	const rightNodes = flattenRenderTree(right);
	const leftById = new Map(leftNodes.map((node) => [node.metadata.id, node]));
	const rightById = new Map(rightNodes.map((node) => [node.metadata.id, node]));
	const sharedIds = leftNodes.map((node) => node.metadata.id).filter((id) => rightById.has(id));

	return {
		changedLayoutCount: sharedIds.filter(
			(id) => leftById.get(id)?.layout !== rightById.get(id)?.layout,
		).length,
		changedPropCount: sharedIds.filter(
			(id) =>
				JSON.stringify(leftById.get(id)?.props ?? {}) !==
				JSON.stringify(rightById.get(id)?.props ?? {}),
		).length,
		leftNodeCount: leftNodes.length,
		missingInLeftCount: rightNodes.filter((node) => !leftById.has(node.metadata.id)).length,
		missingInRightCount: leftNodes.filter((node) => !rightById.has(node.metadata.id)).length,
		rightNodeCount: rightNodes.length,
		sharedNodeCount: sharedIds.length,
	};
}

export function flattenRenderTree(renderTree: RenderTree | undefined): RenderTreeNode[] {
	if (!renderTree) return [];
	return renderTree.children.flatMap((node) => flattenNode(node));
}

function flattenNode(node: RenderTreeNode): RenderTreeNode[] {
	return [node, ...(node.children ?? []).flatMap((child) => flattenNode(child))];
}
