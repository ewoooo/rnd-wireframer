"use client";

import { AppScreen } from "@cx/layout/chrome";
import { Fragment, type ReactNode } from "react";

import { defaultRendererDefinitions } from "./default-renderers";
import { RendererRegistry, type RenderTreeRenderer } from "./registry";
import { getRenderableTreeNode, getScreenRegions, type RenderTreeNodeKind } from "./runtime";
import type { RenderTreeNode, RenderTreeScreenNode } from "./schema";

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
			header={renderChildList(headerNode.children, renderData)}
			bottom={renderChildList(bottomNode.children, renderData)}
		>
			{renderChildList(contentsNode.children, renderData)}
		</AppScreen>
	);
}

// Render a sibling list with keys that stay unique even when nodes share metadata.id
// (the DB→RenderTree projection can repeat a component code as the node id). The index
// suffix only affects React's list key, not the node identity.
function renderChildList(
	children: RenderTreeNode[] | undefined,
	data: Record<string, unknown>,
): ReactNode {
	return children?.map((child, index) => (
		// biome-ignore lint/suspicious/noArrayIndexKey: id can repeat (projection reuses component code as id); index is the tiebreaker
		<Fragment key={`${child.metadata.id}::${index}`}>{renderNode(child, data)}</Fragment>
	));
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
		renderChildren: () => renderChildList(node.children, data),
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
