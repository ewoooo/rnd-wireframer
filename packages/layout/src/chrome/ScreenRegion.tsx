import type { CSSProperties, ReactNode } from "react";
import { cx, flexLayoutClassName, flexLayoutFallbackStyle } from "../internal/style";
import type {
	FlexLayoutProps,
	ScreenBottomNode,
	ScreenContentsNode,
	ScreenHeaderNode,
	ScreenRegionNode,
} from "../types";
import { LAYOUT_NODE_TYPES } from "../types";

type ScreenRegionRenderContract = {
	className: string;
	defaultProps: ScreenRegionRuntimeProps;
	getScrollClassName?: (props: ScreenRegionRuntimeProps) => string | undefined;
};

const SCREEN_HEADER_TYPE = LAYOUT_NODE_TYPES.screenRegion[0] as ScreenHeaderNode["type"];
const SCREEN_CONTENTS_TYPE = LAYOUT_NODE_TYPES.screenRegion[1] as ScreenContentsNode["type"];
const SCREEN_BOTTOM_TYPE = LAYOUT_NODE_TYPES.screenRegion[2] as ScreenBottomNode["type"];

const SCREEN_REGION_RENDER_CONTRACT = {
	[SCREEN_HEADER_TYPE]: {
		className: "shrink-0",
		defaultProps: { layout: { direction: "column" }, position: "static" },
	},
	[SCREEN_CONTENTS_TYPE]: {
		className: "flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
		defaultProps: { layout: { direction: "column" }, scroll: true },
		getScrollClassName: (props) => REGION_SCROLL_CLASS[props.scroll ? "on" : "off"],
	},
	[SCREEN_BOTTOM_TYPE]: {
		className: "shrink-0",
		defaultProps: { layout: { direction: "column" }, position: "static" },
	},
} satisfies {
	[SCREEN_HEADER_TYPE]: ScreenRegionRenderContract;
	[SCREEN_CONTENTS_TYPE]: ScreenRegionRenderContract;
	[SCREEN_BOTTOM_TYPE]: ScreenRegionRenderContract;
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

type ScreenRegionRuntimeProps = {
	height?: number;
	layout?: FlexLayoutProps;
	position?: "fixed" | "static" | "sticky";
	safeArea?: boolean;
	scroll?: boolean;
	zIndex?: number;
};

export type ScreenRegionProps = {
	children?: ReactNode;
	className?: string;
	node: ScreenRegionNode;
	style?: CSSProperties;
};

export function ScreenRegion({ children, className, node, style }: ScreenRegionProps) {
	const props = getRegionProps(node);

	return (
		<section
			className={cx(
				"box-border flex w-full min-w-0",
				getRegionClassName(node, props),
				flexLayoutClassName(props.layout),
				props.position ? REGION_POSITION_CLASS[props.position] : undefined,
				className,
			)}
			data-node-id={node.metadata.id}
			data-node-type={node.type}
			data-region={node.type satisfies ScreenRegionNode["type"]}
			data-position={props.position}
			style={{
				...flexLayoutFallbackStyle(props.layout),
				height: props.height,
				zIndex: props.zIndex,
				...style,
			}}
		>
			{children}
		</section>
	);
}

function getRegionClassName(node: ScreenRegionNode, props: ScreenRegionRuntimeProps) {
	return readRegionContractValue(node, (contract) =>
		cx(contract.className, contract.getScrollClassName?.(props)),
	);
}

function readRegionContractValue<T>(
	node: ScreenRegionNode,
	reader: (contract: ScreenRegionRenderContract, node: ScreenRegionNode) => T,
): T {
	return reader(SCREEN_REGION_RENDER_CONTRACT[node.type] as ScreenRegionRenderContract, node);
}

function getRegionProps(node: ScreenRegionNode): ScreenRegionRuntimeProps {
	const contract = SCREEN_REGION_RENDER_CONTRACT[node.type] as ScreenRegionRenderContract;
	return {
		...contract.defaultProps,
		...node.props,
	};
}
