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
import { inFilter, readScreenDbRows, SCREEN_DB_TABLES, uniqueIds } from "./screen-db-rest";
import { getScreenModuleSortOrder } from "./screen-module";

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

export async function listScreenRoutes(): Promise<ScreenRouteSummary[]> {
	const routes = await readScreenDbRows<RenderScreenRouteRow>(SCREEN_DB_TABLES.screenRoutes, {
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
		readScreenDbRows<RenderScreenRouteRow>(SCREEN_DB_TABLES.screenRoutes, {
			order: "order_index.asc,id.asc",
			select: "id,module_id,name,order_index,process_id",
		}),
		readScreenDbRows<RenderScreenVariantRow>(SCREEN_DB_TABLES.screenVariants, {
			order: "order_index.asc,id.asc",
			screen_route_id: routeId ? `eq.${routeId}` : undefined,
			select: "id,name,order_index,screen_route_id,type",
		}),
		readScreenDbRows<RenderScreenRow>(SCREEN_DB_TABLES.screens, {
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
	const screens = await readScreenDbRows<RenderScreenRow>(SCREEN_DB_TABLES.screens, {
		id: `eq.${screenId}`,
		select: "id,screen_variant_id,version,type,layout_id,order_index,name,description,author",
	});
	const screenRegions = await readScreenDbRows<RenderScreenRegionRow>(
		SCREEN_DB_TABLES.screenRegions,
		{
			screen_id: `eq.${screenId}`,
			select: "id,screen_id,type,layout_id",
		},
	);
	const screenRegionIds = screenRegions.map((region) => region.id);
	const screenRegionChildren =
		screenRegionIds.length > 0
			? await readScreenDbRows<RenderScreenRegionChildRow>(SCREEN_DB_TABLES.screenRegionChildren, {
					screen_region_id: inFilter(screenRegionIds),
					select: "id,screen_region_id,area_id,order_index",
				})
			: [];
	const areaIds = uniqueIds(screenRegionChildren.map((child) => child.area_id));
	const areas =
		areaIds.length > 0
			? await readScreenDbRows<RenderAreaRow>(SCREEN_DB_TABLES.areas, {
					id: inFilter(areaIds),
					select: "id,type,version,layout_id,name,description,author,props",
				})
			: [];
	const areaChildren =
		areaIds.length > 0
			? await readScreenDbRows<RenderAreaChildRow>(SCREEN_DB_TABLES.areaChildren, {
					area_id: inFilter(areaIds),
					select: "id,area_id,component_id,order_index",
				})
			: [];
	const componentIds = uniqueIds(areaChildren.map((child) => child.component_id));
	const components =
		componentIds.length > 0
			? await readScreenDbRows<RenderComponentRow>(SCREEN_DB_TABLES.components, {
					id: inFilter(componentIds),
					select: "id,type,version,layout_id,name,description,author,display,hooks",
				})
			: [];
	const componentChildren =
		componentIds.length > 0
			? await readScreenDbRows<RenderComponentChildRow>(SCREEN_DB_TABLES.componentChildren, {
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

function compareScreenSummaryRows(left: ScreenSummaryRow, right: ScreenSummaryRow) {
	return (
		getScreenModuleSortOrder(left.moduleId) - getScreenModuleSortOrder(right.moduleId) ||
		(left.screenVariantOrder ?? Number.MAX_SAFE_INTEGER) -
			(right.screenVariantOrder ?? Number.MAX_SAFE_INTEGER) ||
		left.order - right.order ||
		left.id.localeCompare(right.id)
	);
}
