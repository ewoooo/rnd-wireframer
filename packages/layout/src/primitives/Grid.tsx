import { NODE_TYPES } from "@cx/types";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { GridLayoutProps, LayoutGridNode } from "../types";

import { cx, gridLayoutClassName, gridLayoutFallbackStyle } from "./style";

export type GridProps = {
	as?: ElementType;
	children?: ReactNode;
	className?: string;
	layout: GridLayoutProps;
	node?: LayoutGridNode;
	style?: CSSProperties;
};

export function Grid({ as: Element = "div", children, className, layout, node, style }: GridProps) {
	return (
		<Element
			className={cx(gridLayoutClassName(layout), className)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? NODE_TYPES.layout[1]}
			style={{
				...gridLayoutFallbackStyle(layout),
				...style,
			}}
		>
			{children}
		</Element>
	);
}
