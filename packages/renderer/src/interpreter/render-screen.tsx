import { AppScreen } from "@cx/layout/chrome";
import type { ReactNode } from "react";
import { getScreenRegions } from "../tree/runtime";
import type { RenderTreeNode, RenderTreeScreenNode } from "../tree/types";
import { renderLayout } from "./render-layout";
import { renderJsonNode } from "./render-node";
import type { RendererRuntime } from "./types";

export type RenderScreenRegionSlot = "bottom" | "contents" | "header";

export type RenderScreenRegion = (input: {
	data: Record<string, unknown>;
	defaultChildren: ReactNode;
	node: RenderTreeNode;
	region: RenderScreenRegionSlot;
	runtime: RendererRuntime;
}) => ReactNode;

export function renderScreen({
	data,
	node,
	renderRegion,
	runtime,
}: {
	data: Record<string, unknown>;
	node: RenderTreeScreenNode;
	renderRegion?: RenderScreenRegion;
	runtime: RendererRuntime;
}) {
	const { bottomNode, contentsNode, headerNode } = getScreenRegions(node);
	const screenNode = {
		...node,
		children: [headerNode, contentsNode, bottomNode],
	} as RenderTreeScreenNode;

	return (
		<AppScreen
			node={screenNode}
			header={renderScreenRegion("header", headerNode, data, runtime, renderRegion)}
			bottom={renderScreenRegion("bottom", bottomNode, data, runtime, renderRegion)}
		>
			{renderScreenRegion("contents", contentsNode, data, runtime, renderRegion)}
		</AppScreen>
	);
}

function renderScreenRegion(
	region: RenderScreenRegionSlot,
	node: RenderTreeNode,
	data: Record<string, unknown>,
	runtime: RendererRuntime,
	renderRegion?: RenderScreenRegion,
): ReactNode {
	const defaultChildren = renderRegionChildren(node, data, runtime);
	if (!renderRegion) return defaultChildren;

	return renderRegion({
		data,
		defaultChildren,
		node,
		region,
		runtime,
	});
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
