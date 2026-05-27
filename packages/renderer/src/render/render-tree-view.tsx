"use client";

import { AppScreen } from "@cx/layout/chrome";
import type { ReactNode } from "react";
import { defaultNodeRenderers } from "../nodes/default-node-renderers";
import {
	createNodeRendererRegistry,
	type NodeRenderer,
	type NodeRendererRegistry,
} from "../registry/node-renderer-registry";
import { getScreenRegions, type RenderTreeNodeKind, resolveRenderNode } from "../tree/runtime";
import type { RenderTreeNode, RenderTreeScreenNode } from "../tree/types";

const defaultNodeRendererRegistry = createNodeRendererRegistry(defaultNodeRenderers);

export function RenderTreeView({
	data,
	node,
	registry = defaultNodeRendererRegistry,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeScreenNode;
	registry?: NodeRendererRegistry;
}) {
	const { bottomNode, contentsNode, headerNode } = getScreenRegions(node);
	const renderData = data ?? {};

	return (
		<AppScreen
			node={node}
			header={headerNode.children?.map((child) => renderJsonNode(child, renderData, registry))}
			bottom={bottomNode.children?.map((child) => renderJsonNode(child, renderData, registry))}
		>
			{contentsNode.children?.map((child) => renderJsonNode(child, renderData, registry))}
		</AppScreen>
	);
}

export function RenderNodeView({
	data,
	node,
	registry = defaultNodeRendererRegistry,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeNode;
	registry?: NodeRendererRegistry;
}) {
	return renderJsonNode(node, data ?? {}, registry);
}

export function renderJsonNode(
	node: RenderTreeNode,
	data: Record<string, unknown>,
	registry: NodeRendererRegistry = defaultNodeRendererRegistry,
): ReactNode {
	const resolvedNode = resolveRenderNode(node, data);
	if (!resolvedNode) return null;

	const renderer = getNodeRenderer(resolvedNode.kind, registry);

	return renderer({
		data,
		node,
		renderable: resolvedNode,
		renderChildren: () => node.children?.map((child) => renderJsonNode(child, data, registry)),
	});
}

function getNodeRenderer(kind: RenderTreeNodeKind, registry: NodeRendererRegistry): NodeRenderer {
	return registry.get(kind) ?? registry.get("fallback") ?? renderFallbackNode;
}

const renderFallbackNode: NodeRenderer = ({ node }) => (
	<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
		{node.metadata.title}
	</div>
);
