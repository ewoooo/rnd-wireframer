import type { ReactNode } from "react";
import { resolveRenderNode } from "../tree/runtime";
import type { RenderTreeNode } from "../tree/types";
import { renderComponent } from "./render-component";
import { renderLayout } from "./render-layout";
import type { RendererRuntime } from "./types";

export function renderJsonNode(
	node: RenderTreeNode,
	data: Record<string, unknown>,
	runtime: RendererRuntime,
): ReactNode {
	const resolvedNode = resolveRenderNode(node, data);
	if (!resolvedNode) return null;

	const renderChildren = () => node.children?.map((child) => renderJsonNode(child, data, runtime));
	const renderedChildren = renderChildren();

	if (node.layout) {
		const content =
			renderedChildren && renderedChildren.length > 0
				? renderedChildren
				: renderNodeWithoutLayout({
						data,
						node,
						props: resolvedNode.props,
						renderChildren,
						runtime,
					});

		return renderLayout({
			children: content,
			layoutId: node.layout,
			node,
			props: resolvedNode.props,
			runtime,
		});
	}

	return renderNodeWithoutLayout({
		data,
		node,
		props: resolvedNode.props,
		renderChildren,
		runtime,
	});
}

function renderNodeWithoutLayout({
	data,
	node,
	props,
	renderChildren,
	runtime,
}: {
	data: Record<string, unknown>;
	node: RenderTreeNode;
	props: Record<string, unknown>;
	renderChildren: () => ReactNode;
	runtime: RendererRuntime;
}): ReactNode {
	const primitive = runtime.renderPrimitive({
		children: renderChildren(),
		node,
		props,
	});
	if (primitive !== undefined) return primitive;

	const area = runtime.resolveArea({
		data,
		node,
		props,
		renderChildren,
	});
	if (area !== undefined) return area;

	if (node.children && node.children.length > 0) return renderChildren();

	return renderComponent({ node, props, runtime });
}
