import type { SCHEMA_VERSION } from "./versions";

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
