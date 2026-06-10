import { Flex, Grid } from "@cx/layout/primitives";
import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
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
	if (node.type === RENDER_TREE_NODE_TYPE.layoutFlex) {
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

	if (node.type === RENDER_TREE_NODE_TYPE.layoutGrid) {
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
