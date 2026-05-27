import type { CSSProperties, ElementType, ReactNode } from "react";
import { cx, gridLayoutClassName, gridLayoutFallbackStyle } from "../internal/style";
import { type GridLayoutProps, LAYOUT_NODE_TYPES, type LayoutGridNode } from "../types";

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
			data-node-type={node?.type ?? LAYOUT_NODE_TYPES.layout[1]}
			style={{
				...gridLayoutFallbackStyle(layout),
				...style,
			}}
		>
			{children}
		</Element>
	);
}
