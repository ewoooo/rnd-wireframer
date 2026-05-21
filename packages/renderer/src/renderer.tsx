"use client";

import { AppScreen } from "@cx/layout/chrome";
import type { WireframeNode, WireframeScreenNode } from "@cx/renderer";
import type { ReactNode } from "react";

import { defaultRendererDefinitions } from "./default-renderers";
import { RendererRegistry, type WireframeRenderer } from "./registry";
import { getRenderableWireframeNode, getScreenRegions, type WireframeNodeKind } from "./runtime";

export const rendererRegistry = new RendererRegistry();
rendererRegistry.registerAll(defaultRendererDefinitions);

export function WireframeScreenRenderer({
	data,
	node,
}: {
	data?: Record<string, unknown>;
	node: WireframeScreenNode;
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

export function WireframeNodeRenderer({
	data,
	node,
}: {
	data?: Record<string, unknown>;
	node: WireframeNode;
}) {
	return renderNode(node, data ?? {});
}

export function renderNode(node: WireframeNode, data: Record<string, unknown>): ReactNode {
	const renderableNode = getRenderableWireframeNode(node, data);
	if (!renderableNode) return null;

	const renderer = getRenderer(renderableNode.kind);

	return renderer({
		data,
		node,
		renderable: renderableNode,
		renderChildren: () => node.children?.map((child) => renderNode(child, data)),
	});
}

function getRenderer(kind: WireframeNodeKind): WireframeRenderer {
	return rendererRegistry.get(kind) ?? rendererRegistry.get("fallback") ?? defaultFallbackRenderer;
}

const defaultFallbackRenderer: WireframeRenderer = ({ node }) => (
	<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
		{node.metadata.title}
	</div>
);
