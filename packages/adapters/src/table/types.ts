import type {
	RenderTreeNodeContract,
	RenderTreeScreenBottomNodeContract,
	RenderTreeScreenContentsNodeContract,
	RenderTreeScreenHeaderNodeContract,
	RenderTreeScreenNodeContract,
	SchemaPropValue,
} from "@cx/schema";

export type MaterializeDiagnostic = {
	code:
		| "duplicate_region"
		| "invalid_child_order"
		| "missing_area"
		| "missing_component"
		| "missing_region"
		| "missing_screen";
	id: string;
	parentId?: string;
	severity: "error" | "warning";
};

export type MaterializeRenderScreenResult = {
	diagnostics: MaterializeDiagnostic[];
	node?: MaterializedRenderTreeScreenNode;
};

export type MaterializeRenderNodeResult = {
	diagnostics: MaterializeDiagnostic[];
	node?: MaterializedRenderTreeNode;
};

export type RenderScreenRow = {
	author?: string | null;
	description?: string | null;
	id: string;
	layout_id?: string | null;
	name: string;
	order_index?: number | null;
	screen_variant_id?: string | null;
	type?: "bottomsheet" | "page" | "popup" | string;
	version?: string | null;
};

export type RenderScreenRegionRow = {
	id: string;
	layout_id?: string | null;
	screen_id: string;
	type: "bottom" | "contents" | "header" | string;
};

export type RenderScreenRegionChildRow = {
	area_id: string;
	id?: string;
	order_index: number;
	screen_region_id: string;
};

export type RenderAreaRow = {
	author?: string | null;
	description?: string | null;
	id: string;
	layout_id?: string | null;
	name: string;
	props?: Record<string, SchemaPropValue> | null;
	type: "area_dynamic" | "area_static" | string;
	version?: string | null;
};

export type RenderAreaChildRow = {
	area_id: string;
	component_id: string;
	id?: string;
	order_index: number;
};

export type RenderComponentRow = {
	author?: string | null;
	description?: string | null;
	display?: RenderTreeNodeContract["display"] | null;
	hooks?: unknown;
	id: string;
	layout_id?: string | null;
	name: string;
	type: string;
	version?: string | null;
};

export type RenderComponentChildRow = {
	catalog_component_type: string;
	component_id: string;
	id?: string;
	order_index: number;
	props?: Record<string, SchemaPropValue> | null;
	variant?: string | null;
};

export type RenderReadModelRows = {
	areaChildren: RenderAreaChildRow[];
	areas: RenderAreaRow[];
	componentChildren: RenderComponentChildRow[];
	components: RenderComponentRow[];
	screenRegionChildren: RenderScreenRegionChildRow[];
	screenRegions: RenderScreenRegionRow[];
	screens: RenderScreenRow[];
};

export type MaterializedRenderTreeNode = RenderTreeNodeContract;
export type MaterializedRenderTreeScreenHeaderNode = RenderTreeScreenHeaderNodeContract;
export type MaterializedRenderTreeScreenContentsNode = RenderTreeScreenContentsNodeContract;
export type MaterializedRenderTreeScreenBottomNode = RenderTreeScreenBottomNodeContract;
export type MaterializedRenderTreeScreenNode = RenderTreeScreenNodeContract;
