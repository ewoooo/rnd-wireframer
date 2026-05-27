import type { FlexLayoutProps, GridLayoutProps } from "@cx/types/database-tables";
import type { NODE_TYPES } from "@cx/types/node-types";
export type { FlexLayoutProps, GridLayoutProps };

export type LayoutMetadata = {
	id: string;
	title?: string;
};

export type LayoutNode = {
	type: string;
	metadata: LayoutMetadata;
	componentVersion?: string;
};

export type LayoutFlexNode = LayoutNode & {
	type: (typeof NODE_TYPES.layout)[0];
	props: FlexLayoutProps;
};

export type LayoutGridNode = LayoutNode & {
	type: (typeof NODE_TYPES.layout)[1];
	props: GridLayoutProps;
};

export type ScreenHeaderNode = LayoutNode & {
	type: (typeof NODE_TYPES.screenRegion)[0];
	props: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: LayoutNode[];
};

export type ScreenContentsNode = LayoutNode & {
	type: (typeof NODE_TYPES.screenRegion)[1];
	props: {
		layout: FlexLayoutProps;
		scroll: boolean;
	};
	children?: LayoutNode[];
};

export type ScreenBottomNode = LayoutNode & {
	type: (typeof NODE_TYPES.screenRegion)[2];
	props: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: LayoutNode[];
};

export type ScreenRegionNode = ScreenHeaderNode | ScreenContentsNode | ScreenBottomNode;

export type ScreenNode = LayoutNode & {
	type: (typeof NODE_TYPES.screenRoot)[0];
	children: [ScreenHeaderNode, ScreenContentsNode, ScreenBottomNode];
};
