import type { CSSProperties, ElementType, ReactNode } from "react";
import { cx, flexLayoutClassName, flexLayoutFallbackStyle } from "../internal/style";
import { type FlexLayoutProps, LAYOUT_NODE_TYPES, type LayoutFlexNode } from "../types";

export type FlexProps = {
	as?: ElementType;
	children?: ReactNode;
	className?: string;
	layout: FlexLayoutProps;
	node?: LayoutFlexNode;
	style?: CSSProperties;
};

export function Flex({ as: Element = "div", children, className, layout, node, style }: FlexProps) {
	return (
		<Element
			className={cx(flexLayoutClassName(layout), className)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? LAYOUT_NODE_TYPES.layout[0]}
			style={{
				...flexLayoutFallbackStyle(layout),
				...style,
			}}
		>
			{children}
		</Element>
	);
}
