import type {
	WireframeScreenBottomNode,
	WireframeScreenContentsNode,
	WireframeScreenHeaderNode,
	WireframeScreenRegionType,
} from "@cx/wireframe";
import type { CSSProperties, ReactNode } from "react";

import { cx, flexLayoutClassName, flexLayoutFallbackStyle } from "../primitives";

type ScreenRegionNode =
	| WireframeScreenHeaderNode
	| WireframeScreenContentsNode
	| WireframeScreenBottomNode;

export type ScreenRegionProps = {
	children?: ReactNode;
	className?: string;
	node: ScreenRegionNode;
	style?: CSSProperties;
};

export function ScreenRegion({ children, className, node, style }: ScreenRegionProps) {
	return (
		<section
			className={cx(
				"box-border flex w-full min-w-0",
				getRegionClassName(node),
				flexLayoutClassName(node.props.layout),
				getPositionClassName(node),
				className,
			)}
			data-node-id={node.metadata.id}
			data-node-type={node.type}
			data-region={node.type satisfies WireframeScreenRegionType}
			data-position={getPosition(node)}
			style={{
				...flexLayoutFallbackStyle(node.props.layout),
				height: getHeight(node),
				zIndex: node.type === "Screen.Contents" ? undefined : node.props.zIndex,
				...style,
			}}
		>
			{children}
		</section>
	);
}

function getRegionClassName(node: ScreenRegionNode) {
	if (node.type === "Screen.Contents") {
		return cx(
			"flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			node.props.scroll ? "overflow-y-auto" : "overflow-hidden",
		);
	}

	return "shrink-0";
}

function getPositionClassName(node: ScreenRegionNode) {
	if (node.type === "Screen.Contents") return undefined;
	if (node.props.position === "sticky") return "sticky";
	return "static";
}

function getPosition(node: ScreenRegionNode) {
	if (node.type === "Screen.Contents") return undefined;
	return node.props.position;
}

function getHeight(node: ScreenRegionNode) {
	if (node.type === "Screen.Contents") return undefined;
	return node.props.height;
}
