import { AppScreen } from "@cx/layout/chrome";
import type { ReactNode } from "react";
import { getScreenRegions } from "../tree/runtime";
import type { RenderTreeNode, RenderTreeScreenNode } from "../tree/types";
import { renderLayout } from "./render-layout";
import { renderJsonNode } from "./render-node";
import type { RendererRuntime } from "./types";

export function renderScreen({
	data,
	node,
	runtime,
}: {
	data: Record<string, unknown>;
	node: RenderTreeScreenNode;
	runtime: RendererRuntime;
}) {
	const { bottomNode, contentsNode, headerNode } = getScreenRegions(node);

	return (
		<AppScreen
			node={node}
			header={renderRegionChildren(headerNode, data, runtime)}
			bottom={renderRegionChildren(bottomNode, data, runtime)}
		>
			{renderRegionChildren(contentsNode, data, runtime)}
		</AppScreen>
	);
}

function renderRegionChildren(
	node: RenderTreeNode,
	data: Record<string, unknown>,
	runtime: RendererRuntime,
): ReactNode {
	const children = node.children?.map((child) => renderJsonNode(child, data, runtime));
	if (!node.layout) return children;

	return renderLayout({
		children,
		layoutId: node.layout,
		node,
		props: node.props ?? {},
		runtime,
	});
}
