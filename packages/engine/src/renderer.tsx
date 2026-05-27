"use client";

import { AppScreen } from "@cx/layout/chrome";
import type { ReactNode } from "react";
import { defaultRendererDefinitions } from "./default-renderers";
import { RendererRegistry, type RenderTreeRenderer } from "./registry";
import { getRenderableTreeNode, getScreenRegions, type RenderTreeNodeKind } from "./runtime";
import type { RenderTreeNode, RenderTreeScreenNode } from "./types";

export const rendererRegistry = new RendererRegistry();
rendererRegistry.registerAll(defaultRendererDefinitions);

export function RenderTreeScreenRenderer({
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
			header={headerNode.children?.map((child) => renderNode(child, renderData))}
			bottom={bottomNode.children?.map((child) => renderNode(child, renderData))}
		>
			{contentsNode.children?.map((child) => renderNode(child, renderData))}
		</AppScreen>
	);
}

export function RenderTreeNodeRenderer({
	data,
	node,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeNode;
}) {
	return renderNode(node, data ?? {});
}

export function renderNode(node: RenderTreeNode, data: Record<string, unknown>): ReactNode {
	const renderableNode = getRenderableTreeNode(node, data);
	if (!renderableNode) return null;

	const renderer = getRenderer(renderableNode.kind);

	return renderer({
		data,
		node,
		renderable: renderableNode,
		renderChildren: () => node.children?.map((child) => renderNode(child, data)),
	});
}

function getRenderer(kind: RenderTreeNodeKind): RenderTreeRenderer {
	return rendererRegistry.get(kind) ?? rendererRegistry.get("fallback") ?? defaultFallbackRenderer;
}

const defaultFallbackRenderer: RenderTreeRenderer = ({ node }) => (
	<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
		{node.metadata.title}
	</div>
);
