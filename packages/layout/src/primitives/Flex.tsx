import type { WireframeFlexLayoutProps, WireframeLayoutFlexNode } from "@cx/wireframe";
import type { CSSProperties, ElementType, ReactNode } from "react";

import { cx, flexLayoutClassName, flexLayoutFallbackStyle } from "./style";

export type FlexProps = {
	as?: ElementType;
	children?: ReactNode;
	className?: string;
	layout: WireframeFlexLayoutProps;
	node?: WireframeLayoutFlexNode;
	style?: CSSProperties;
};

export function Flex({ as: Element = "div", children, className, layout, node, style }: FlexProps) {
	return (
		<Element
			className={cx(flexLayoutClassName(layout), className)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? "Layout.Flex"}
			style={{
				...flexLayoutFallbackStyle(layout),
				...style,
			}}
		>
			{children}
		</Element>
	);
}
