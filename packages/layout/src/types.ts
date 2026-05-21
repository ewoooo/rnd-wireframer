export type LayoutMetadata = {
	id: string;
	title?: string;
};

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

export type LayoutNode = {
	type: string;
	metadata: LayoutMetadata;
	componentVersion?: string;
};

export type LayoutFlexNode = LayoutNode & {
	type: "Layout.Flex";
	props: FlexLayoutProps;
};

export type LayoutGridNode = LayoutNode & {
	type: "Layout.Grid";
	props: GridLayoutProps;
};

export type ScreenHeaderNode = LayoutNode & {
	type: "Screen.Header";
	props: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: LayoutNode[];
};

export type ScreenContentsNode = LayoutNode & {
	type: "Screen.Contents";
	props: {
		layout: FlexLayoutProps;
		scroll: boolean;
	};
	children?: LayoutNode[];
};

export type ScreenBottomNode = LayoutNode & {
	type: "Screen.Bottom";
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
	type: "Screen";
	children: [ScreenHeaderNode, ScreenContentsNode, ScreenBottomNode];
};
