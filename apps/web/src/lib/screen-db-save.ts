import type {
	RenderAreaChildRow,
	RenderComponentChildRow,
	RenderReadModelRows,
	RenderScreenRegionChildRow,
} from "@cx/adapters/table";
import {
	isRenderTreeAreaNode,
	isRenderTreeScreenRegionNode,
	RENDER_TREE_NODE_TYPE,
	type RenderTreeNodeContract,
	type RenderTreeScreenNodeContract,
	type RenderTreeScreenRegionNodeType,
} from "@cx/schema";
import { loadScreenRows } from "./screen-db-loader";

export type SaveScreenTreeOrderDiagnostic = {
	code:
		| "missing_area"
		| "missing_component"
		| "missing_region"
		| "missing_screen"
		| "screen_id_mismatch"
		| "unsupported_area_child"
		| "unsupported_region_child";
	id: string;
	parentId?: string;
	severity: "error" | "warning";
};

export type SaveScreenTreeOrderProjection = {
	areaChildren: RenderAreaChildRow[];
	componentChildren: RenderComponentChildRow[];
	diagnostics: SaveScreenTreeOrderDiagnostic[];
	screenRegionChildren: RenderScreenRegionChildRow[];
};

export type SaveScreenTreeOrderResult = SaveScreenTreeOrderProjection & {
	written: boolean;
};

const TABLES = {
	areaChildren: "render_area_children",
	componentChildren: "render_component_children",
	screenRegionChildren: "render_screen_region_children",
} as const;

const REGION_TYPE_BY_NODE_TYPE = {
	[RENDER_TREE_NODE_TYPE.screenBottom]: "bottom",
	[RENDER_TREE_NODE_TYPE.screenContents]: "contents",
	[RENDER_TREE_NODE_TYPE.screenHeader]: "header",
} as const satisfies Record<RenderTreeScreenRegionNodeType, "bottom" | "contents" | "header">;

export async function saveScreenTreeOrder(input: {
	node: RenderTreeScreenNodeContract;
	screenId: string;
}): Promise<SaveScreenTreeOrderResult> {
	const rows = await loadScreenRows(input.screenId);
	const projection = projectScreenTreeOrder({
		node: input.node,
		rows,
		screenId: input.screenId,
	});

	if (projection.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
		return { ...projection, written: false };
	}

	await replaceScreenTreeOrderRows({
		areaChildren: projection.areaChildren,
		areaIds: unique(projection.areaChildren.map((child) => child.area_id)),
		componentChildren: projection.componentChildren,
		componentIds: unique(projection.componentChildren.map((child) => child.component_id)),
		screenRegionChildren: projection.screenRegionChildren,
		screenRegionIds: unique(projection.screenRegionChildren.map((child) => child.screen_region_id)),
	});

	return { ...projection, written: true };
}

export function projectScreenTreeOrder(input: {
	node: RenderTreeScreenNodeContract;
	rows: RenderReadModelRows;
	screenId: string;
}): SaveScreenTreeOrderProjection {
	const diagnostics: SaveScreenTreeOrderDiagnostic[] = [];
	const screen = input.rows.screens.find((candidate) => candidate.id === input.screenId);

	if (!screen) {
		return {
			areaChildren: [],
			componentChildren: [],
			diagnostics: [{ code: "missing_screen", id: input.screenId, severity: "error" }],
			screenRegionChildren: [],
		};
	}

	if (input.node.metadata.id !== input.screenId) {
		diagnostics.push({
			code: "screen_id_mismatch",
			id: input.node.metadata.id,
			parentId: input.screenId,
			severity: "error",
		});
	}

	const areaIds = new Set(input.rows.areas.map((area) => area.id));
	const componentIds = new Set(input.rows.components.map((component) => component.id));
	const regionByType = new Map(input.rows.screenRegions.map((region) => [region.type, region]));
	const screenRegionChildren: RenderScreenRegionChildRow[] = [];
	const areaChildren: RenderAreaChildRow[] = [];
	const componentChildren: RenderComponentChildRow[] = [];
	const componentChildrenByComponentId = groupComponentChildren(input.rows.componentChildren);

	for (const regionNode of input.node.children as readonly RenderTreeNodeContract[]) {
		if (!isRenderTreeScreenRegionNode(regionNode)) {
			diagnostics.push({
				code: "missing_region",
				id: regionNode.type,
				parentId: input.screenId,
				severity: "error",
			});
			continue;
		}

		const regionType = REGION_TYPE_BY_NODE_TYPE[regionNode.type];
		const region = regionByType.get(regionType);
		if (!region) {
			diagnostics.push({
				code: "missing_region",
				id: regionType,
				parentId: input.screenId,
				severity: "error",
			});
			continue;
		}

		for (const [index, child] of (regionNode.children ?? []).entries()) {
			if (!isRenderTreeAreaNode(child)) {
				diagnostics.push({
					code: "unsupported_region_child",
					id: child.metadata.id,
					parentId: region.id,
					severity: "error",
				});
				continue;
			}
			if (!areaIds.has(child.metadata.id)) {
				diagnostics.push({
					code: "missing_area",
					id: child.metadata.id,
					parentId: region.id,
					severity: "error",
				});
				continue;
			}

			screenRegionChildren.push({
				area_id: child.metadata.id,
				order_index: index,
				screen_region_id: region.id,
			});
			const projectedArea = projectAreaChildren({
				area: child,
				componentChildrenByComponentId,
				componentIds,
				diagnostics,
			});
			areaChildren.push(...projectedArea.areaChildren);
			componentChildren.push(...projectedArea.componentChildren);
		}
	}

	return {
		areaChildren,
		componentChildren,
		diagnostics,
		screenRegionChildren,
	};
}

function projectAreaChildren(input: {
	area: RenderTreeNodeContract;
	componentChildrenByComponentId: Map<string, RenderComponentChildRow[]>;
	componentIds: Set<string>;
	diagnostics: SaveScreenTreeOrderDiagnostic[];
}): {
	areaChildren: RenderAreaChildRow[];
	componentChildren: RenderComponentChildRow[];
} {
	const areaChildren: RenderAreaChildRow[] = [];
	const componentChildren: RenderComponentChildRow[] = [];

	for (const [index, child] of (input.area.children ?? []).entries()) {
		if (isRenderTreeAreaNode(child) || isRenderTreeScreenRegionNode(child)) {
			input.diagnostics.push({
				code: "unsupported_area_child",
				id: child.metadata.id,
				parentId: input.area.metadata.id,
				severity: "error",
			});
			continue;
		}
		if (!input.componentIds.has(child.metadata.id)) {
			input.diagnostics.push({
				code: "missing_component",
				id: child.metadata.id,
				parentId: input.area.metadata.id,
				severity: "error",
			});
			continue;
		}

		areaChildren.push({
			area_id: input.area.metadata.id,
			component_id: child.metadata.id,
			order_index: index,
		});
		componentChildren.push(
			...projectComponentChildren(child, input.componentChildrenByComponentId),
		);
	}

	return { areaChildren, componentChildren };
}

function projectComponentChildren(
	node: RenderTreeNodeContract,
	componentChildrenByComponentId: Map<string, RenderComponentChildRow[]>,
): RenderComponentChildRow[] {
	const existingRows = componentChildrenByComponentId.get(node.metadata.id) ?? [];
	const childNodes = node.children ?? [];

	if (childNodes.length === 0) {
		const existing = existingRows[0];
		return [
			{
				catalog_component_type: existing?.catalog_component_type ?? node.type,
				component_id: node.metadata.id,
				order_index: 0,
				props: node.props ?? null,
				variant: existing?.variant ?? null,
			},
		];
	}

	return childNodes.map((child, index) => {
		const existing = existingRows[index];
		return {
			catalog_component_type: child.type,
			component_id: node.metadata.id,
			order_index: index,
			props: child.props ?? null,
			variant: existing?.variant ?? null,
		};
	});
}

async function replaceScreenTreeOrderRows(input: {
	areaChildren: RenderAreaChildRow[];
	areaIds: string[];
	componentChildren: RenderComponentChildRow[];
	componentIds: string[];
	screenRegionChildren: RenderScreenRegionChildRow[];
	screenRegionIds: string[];
}): Promise<void> {
	await Promise.all([
		input.areaIds.length > 0
			? deleteRestRows(TABLES.areaChildren, { area_id: inFilter(input.areaIds) })
			: Promise.resolve(),
		input.componentIds.length > 0
			? deleteRestRows(TABLES.componentChildren, {
					component_id: inFilter(input.componentIds),
				})
			: Promise.resolve(),
		input.screenRegionIds.length > 0
			? deleteRestRows(TABLES.screenRegionChildren, {
					screen_region_id: inFilter(input.screenRegionIds),
				})
			: Promise.resolve(),
	]);
	await insertRestRows(TABLES.screenRegionChildren, input.screenRegionChildren);
	await insertRestRows(TABLES.areaChildren, input.areaChildren);
	await insertRestRows(TABLES.componentChildren, input.componentChildren);
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

async function insertRestRows(tableName: string, rows: unknown[]): Promise<void> {
	if (rows.length === 0) return;

	const response = await fetch(buildRestUrl(tableName, {}), {
		body: JSON.stringify(rows),
		headers: restHeaders(),
		method: "POST",
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB insert failed for ${tableName}: ${response.status} ${message}`);
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

function unique(values: string[]): string[] {
	return Array.from(new Set(values));
}

function groupComponentChildren(
	rows: RenderComponentChildRow[],
): Map<string, RenderComponentChildRow[]> {
	const grouped = new Map<string, RenderComponentChildRow[]>();
	for (const row of rows) {
		const siblings = grouped.get(row.component_id) ?? [];
		siblings.push(row);
		grouped.set(row.component_id, siblings);
	}
	for (const siblings of grouped.values()) {
		siblings.sort((left, right) => left.order_index - right.order_index);
	}
	return grouped;
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
