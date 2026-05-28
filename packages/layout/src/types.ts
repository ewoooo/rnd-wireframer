export const LAYOUT_NODE_TYPES = {
	screenRoot: ["Screen"],
	screenRegion: ["Screen.Header", "Screen.Contents", "Screen.Bottom"],
	layout: ["Layout.Flex", "Layout.Grid"],
} as const;

export type FlexLayoutProps = {
	direction: "row" | "column";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type GridLayoutProps = {
	columns?: string;
	rows?: string;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "stretch";
};

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
	type: (typeof LAYOUT_NODE_TYPES.layout)[0];
	props: FlexLayoutProps;
};

export type LayoutGridNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.layout)[1];
	props: GridLayoutProps;
};

export type ScreenHeaderNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRegion)[0];
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: LayoutNode[];
};

export type ScreenContentsNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRegion)[1];
	props?: {
		layout: FlexLayoutProps;
		scroll: boolean;
	};
	children?: LayoutNode[];
};

export type ScreenBottomNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRegion)[2];
	props?: {
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
	type: (typeof LAYOUT_NODE_TYPES.screenRoot)[0];
	children: [ScreenHeaderNode, ScreenContentsNode, ScreenBottomNode];
};
