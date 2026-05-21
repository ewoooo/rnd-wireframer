"use client";

import { AppScreen } from "@cx/layout/chrome";
import type { WireframeNode, WireframeScreenNode } from "@cx/wireframe";

import { getScreenRegions } from "@/features/wireframe-renderer/generate-render-tree";

import { renderNode } from "./render-node";

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
