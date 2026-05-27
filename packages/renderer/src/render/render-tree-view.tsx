"use client";

import { AppScreen } from "@cx/layout/chrome";
import type { ReactNode } from "react";
import { defaultNodeRenderers } from "../nodes/default-node-renderers";
import { type NodeRenderer, NodeRendererRegistry } from "../registry/node-renderer-registry";
import { getScreenRegions, type RenderTreeNodeKind, resolveRenderNode } from "../tree/runtime";
import type { RenderTreeNode, RenderTreeScreenNode } from "../tree/types";

export const nodeRendererRegistry = new NodeRendererRegistry();
nodeRendererRegistry.registerAll(defaultNodeRenderers);

export function RenderTreeView({
	data,
	node,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeScreenNode;
}) {
	const { bottomNode, contentsNode, headerNode } = getScreenRegions(node);
	const renderData = data ?? {};

	return (
		<AppScreen
			node={node}
			header={headerNode.children?.map((child) => renderJsonNode(child, renderData))}
			bottom={bottomNode.children?.map((child) => renderJsonNode(child, renderData))}
		>
			{contentsNode.children?.map((child) => renderJsonNode(child, renderData))}
		</AppScreen>
	);
}

export function RenderNodeView({
	data,
	node,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeNode;
}) {
	return renderJsonNode(node, data ?? {});
}

export function renderJsonNode(node: RenderTreeNode, data: Record<string, unknown>): ReactNode {
	const resolvedNode = resolveRenderNode(node, data);
	if (!resolvedNode) return null;

	const renderer = getNodeRenderer(resolvedNode.kind);

	return renderer({
		data,
		node,
		renderable: resolvedNode,
		renderChildren: () => node.children?.map((child) => renderJsonNode(child, data)),
	});
}

function getNodeRenderer(kind: RenderTreeNodeKind): NodeRenderer {
	return (
		nodeRendererRegistry.get(kind) ?? nodeRendererRegistry.get("fallback") ?? renderFallbackNode
	);
}

const renderFallbackNode: NodeRenderer = ({ node }) => (
	<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
		{node.metadata.title}
	</div>
);
