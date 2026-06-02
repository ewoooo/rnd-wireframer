import {
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
					select: "screen_region_id,area_id,order_index",
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
					select: "area_id,component_id,order_index",
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
					select: "component_id,order_index,catalog_component_type,variant,props",
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

function readRequiredEnv(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required server env: ${key}`);
	return value;
}

function compareScreenSummaryRows(left: ScreenSummaryRow, right: ScreenSummaryRow) {
	return (
		readModuleSortOrder(left.moduleId) - readModuleSortOrder(right.moduleId) ||
		(left.screenVariantOrder ?? Number.MAX_SAFE_INTEGER) -
			(right.screenVariantOrder ?? Number.MAX_SAFE_INTEGER) ||
		left.order - right.order ||
		left.id.localeCompare(right.id)
	);
}

function readModuleSortOrder(moduleId?: string) {
	if (moduleId === "preview") return 0;
	if (moduleId === "mbr") return 1;
	return Number.MAX_SAFE_INTEGER;
}
