import type { SchemaPropValue } from "@cx/schema";

export type TableChildRef = {
	id: string;
	kind: "area" | "component";
};

export type TableScreenRegionRecord = {
	children?: TableChildRef[];
	layout?: string;
	metadata?: {
		title?: string;
	};
	type?: "Screen.Bottom" | "Screen.Contents" | "Screen.Header";
};

export type TableScreenRecord = {
	id: string;
	layout?: string;
	metadata?: {
		description?: string;
		title?: string;
	};
	screen?: {
		regions?: {
			bottom?: TableScreenRegionRecord;
			contents?: TableScreenRegionRecord;
			header?: TableScreenRegionRecord;
		};
	};
	version?: string;
};

export type TableAreaRecord = {
	children?: TableChildRef[];
	id: string;
	layout?: string;
	metadata?: {
		description?: string;
		title?: string;
	};
	props?: Record<string, SchemaPropValue>;
	type: "area.dynamic" | "area.static";
	version?: string;
};

export type TableComponentRecord = {
	children?: Array<{
		component?: {
			type?: string;
		};
		props?: Record<string, SchemaPropValue>;
	}>;
	id: string;
	layout?: string;
	metadata?: {
		description?: string;
		title?: string;
	};
	type: string;
	version?: string;
};

export type TableScreenData = {
	areas: {
		areas: TableAreaRecord[];
	};
	components: {
		components: TableComponentRecord[];
	};
	screens: {
		screens: TableScreenRecord[];
	};
};

export type MaterializedRenderTreeNode = {
	children?: MaterializedRenderTreeNode[];
	componentVersion: string;
	layout?: string;
	metadata: {
		description?: string;
		id: string;
		title: string;
	};
	props?: Record<string, SchemaPropValue>;
	type: string;
};

export type MaterializedFlexLayoutProps = {
	direction: "row" | "column";
	align?: "center" | "end" | "start" | "stretch";
	gap?: number;
	justify?: "between" | "center" | "end" | "start";
	paddingX?: number;
	paddingY?: number;
};

export type MaterializedRenderTreeScreenHeaderNode = Omit<
	MaterializedRenderTreeNode,
	"children" | "props" | "type"
> & {
	type: "Screen.Header";
	children?: MaterializedRenderTreeNode[];
	props?: {
		position: "fixed" | "static" | "sticky";
		layout: MaterializedFlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
};

export type MaterializedRenderTreeScreenContentsNode = Omit<
	MaterializedRenderTreeNode,
	"children" | "props" | "type"
> & {
	type: "Screen.Contents";
	children: MaterializedRenderTreeNode[];
	props?: {
		layout: MaterializedFlexLayoutProps;
		scroll: boolean;
	};
};

export type MaterializedRenderTreeScreenBottomNode = Omit<
	MaterializedRenderTreeNode,
	"children" | "props" | "type"
> & {
	type: "Screen.Bottom";
	children?: MaterializedRenderTreeNode[];
	props?: {
		position: "fixed" | "static" | "sticky";
		layout: MaterializedFlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
};

export type MaterializedRenderTreeScreenNode = Omit<MaterializedRenderTreeNode, "children"> & {
	type: "Screen";
	children: [
		MaterializedRenderTreeScreenHeaderNode,
		MaterializedRenderTreeScreenContentsNode,
		MaterializedRenderTreeScreenBottomNode,
	];
};
