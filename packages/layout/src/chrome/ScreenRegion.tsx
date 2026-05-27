import { NODE_TYPES } from "@cx/types/node-types";
import type { CSSProperties, ReactNode } from "react";
import { cx, flexLayoutClassName, flexLayoutFallbackStyle } from "../primitives";
import type {
	ScreenBottomNode,
	ScreenContentsNode,
	ScreenHeaderNode,
	ScreenRegionNode,
} from "../types";

type ScreenRegionRenderContract<TNode extends ScreenRegionNode = ScreenRegionNode> = {
	className: string;
	getHeight?: (node: TNode) => number | undefined;
	getPosition?: (node: TNode) => string | undefined;
	getPositionClassName?: (node: TNode) => string | undefined;
	getScrollClassName?: (node: TNode) => string | undefined;
	getZIndex?: (node: TNode) => number | undefined;
};

const SCREEN_HEADER_TYPE = NODE_TYPES.screenRegion[0] as ScreenHeaderNode["type"];
const SCREEN_CONTENTS_TYPE = NODE_TYPES.screenRegion[1] as ScreenContentsNode["type"];
const SCREEN_BOTTOM_TYPE = NODE_TYPES.screenRegion[2] as ScreenBottomNode["type"];

const SCREEN_REGION_RENDER_CONTRACT = {
	[SCREEN_HEADER_TYPE]: {
		className: "shrink-0",
		getHeight: (node: ScreenHeaderNode) => node.props.height,
		getPosition: (node: ScreenHeaderNode) => node.props.position,
		getPositionClassName: (node: ScreenHeaderNode) => REGION_POSITION_CLASS[node.props.position],
		getZIndex: (node: ScreenHeaderNode) => node.props.zIndex,
	},
	[SCREEN_CONTENTS_TYPE]: {
		className: "flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
		getScrollClassName: (node: ScreenContentsNode) =>
			REGION_SCROLL_CLASS[node.props.scroll ? "on" : "off"],
	},
	[SCREEN_BOTTOM_TYPE]: {
		className: "shrink-0",
		getHeight: (node: ScreenBottomNode) => node.props.height,
		getPosition: (node: ScreenBottomNode) => node.props.position,
		getPositionClassName: (node: ScreenBottomNode) => REGION_POSITION_CLASS[node.props.position],
		getZIndex: (node: ScreenBottomNode) => node.props.zIndex,
	},
} satisfies {
	[SCREEN_HEADER_TYPE]: ScreenRegionRenderContract<ScreenHeaderNode>;
	[SCREEN_CONTENTS_TYPE]: ScreenRegionRenderContract<ScreenContentsNode>;
	[SCREEN_BOTTOM_TYPE]: ScreenRegionRenderContract<ScreenBottomNode>;
};

const REGION_POSITION_CLASS: Record<"fixed" | "static" | "sticky", string> = {
	fixed: "static",
	static: "static",
	sticky: "sticky",
};

const REGION_SCROLL_CLASS: Record<"off" | "on", string> = {
	off: "overflow-hidden",
	on: "overflow-y-auto",
};

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
				zIndex: getZIndex(node),
				...style,
			}}
		>
			{children}
		</section>
	);
}

function getRegionClassName(node: ScreenRegionNode) {
	return readRegionContractValue(node, (contract, regionNode) =>
		cx(contract.className, contract.getScrollClassName?.(regionNode)),
	);
}

function getPositionClassName(node: ScreenRegionNode) {
	return readRegionContractValue(node, (contract, regionNode) =>
		contract.getPositionClassName?.(regionNode),
	);
}

function getPosition(node: ScreenRegionNode) {
	return readRegionContractValue(node, (contract, regionNode) =>
		contract.getPosition?.(regionNode),
	);
}

function getHeight(node: ScreenRegionNode) {
	return readRegionContractValue(node, (contract, regionNode) => contract.getHeight?.(regionNode));
}

function getZIndex(node: ScreenRegionNode) {
	return readRegionContractValue(node, (contract, regionNode) => contract.getZIndex?.(regionNode));
}

function readRegionContractValue<T>(
	node: ScreenRegionNode,
	reader: (contract: ScreenRegionRenderContract, node: ScreenRegionNode) => T,
): T {
	return reader(SCREEN_REGION_RENDER_CONTRACT[node.type] as ScreenRegionRenderContract, node);
}
