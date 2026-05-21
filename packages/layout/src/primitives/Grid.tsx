import type { WireframeGridLayoutProps, WireframeLayoutGridNode } from "@cx/wireframe";
import type { CSSProperties, ElementType, ReactNode } from "react";

import { cx, gridLayoutClassName, gridLayoutFallbackStyle } from "./style";

export type GridProps = {
	as?: ElementType;
	children?: ReactNode;
	className?: string;
	layout: WireframeGridLayoutProps;
	node?: WireframeLayoutGridNode;
	style?: CSSProperties;
};

export function Grid({ as: Element = "div", children, className, layout, node, style }: GridProps) {
	return (
		<Element
			className={cx(gridLayoutClassName(layout), className)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? "Layout.Grid"}
			style={{
				...gridLayoutFallbackStyle(layout),
				...style,
			}}
		>
			{children}
		</Element>
	);
}
