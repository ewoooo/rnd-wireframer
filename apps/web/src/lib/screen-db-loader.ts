import {
	materializeRenderAreaFromRows,
	materializeRenderComponentFromRows,
	type MaterializeRenderScreenResult,
	materializeRenderScreenFromRows,
	type RenderAreaChildRow,
	type RenderAreaRow,
	type RenderComponentChildRow,
	type RenderComponentRow,
	type RenderReadModelRows,
	type RenderScreenRegionChildRow,
	type RenderScreenRegionRow,
	type RenderScreenRow,
} from "@cx/adapters/table";
import type { PuckCatalogItem } from "@cx/adapters/puck";
import { getScreenModuleSortOrder } from "./screen-module";
import { readRequiredEnv } from "./server-env";

export type ScreenRouteSummary = {
	id: string;
	moduleId?: string;
	name: string;
	order: number;
	processId?: string;
};

export type ScreenSummaryRow = {
	description?: string;
	id: string;
	moduleId?: string;
	order: number;
	route?: string;
	screenRouteId?: string;
	screenVariantId?: string;
	screenVariantName?: string;
	screenVariantOrder?: number;
	sourcePath: string;
	status: "screen-db";
	title: string;
	type?: string;
	variantType?: string;
};

export type PuckCatalogScope = "area" | "screen-region";

type RenderScreenRouteRow = {
	id: string;
	module_id?: string | null;
	name: string;
	order_index: number;
	process_id?: string | null;
};

type RenderScreenVariantRow = {
	id: string;
	name: string;
	order_index: number;
	screen_route_id: string;
	type?: string | null;
};

const SCREEN_DB_SOURCE_PATH = "supabase:screen-db";
const TABLES = {
	areaChildren: "render_area_children",
	areas: "render_areas",
	componentChildren: "render_component_children",
	components: "render_components",
	screenRegionChildren: "render_screen_region_children",
	screenRegions: "render_screen_regions",
	screenRoutes: "render_screen_routes",
	screenVariants: "render_screen_variants",
	screens: "render_screens",
} as const;

const PUCK_CATALOG_ITEM_PREFIX_BY_SCOPE = {
	area: "component",
	"screen-region": "area",
} as const satisfies Record<PuckCatalogScope, string>;

export async function listScreenRoutes(): Promise<ScreenRouteSummary[]> {
	const routes = await readRestRows<RenderScreenRouteRow>(TABLES.screenRoutes, {
		order: "order_index.asc,id.asc",
		select: "id,module_id,name,order_index,process_id",
	});

	return routes.map((route) => ({
		id: route.id,
		moduleId: route.module_id ?? undefined,
		name: route.name,
		order: route.order_index,
		processId: route.process_id ?? undefined,
	}));
}

export async function listScreens(routeId?: string): Promise<ScreenSummaryRow[]> {
	const [routes, variants, screens] = await Promise.all([
		readRestRows<RenderScreenRouteRow>(TABLES.screenRoutes, {
			order: "order_index.asc,id.asc",
			select: "id,module_id,name,order_index,process_id",
		}),
		readRestRows<RenderScreenVariantRow>(TABLES.screenVariants, {
			order: "order_index.asc,id.asc",
			screen_route_id: routeId ? `eq.${routeId}` : undefined,
			select: "id,name,order_index,screen_route_id,type",
		}),
		readRestRows<RenderScreenRow>(TABLES.screens, {
			order: "order_index.asc,id.asc",
			select: "id,screen_variant_id,version,type,layout_id,order_index,name,description,author",
		}),
	]);
	const routesById = new Map(routes.map((route) => [route.id, route]));
	const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

	return screens
		.flatMap((screen) => {
			const variant = variantsById.get(screen.screen_variant_id ?? "");
			if (!variant) return [];
			const route = routesById.get(variant.screen_route_id);
			return [
				{
					description: screen.description ?? undefined,
					id: screen.id,
					moduleId: route?.module_id ?? undefined,
					order: screen.order_index ?? 0,
					route: route?.name,
					screenRouteId: variant.screen_route_id,
					screenVariantId: variant.id,
					screenVariantName: variant.name,
					screenVariantOrder: variant.order_index,
					sourcePath: SCREEN_DB_SOURCE_PATH,
					status: "screen-db" as const,
					title: screen.name,
					type: screen.type,
					variantType: variant.type ?? undefined,
				},
			];
		})
		.sort(compareScreenSummaryRows);
}

export async function loadScreenRows(screenId: string): Promise<RenderReadModelRows> {
	const screens = await readRestRows<RenderScreenRow>(TABLES.screens, {
		id: `eq.${screenId}`,
		select: "id,screen_variant_id,version,type,layout_id,order_index,name,description,author",
	});
	const screenRegions = await readRestRows<RenderScreenRegionRow>(TABLES.screenRegions, {
		screen_id: `eq.${screenId}`,
		select: "id,screen_id,type,layout_id",
	});
	const screenRegionIds = screenRegions.map((region) => region.id);
	const screenRegionChildren =
		screenRegionIds.length > 0
			? await readRestRows<RenderScreenRegionChildRow>(TABLES.screenRegionChildren, {
					screen_region_id: inFilter(screenRegionIds),
					select: "id,screen_region_id,area_id,order_index",
				})
			: [];
	const areaIds = unique(screenRegionChildren.map((child) => child.area_id));
	const areas =
		areaIds.length > 0
			? await readRestRows<RenderAreaRow>(TABLES.areas, {
					id: inFilter(areaIds),
					select: "id,type,version,layout_id,name,description,author,props",
				})
			: [];
	const areaChildren =
		areaIds.length > 0
			? await readRestRows<RenderAreaChildRow>(TABLES.areaChildren, {
					area_id: inFilter(areaIds),
					select: "id,area_id,component_id,order_index",
				})
			: [];
	const componentIds = unique(areaChildren.map((child) => child.component_id));
	const components =
		componentIds.length > 0
			? await readRestRows<RenderComponentRow>(TABLES.components, {
					id: inFilter(componentIds),
					select: "id,type,version,layout_id,name,description,author,display,hooks",
				})
			: [];
	const componentChildren =
		componentIds.length > 0
			? await readRestRows<RenderComponentChildRow>(TABLES.componentChildren, {
					component_id: inFilter(componentIds),
					select: "id,component_id,order_index,catalog_component_type,variant,props",
				})
			: [];

	return {
		areaChildren,
		areas,
		componentChildren,
		components,
		screenRegionChildren,
		screenRegions,
		screens,
	};
}

export async function loadScreenTree(screenId: string): Promise<MaterializeRenderScreenResult> {
	return materializeRenderScreenFromRows({
		rows: await loadScreenRows(screenId),
		screenId,
	});
}

export async function listPuckCatalogItems(
	scope: PuckCatalogScope,
): Promise<PuckCatalogItem[]> {
	const loaders = {
		area: listPuckComponentCatalogItems,
		"screen-region": listPuckAreaCatalogItems,
	} as const satisfies Record<PuckCatalogScope, () => Promise<PuckCatalogItem[]>>;

	return loaders[scope]();
}

async function listPuckAreaCatalogItems(): Promise<PuckCatalogItem[]> {
	const areas = await readRestRows<RenderAreaRow>(TABLES.areas, {
		order: "name.asc,id.asc",
		select: "id,type,version,layout_id,name,description,author,props",
	});
	const areaIds = areas.map((area) => area.id);
	const areaChildren =
		areaIds.length > 0
			? await readRestRows<RenderAreaChildRow>(TABLES.areaChildren, {
					area_id: inFilter(areaIds),
					order: "area_id.asc,order_index.asc",
					select: "id,area_id,component_id,order_index",
				})
			: [];
	const componentIds = unique(areaChildren.map((child) => child.component_id));
	const [components, componentChildren] = await readComponentsWithChildren(componentIds);
	const rows = createRenderRows({
		areaChildren,
		areas,
		componentChildren,
		components,
	});

	return areas.flatMap((area) => {
		const result = materializeRenderAreaFromRows({ areaId: area.id, rows });
		return result.node ? [renderTreeNodeToPuckCatalogItem(result.node, "screen-region")] : [];
	});
}

async function listPuckComponentCatalogItems(): Promise<PuckCatalogItem[]> {
	const components = await readRestRows<RenderComponentRow>(TABLES.components, {
		order: "name.asc,id.asc",
		select: "id,type,version,layout_id,name,description,author,display,hooks",
	});
	const componentIds = components.map((component) => component.id);
	const componentChildren =
		componentIds.length > 0
			? await readRestRows<RenderComponentChildRow>(TABLES.componentChildren, {
					component_id: inFilter(componentIds),
					order: "component_id.asc,order_index.asc",
					select: "id,component_id,order_index,catalog_component_type,variant,props",
				})
			: [];
	const rows = createRenderRows({ componentChildren, components });

	return components.flatMap((component) => {
		const result = materializeRenderComponentFromRows({ componentId: component.id, rows });
		return result.node ? [renderTreeNodeToPuckCatalogItem(result.node, "area")] : [];
	});
}

async function readComponentsWithChildren(
	componentIds: string[],
): Promise<[RenderComponentRow[], RenderComponentChildRow[]]> {
	if (componentIds.length === 0) return [[], []];

	return Promise.all([
		readRestRows<RenderComponentRow>(TABLES.components, {
			id: inFilter(componentIds),
			order: "name.asc,id.asc",
			select: "id,type,version,layout_id,name,description,author,display,hooks",
		}),
		readRestRows<RenderComponentChildRow>(TABLES.componentChildren, {
			component_id: inFilter(componentIds),
			order: "component_id.asc,order_index.asc",
			select: "id,component_id,order_index,catalog_component_type,variant,props",
		}),
	]);
}

function createRenderRows(input: {
	areaChildren?: RenderAreaChildRow[];
	areas?: RenderAreaRow[];
	componentChildren?: RenderComponentChildRow[];
	components?: RenderComponentRow[];
}): RenderReadModelRows {
	return {
		areaChildren: input.areaChildren ?? [],
		areas: input.areas ?? [],
		componentChildren: input.componentChildren ?? [],
		components: input.components ?? [],
		screenRegionChildren: [],
		screenRegions: [],
		screens: [],
	};
}

function renderTreeNodeToPuckCatalogItem(
	node: NonNullable<ReturnType<typeof materializeRenderAreaFromRows>["node"]>,
	scope: PuckCatalogScope,
): PuckCatalogItem {
	const prefix = PUCK_CATALOG_ITEM_PREFIX_BY_SCOPE[scope];
	return {
		componentVersion: node.componentVersion,
		defaultChildren: node.children,
		defaultProps: node.props,
		nodeId: node.metadata.id,
		nodeType: node.type,
		puckType: `catalog:${prefix}:${node.metadata.id}`,
		title: node.metadata.title,
	};
}

async function readRestRows<Row>(
	tableName: string,
	query: Record<string, string | undefined>,
): Promise<Row[]> {
	const response = await fetch(buildRestUrl(tableName, query), {
		headers: {
			apikey: readSupabaseServiceRoleKey(),
			Authorization: `Bearer ${readSupabaseServiceRoleKey()}`,
		},
		cache: "no-store",
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB request failed for ${tableName}: ${response.status} ${message}`);
	}

	return (await response.json()) as Row[];
}

function buildRestUrl(tableName: string, query: Record<string, string | undefined>): URL {
	const url = new URL(`/rest/v1/${tableName}`, readSupabaseUrl());
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined) url.searchParams.set(key, value);
	}
	return url;
}

function inFilter(values: string[]): string {
	return `in.(${values.join(",")})`;
}

function unique(values: string[]): string[] {
	return Array.from(new Set(values));
}

function readSupabaseUrl(): string {
	return readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function readSupabaseServiceRoleKey(): string {
	return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function compareScreenSummaryRows(left: ScreenSummaryRow, right: ScreenSummaryRow) {
	return (
		getScreenModuleSortOrder(left.moduleId) - getScreenModuleSortOrder(right.moduleId) ||
		(left.screenVariantOrder ?? Number.MAX_SAFE_INTEGER) -
			(right.screenVariantOrder ?? Number.MAX_SAFE_INTEGER) ||
		left.order - right.order ||
		left.id.localeCompare(right.id)
	);
}
