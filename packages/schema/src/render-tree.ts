import type { SCHEMA_VERSION } from "./versions";

export const RENDER_TREE_NODE_TYPE = {
	areaDynamic: "area.dynamic",
	areaStatic: "area.static",
	layoutFlex: "Layout.Flex",
	layoutGrid: "Layout.Grid",
	screen: "Screen",
	screenBottom: "Screen.Bottom",
	screenContents: "Screen.Contents",
	screenHeader: "Screen.Header",
} as const;

export const RENDER_TREE_AREA_NODE_TYPES = [
	RENDER_TREE_NODE_TYPE.areaStatic,
	RENDER_TREE_NODE_TYPE.areaDynamic,
] as const;

export const RENDER_TREE_SCREEN_REGION_NODE_TYPES = [
	RENDER_TREE_NODE_TYPE.screenHeader,
	RENDER_TREE_NODE_TYPE.screenContents,
	RENDER_TREE_NODE_TYPE.screenBottom,
] as const;

export type RenderTreeAreaNodeType = (typeof RENDER_TREE_AREA_NODE_TYPES)[number];
export type RenderTreeScreenRegionNodeType =
	(typeof RENDER_TREE_SCREEN_REGION_NODE_TYPES)[number];

export type SchemaPropBinding = {
	bind: string;
	default?: string | number | boolean | null;
};

export type SchemaPropValue =
	| string
	| number
	| boolean
	| null
	| SchemaPropValue[]
	| { [key: string]: SchemaPropValue }
	| SchemaPropBinding;

export type RenderTreeMetadata = {
	id: string;
	author?: string;
	createdAt?: string;
	description?: string;
	updatedAt?: string;
};

export type RenderTreeNodeMetadata = RenderTreeMetadata & {
	title: string;
};

export type RenderTreeNodeContract = {
	children?: RenderTreeNodeContract[];
	componentVersion: string;
	display?: {
		stateRole?: "base" | "disabled" | "empty" | "error" | "expanded" | "loading" | "success";
		when?: SchemaPropBinding | boolean;
	};
	layout?: string;
	metadata: RenderTreeNodeMetadata;
	props?: Record<string, SchemaPropValue>;
	type: string;
};

export type RenderTreeFlexLayoutProps = {
	direction: "row" | "column";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type RenderTreeGridLayoutProps = {
	columns?: string;
	rows?: string;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "stretch";
};

export type RenderTreeScreenHeaderNodeContract = Omit<
	RenderTreeNodeContract,
	"children" | "props" | "type"
> & {
	type: "Screen.Header";
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: RenderTreeFlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: RenderTreeNodeContract[];
};

export type RenderTreeScreenContentsNodeContract = Omit<
	RenderTreeNodeContract,
	"children" | "props" | "type"
> & {
	type: "Screen.Contents";
	props?: {
		layout: RenderTreeFlexLayoutProps;
		scroll: boolean;
	};
	children: RenderTreeNodeContract[];
};

export type RenderTreeScreenBottomNodeContract = Omit<
	RenderTreeNodeContract,
	"children" | "props" | "type"
> & {
	type: "Screen.Bottom";
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: RenderTreeFlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: RenderTreeNodeContract[];
};

export type RenderTreeScreenNodeContract = Omit<RenderTreeNodeContract, "children" | "type"> & {
	type: "Screen";
	children: [
		RenderTreeScreenHeaderNodeContract,
		RenderTreeScreenContentsNodeContract,
		RenderTreeScreenBottomNodeContract,
	];
};

export type RenderTreeLayoutFlexNodeContract = Omit<RenderTreeNodeContract, "props" | "type"> & {
	type: "Layout.Flex";
	props: RenderTreeFlexLayoutProps;
};

export type RenderTreeLayoutGridNodeContract = Omit<RenderTreeNodeContract, "props" | "type"> & {
	type: "Layout.Grid";
	props: RenderTreeGridLayoutProps;
};

export type RenderTreeContract = {
	children: RenderTreeNodeContract[];
	data?: Record<string, unknown>;
	metadata: RenderTreeMetadata;
	minRendererVersion?: string;
	theme?: {
		fontFamily?: string;
		mode?: "dark" | "light" | "system";
		primaryColor?: string;
	};
	version: typeof SCHEMA_VERSION.renderTree;
};

export function isRenderTreeAreaNodeType(type: string): type is RenderTreeAreaNodeType {
	return (RENDER_TREE_AREA_NODE_TYPES as readonly string[]).includes(type);
}

export function isRenderTreeScreenRegionNodeType(
	type: string,
): type is RenderTreeScreenRegionNodeType {
	return (RENDER_TREE_SCREEN_REGION_NODE_TYPES as readonly string[]).includes(type);
}

export function isRenderTreeAreaNode(node: RenderTreeNodeContract): boolean {
	return isRenderTreeAreaNodeType(node.type);
}

export function isRenderTreeScreenRegionNode(
	node: RenderTreeNodeContract,
): node is
	| RenderTreeScreenBottomNodeContract
	| RenderTreeScreenContentsNodeContract
	| RenderTreeScreenHeaderNodeContract {
	return isRenderTreeScreenRegionNodeType(node.type);
}
