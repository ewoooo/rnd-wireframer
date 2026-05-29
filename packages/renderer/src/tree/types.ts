export const NODE_TYPES = {
	screenRoot: ["Screen"],
	screenRegion: ["Screen.Header", "Screen.Contents", "Screen.Bottom"],
	layout: ["Layout.Flex", "Layout.Grid"],
	wrapper: ["PageStack"],
	area: ["area.static", "area.dynamic"],
} as const;

export type PropBinding = {
	bind: string;
	default?: string | number | boolean | null;
};

export type PropValue =
	| string
	| number
	| boolean
	| null
	| PropValue[]
	| { [key: string]: PropValue }
	| PropBinding;

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

export type RenderTreeNodeKind = string;

export type RenderTreeDisplay = {
	when?: PropBinding | boolean;
	stateRole?: "base" | "loading" | "empty" | "error" | "success" | "disabled" | "expanded";
};

export interface RenderTreeStyle {
	background?: string;
	opacity?: number;
}

export interface RenderTreeMetadata {
	id: string;
	author?: string;
	createdAt?: string;
	updatedAt?: string;
	description?: string;
}

export interface RenderTreeNodeMetadata extends RenderTreeMetadata {
	title: string;
}

export interface RenderTreeNode {
	type: string;
	componentVersion: string;
	metadata: RenderTreeNodeMetadata;
	layout?: string;
	props?: Record<string, PropValue>;
	className?: string;
	style?: RenderTreeStyle;
	display?: RenderTreeDisplay;
	children?: RenderTreeNode[];
}

export type RenderTreeScreenHeaderNode = Omit<RenderTreeNode, "props" | "children"> & {
	type: (typeof NODE_TYPES.screenRegion)[0];
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: RenderTreeNode[];
};

export type RenderTreeScreenContentsNode = Omit<RenderTreeNode, "props" | "children"> & {
	type: (typeof NODE_TYPES.screenRegion)[1];
	props?: {
		layout: FlexLayoutProps;
		scroll: boolean;
	};
	children: RenderTreeNode[];
};

export type RenderTreeScreenBottomNode = Omit<RenderTreeNode, "props" | "children"> & {
	type: (typeof NODE_TYPES.screenRegion)[2];
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: RenderTreeNode[];
};

export type RenderTreeScreenNode = Omit<RenderTreeNode, "children"> & {
	type: (typeof NODE_TYPES.screenRoot)[0];
	children: [RenderTreeScreenHeaderNode, RenderTreeScreenContentsNode, RenderTreeScreenBottomNode];
};

export type RenderTreeFlexLayoutProps = FlexLayoutProps;
export type RenderTreeGridLayoutProps = GridLayoutProps;

export type RenderTreeLayoutFlexNode = Omit<RenderTreeNode, "props"> & {
	type: (typeof NODE_TYPES.layout)[0];
	props: RenderTreeFlexLayoutProps;
};

export type RenderTreeLayoutGridNode = Omit<RenderTreeNode, "props"> & {
	type: (typeof NODE_TYPES.layout)[1];
	props: RenderTreeGridLayoutProps;
};

export interface RenderTree {
	version: string;
	minRendererVersion?: string;
	metadata: RenderTreeMetadata;
	theme?: {
		mode?: "light" | "dark" | "system";
		primaryColor?: string;
		fontFamily?: string;
	};
	data?: Record<string, unknown>;
	children: RenderTreeNode[];
}

export interface RenderTreeStats {
	totalNodes: number;
	maxDepth: number;
	componentTypes: string[];
	fallbackTypes: string[];
	rendererKinds: string[];
}

export function isBindingValue(value: PropValue): value is PropBinding {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		"bind" in value &&
		typeof (value as PropBinding).bind === "string"
	);
}
