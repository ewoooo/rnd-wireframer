import type {
	RenderAreaChildRow,
	RenderAreaRow,
	RenderComponentChildRow,
	RenderComponentRow,
	RenderScreenRegionChildRow,
	RenderScreenRegionRow,
	RenderScreenRow,
} from "@cx/adapters/table";
import {
	isRenderTreeAreaNode,
	isRenderTreeScreenRegionNode,
	RENDER_TREE_NODE_TYPE,
	type RenderTreeNodeContract,
	type RenderTreeScreenNodeContract,
	type RenderTreeScreenRegionNodeType,
} from "@cx/schema";

export type ApplyScreenInferenceDiagnostic = {
	code: "missing_region" | "unsupported_area_child" | "unsupported_region_child";
	id: string;
	parentId?: string;
	severity: "error" | "warning";
};

export type ApplyScreenInferenceResult = {
	diagnostics: ApplyScreenInferenceDiagnostic[];
	rowCounts: Record<string, number>;
	screenId: string;
	written: boolean;
};

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

const REGION_TYPE_BY_NODE_TYPE = {
	[RENDER_TREE_NODE_TYPE.screenBottom]: "bottom",
	[RENDER_TREE_NODE_TYPE.screenContents]: "contents",
	[RENDER_TREE_NODE_TYPE.screenHeader]: "header",
} as const satisfies Record<RenderTreeScreenRegionNodeType, "bottom" | "contents" | "header">;

export async function applyScreenInferenceFinalResult(input: {
	node: RenderTreeScreenNodeContract;
}): Promise<ApplyScreenInferenceResult> {
	const projection = projectScreenInferenceFinalResult(input.node);

	if (projection.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
		return {
			diagnostics: projection.diagnostics,
			rowCounts: readProjectionRowCounts(projection),
			screenId: input.node.metadata.id,
			written: false,
		};
	}

	await replaceGeneratedScreenRows(projection);

	return {
		diagnostics: projection.diagnostics,
		rowCounts: readProjectionRowCounts(projection),
		screenId: input.node.metadata.id,
		written: true,
	};
}

type ScreenInferenceProjection = {
	areaChildren: RenderAreaChildRow[];
	areas: RenderAreaRow[];
	componentChildren: RenderComponentChildRow[];
	components: RenderComponentRow[];
	diagnostics: ApplyScreenInferenceDiagnostic[];
	screenRegionChildren: RenderScreenRegionChildRow[];
	screenRegions: RenderScreenRegionRow[];
	screenRoutes: Array<Record<string, unknown>>;
	screenVariants: Array<Record<string, unknown>>;
	screens: RenderScreenRow[];
};

function projectScreenInferenceFinalResult(
	node: RenderTreeScreenNodeContract,
): ScreenInferenceProjection {
	const diagnostics: ApplyScreenInferenceDiagnostic[] = [];
	const screenId = node.metadata.id;
	const screenRouteId = `${screenId}.route`;
	const screenVariantId = `${screenId}.variant`;
	const areasById = new Map<string, RenderAreaRow>();
	const componentsById = new Map<string, RenderComponentRow>();
	const screenRegions: RenderScreenRegionRow[] = [];
	const screenRegionChildren: RenderScreenRegionChildRow[] = [];
	const areaChildren: RenderAreaChildRow[] = [];
	const componentChildren: RenderComponentChildRow[] = [];

	for (const regionNode of node.children as readonly RenderTreeNodeContract[]) {
		if (!isRenderTreeScreenRegionNode(regionNode)) {
			diagnostics.push({
				code: "missing_region",
				id: regionNode.metadata.id,
				parentId: screenId,
				severity: "error",
			});
			continue;
		}

		const regionType = REGION_TYPE_BY_NODE_TYPE[regionNode.type];
		const screenRegionId = `${screenId}.${regionType}`;
		screenRegions.push({
			id: screenRegionId,
			layout_id: readLayoutId(regionNode),
			screen_id: screenId,
			type: regionType,
		});

		for (const [areaIndex, areaNode] of (regionNode.children ?? []).entries()) {
			if (!isRenderTreeAreaNode(areaNode)) {
				diagnostics.push({
					code: "unsupported_region_child",
					id: areaNode.metadata.id,
					parentId: screenRegionId,
					severity: "error",
				});
				continue;
			}

			areasById.set(areaNode.metadata.id, {
				author: areaNode.metadata.author ?? null,
				description: areaNode.metadata.description ?? null,
				id: areaNode.metadata.id,
				layout_id: readLayoutId(areaNode),
				name: areaNode.metadata.title ?? areaNode.metadata.id,
				props: areaNode.props ?? null,
				type: normalizeAreaType(areaNode.type),
				version: areaNode.componentVersion ?? "0.1.0",
			});
			screenRegionChildren.push({
				area_id: areaNode.metadata.id,
				id: `${screenRegionId}.${areaNode.metadata.id}.${areaIndex}`,
				order_index: areaIndex,
				screen_region_id: screenRegionId,
			});
			projectAreaChildren({
				areaChildren,
				areaNode,
				componentChildren,
				componentsById,
				diagnostics,
			});
		}
	}

	return {
		areaChildren,
		areas: Array.from(areasById.values()),
		componentChildren,
		components: Array.from(componentsById.values()),
		diagnostics,
		screenRegionChildren,
		screenRegions,
		screenRoutes: [
			{
				id: screenRouteId,
				module_id: null,
				name: node.metadata.title ?? screenId,
				order_index: 0,
				process_id: null,
			},
		],
		screenVariants: [
			{
				id: screenVariantId,
				name: "Default",
				order_index: 0,
				screen_route_id: screenRouteId,
				type: "default",
			},
		],
		screens: [
			{
				author: node.metadata.author ?? null,
				description: node.metadata.description ?? null,
				id: screenId,
				layout_id: readLayoutId(node),
				name: node.metadata.title ?? screenId,
				order_index: 0,
				screen_variant_id: screenVariantId,
				type: "page",
				version: node.componentVersion ?? "0.1.0",
			},
		],
	};
}

function projectAreaChildren(input: {
	areaChildren: RenderAreaChildRow[];
	areaNode: RenderTreeNodeContract;
	componentChildren: RenderComponentChildRow[];
	componentsById: Map<string, RenderComponentRow>;
	diagnostics: ApplyScreenInferenceDiagnostic[];
}) {
	for (const [componentIndex, componentNode] of (input.areaNode.children ?? []).entries()) {
		if (isRenderTreeAreaNode(componentNode) || isRenderTreeScreenRegionNode(componentNode)) {
			input.diagnostics.push({
				code: "unsupported_area_child",
				id: componentNode.metadata.id,
				parentId: input.areaNode.metadata.id,
				severity: "error",
			});
			continue;
		}

		input.componentsById.set(componentNode.metadata.id, {
			author: componentNode.metadata.author ?? null,
			description: componentNode.metadata.description ?? null,
			display: componentNode.display ?? null,
			hooks: null,
			id: componentNode.metadata.id,
			layout_id: readLayoutId(componentNode),
			name: componentNode.metadata.title ?? componentNode.metadata.id,
			type: componentNode.type,
			version: componentNode.componentVersion ?? "0.1.0",
		});
		input.areaChildren.push({
			area_id: input.areaNode.metadata.id,
			component_id: componentNode.metadata.id,
			id: `${input.areaNode.metadata.id}.${componentNode.metadata.id}.${componentIndex}`,
			order_index: componentIndex,
		});
		for (const [childIndex, childNode] of (componentNode.children ?? []).entries()) {
			input.componentChildren.push({
				catalog_component_type: childNode.type,
				component_id: componentNode.metadata.id,
				id: `${componentNode.metadata.id}.${childNode.type}.${childIndex}`,
				order_index: childIndex,
				props: childNode.props ?? null,
				variant: null,
			});
		}
	}
}

async function replaceGeneratedScreenRows(projection: ScreenInferenceProjection): Promise<void> {
	const screenRegionIds = projection.screenRegions.map((region) => region.id);
	const areaIds = projection.areas.map((area) => area.id);
	const componentIds = projection.components.map((component) => component.id);

	await Promise.all([
		screenRegionIds.length > 0
			? deleteRestRows(TABLES.screenRegionChildren, { screen_region_id: inFilter(screenRegionIds) })
			: Promise.resolve(),
		areaIds.length > 0
			? deleteRestRows(TABLES.areaChildren, { area_id: inFilter(areaIds) })
			: Promise.resolve(),
		componentIds.length > 0
			? deleteRestRows(TABLES.componentChildren, { component_id: inFilter(componentIds) })
			: Promise.resolve(),
	]);

	await upsertRestRows(TABLES.screenRoutes, projection.screenRoutes);
	await upsertRestRows(TABLES.screenVariants, projection.screenVariants);
	await upsertRestRows(TABLES.screens, projection.screens);
	await upsertRestRows(TABLES.screenRegions, projection.screenRegions);
	await upsertRestRows(TABLES.areas, projection.areas);
	await upsertRestRows(TABLES.components, projection.components);
	await upsertRestRows(TABLES.screenRegionChildren, projection.screenRegionChildren);
	await upsertRestRows(TABLES.areaChildren, projection.areaChildren);
	await upsertRestRows(TABLES.componentChildren, projection.componentChildren);
}

async function deleteRestRows(
	tableName: string,
	query: Record<string, string | undefined>,
): Promise<void> {
	const response = await fetch(buildRestUrl(tableName, query), {
		headers: restHeaders(),
		method: "DELETE",
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB delete failed for ${tableName}: ${response.status} ${message}`);
	}
}

async function upsertRestRows(tableName: string, rows: unknown[]): Promise<void> {
	if (rows.length === 0) return;

	const response = await fetch(buildRestUrl(tableName, { on_conflict: "id" }), {
		body: JSON.stringify(rows),
		headers: {
			...restHeaders(),
			Prefer: "resolution=merge-duplicates,return=minimal",
		},
		method: "POST",
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB upsert failed for ${tableName}: ${response.status} ${message}`);
	}
}

function buildRestUrl(tableName: string, query: Record<string, string | undefined>): URL {
	const url = new URL(`/rest/v1/${tableName}`, readSupabaseUrl());
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined) url.searchParams.set(key, value);
	}
	return url;
}

function restHeaders(): HeadersInit {
	return {
		apikey: readSupabaseServiceRoleKey(),
		Authorization: `Bearer ${readSupabaseServiceRoleKey()}`,
		"Content-Type": "application/json",
		Prefer: "return=minimal",
	};
}

function inFilter(values: string[]): string {
	return `in.(${values.join(",")})`;
}

function readLayoutId(node: RenderTreeNodeContract | RenderTreeScreenNodeContract): string | null {
	return typeof node.layout === "string" ? node.layout : null;
}

function normalizeAreaType(type: string): string {
	if (type === RENDER_TREE_NODE_TYPE.areaDynamic) return "area_dynamic";
	if (type === RENDER_TREE_NODE_TYPE.areaStatic) return "area_static";
	return type;
}

function readProjectionRowCounts(projection: ScreenInferenceProjection): Record<string, number> {
	return {
		render_area_children: projection.areaChildren.length,
		render_areas: projection.areas.length,
		render_component_children: projection.componentChildren.length,
		render_components: projection.components.length,
		render_screen_region_children: projection.screenRegionChildren.length,
		render_screen_regions: projection.screenRegions.length,
		render_screen_routes: projection.screenRoutes.length,
		render_screen_variants: projection.screenVariants.length,
		render_screens: projection.screens.length,
	};
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
