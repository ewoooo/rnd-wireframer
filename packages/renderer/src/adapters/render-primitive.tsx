import { Flex, Grid } from "@cx/layout/primitives";
import type { ReactNode } from "react";
import type {
	RenderTreeFlexLayoutProps,
	RenderTreeGridLayoutProps,
	RenderTreeLayoutFlexNode,
	RenderTreeLayoutGridNode,
	RenderTreeNode,
} from "../tree/types";

export function renderPrimitive({
	children,
	node,
	props,
}: {
	children: ReactNode;
	node: RenderTreeNode;
	props: Record<string, unknown>;
}): ReactNode | undefined {
	if (node.type === "Layout.Flex") {
		return (
			<Flex
				key={node.metadata.id}
				layout={props as RenderTreeFlexLayoutProps}
				node={node as RenderTreeLayoutFlexNode}
			>
				{children}
			</Flex>
		);
	}

	if (node.type === "Layout.Grid") {
		return (
			<Grid
				key={node.metadata.id}
				layout={props as RenderTreeGridLayoutProps}
				node={node as RenderTreeLayoutGridNode}
			>
				{children}
			</Grid>
		);
	}

	return undefined;
}
