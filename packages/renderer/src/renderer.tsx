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

/**
 * 자식 노드 목록을 렌더한다. 형제 노드의 metadata.id가 중복될 수 있으므로
 * (예: 한 area가 동일 composite를 여러 번 참조) React key는 항상 위치 기반으로
 * 유니크하게 부여한다. 렌더러는 id 유일성을 가정하지 않는다.
 */
function renderChildList(
	children: RenderTreeNode[] | undefined,
	data: Record<string, unknown>,
): ReactNode {
	return children?.map((child, index) => (
		<Fragment key={`${child.metadata.id}#${index}`}>{renderNode(child, data)}</Fragment>
	));
}

function getRenderer(kind: RenderTreeNodeKind): RenderTreeRenderer {
	return rendererRegistry.get(kind) ?? rendererRegistry.get("fallback") ?? defaultFallbackRenderer;
}

const defaultFallbackRenderer: RenderTreeRenderer = ({ node }) => (
	<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
		{node.metadata.title}
	</div>
);
