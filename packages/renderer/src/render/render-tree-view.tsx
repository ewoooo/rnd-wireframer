"use client";

import { AppScreen } from "@cx/layout/chrome";
import { resolvePatternComponent } from "@cx/layout-pattern-store/resolver";
import type { ReactNode } from "react";
import { defaultNodeRenderers } from "../nodes/default-node-renderers";
import {
	createNodeRendererRegistry,
	type NodeRenderer,
	type NodeRendererRegistry,
} from "../registry/node-renderer-registry";
import {
	getScreenRegions,
	type RenderTreeNodeKind,
	type ResolvedRenderNode,
	resolveRenderNode,
} from "../tree/runtime";
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
			header={renderRegionChildren(headerNode, renderData, registry)}
			bottom={renderRegionChildren(bottomNode, renderData, registry)}
		>
			{renderRegionChildren(contentsNode, renderData, registry)}
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

	if (node.layout) {
		const resolvedPattern = resolvePatternComponent({
			layoutId: node.layout,
			props: resolvedNode.props,
		});
		if (resolvedPattern) {
			const { Component, componentProps } = resolvedPattern;
			const renderedChildren = node.children?.map((child) => renderJsonNode(child, data, registry));
			const content =
				renderedChildren && renderedChildren.length > 0
					? renderedChildren
					: renderNodeWithoutLayout(resolvedNode, data, registry);

			return (
				<Component
					key={node.metadata.id}
					{...componentProps}
					className={node.className}
					metadata={node.metadata}
				>
					{content}
				</Component>
			);
		}
	}

	return renderNodeWithoutLayout(resolvedNode, data, registry);
}

function renderRegionChildren(
	node: RenderTreeNode,
	data: Record<string, unknown>,
	registry: NodeRendererRegistry,
): ReactNode {
	const children = node.children?.map((child) => renderJsonNode(child, data, registry));
	if (!node.layout) return children;

	const resolvedPattern = resolvePatternComponent({
		layoutId: node.layout,
		props: node.props,
	});
	if (!resolvedPattern) return children;

	const { Component, componentProps } = resolvedPattern;
	return (
		<Component
			key={`${node.metadata.id}.layout`}
			{...componentProps}
			className={node.className}
			metadata={node.metadata}
		>
			{children}
		</Component>
	);
}

function renderNodeWithoutLayout(
	resolvedNode: ResolvedRenderNode,
	data: Record<string, unknown>,
	registry: NodeRendererRegistry,
): ReactNode {
	const renderer = getNodeRenderer(resolvedNode.kind, registry);

	return renderer({
		data,
		node: resolvedNode.node,
		renderable: resolvedNode,
		renderChildren: () =>
			resolvedNode.node.children?.map((child) => renderJsonNode(child, data, registry)),
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
