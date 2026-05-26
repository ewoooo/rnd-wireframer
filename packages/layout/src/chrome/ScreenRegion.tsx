import { NODE_TYPES } from "@cx/types";
import type { CSSProperties, ReactNode } from "react";
import { cx, flexLayoutClassName, flexLayoutFallbackStyle } from "../primitives";
import type { ScreenRegionNode } from "../types";

const SCREEN_CONTENTS_TYPE = NODE_TYPES.screenRegion[1];

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
			data-region={node.type satisfies ScreenRegionNode["type"]}
			data-position={getPosition(node)}
			style={{
				...flexLayoutFallbackStyle(node.props.layout),
				height: getHeight(node),
				zIndex: node.type === SCREEN_CONTENTS_TYPE ? undefined : node.props.zIndex,
				...style,
			}}
		>
			{children}
		</section>
	);
}

function getRegionClassName(node: ScreenRegionNode) {
	if (node.type === SCREEN_CONTENTS_TYPE) {
		return cx(
			"flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			node.props.scroll ? "overflow-y-auto" : "overflow-hidden",
		);
	}

	return "shrink-0";
}

function getPositionClassName(node: ScreenRegionNode) {
	if (node.type === SCREEN_CONTENTS_TYPE) return undefined;
	if (node.props.position === "sticky") return "sticky";
	return "static";
}

function getPosition(node: ScreenRegionNode) {
	if (node.type === SCREEN_CONTENTS_TYPE) return undefined;
	return node.props.position;
}

function getHeight(node: ScreenRegionNode) {
	if (node.type === SCREEN_CONTENTS_TYPE) return undefined;
	return node.props.height;
}
