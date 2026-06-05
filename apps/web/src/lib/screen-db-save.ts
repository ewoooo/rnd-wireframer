import type {
	RenderAreaChildRow,
	RenderComponentChildRow,
	RenderReadModelRows,
	RenderScreenRegionChildRow,
} from "@cx/adapters/table";
import {
	isRenderTreeAreaNode,
	isRenderTreeScreenRegionNode,
	type RenderTreeNodeContract,
	type RenderTreeScreenNodeContract,
	SCREEN_REGION_TYPE_BY_NODE_TYPE,
} from "@cx/schema";
import { loadScreenRows } from "./screen-db-loader";
import {
	deleteScreenDbRows,
	inFilter,
	SCREEN_DB_TABLES,
	uniqueIds,
	writeScreenDbRows,
} from "./screen-db-rest";

export type SaveScreenTreeOrderDiagnostic = {
	code:
		| "duplicate_area_in_region"
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
		areaIds: uniqueIds(projection.areaChildren.map((child) => child.area_id)),
		componentChildren: projection.componentChildren,
		componentIds: uniqueIds(projection.componentChildren.map((child) => child.component_id)),
		screenRegionChildren: projection.screenRegionChildren,
		screenRegionIds: uniqueIds(
			projection.screenRegionChildren.map((child) => child.screen_region_id),
		),
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
	const screenRegionChildIds = groupRowsByKey(
		input.rows.screenRegionChildren,
		(child) => `${child.screen_region_id}\u0000${child.area_id}`,
	);
	const areaChildIds = groupRowsByKey(
		input.rows.areaChildren,
		(child) => `${child.area_id}\u0000${child.component_id}`,
	);
	const projectedComponentIds = new Set<string>();

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

		const regionType = SCREEN_REGION_TYPE_BY_NODE_TYPE[regionNode.type];
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

		const consumedAreaIds = new Set<string>();
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
			if (consumedAreaIds.has(child.metadata.id)) {
				diagnostics.push({
					code: "duplicate_area_in_region",
					id: child.metadata.id,
					parentId: region.id,
					severity: "error",
				});
				continue;
			}
			consumedAreaIds.add(child.metadata.id);
			if (!areaIds.has(child.metadata.id)) {
				diagnostics.push({
					code: "missing_area",
					id: child.metadata.id,
					parentId: region.id,
					severity: "error",
				});
				continue;
			}

			const screenRegionChildId = takeRowId(
				screenRegionChildIds,
				`${region.id}\u0000${child.metadata.id}`,
			);
			screenRegionChildren.push({
				area_id: child.metadata.id,
				...withRowId(screenRegionChildId),
				order_index: index,
				screen_region_id: region.id,
			});
			const projectedArea = projectAreaChildren({
				area: child,
				areaChildIds,
				componentChildrenByComponentId,
				componentIds,
				diagnostics,
				projectedComponentIds,
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
	areaChildIds: Map<string, { id?: string }[]>;
	componentChildrenByComponentId: Map<string, RenderComponentChildRow[]>;
	componentIds: Set<string>;
	diagnostics: SaveScreenTreeOrderDiagnostic[];
	projectedComponentIds: Set<string>;
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

		const areaChildId = takeRowId(
			input.areaChildIds,
			`${input.area.metadata.id}\u0000${child.metadata.id}`,
		);
		areaChildren.push({
			area_id: input.area.metadata.id,
			component_id: child.metadata.id,
			...withRowId(areaChildId),
			order_index: index,
		});
		if (!input.projectedComponentIds.has(child.metadata.id)) {
			input.projectedComponentIds.add(child.metadata.id);
			componentChildren.push(
				...projectComponentChildren(child, input.componentChildrenByComponentId),
			);
		}
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
				...withRowId(existing?.id),
				order_index: 0,
				props: node.props ?? null,
				variant: existing?.variant ?? null,
			},
		];
	}

	const existingRowsByCatalogType = groupRowsByKey(
		existingRows,
		(row) => row.catalog_component_type,
	);
	return childNodes.map((child, index) => {
		const existing = takeComponentChild(existingRowsByCatalogType, child.type);
		return {
			catalog_component_type: child.type,
			component_id: node.metadata.id,
			...withRowId(existing?.id),
			order_index: index,
			props: child.props ?? null,
			variant: existing?.variant ?? null,
		};
	});
}

function groupRowsByKey<Row>(rows: Row[], readKey: (row: Row) => string): Map<string, Row[]> {
	const grouped = new Map<string, Row[]>();
	for (const row of rows) {
		const key = readKey(row);
		const siblings = grouped.get(key) ?? [];
		siblings.push(row);
		grouped.set(key, siblings);
	}
	return grouped;
}

function takeComponentChild(
	rowsByCatalogType: Map<string, RenderComponentChildRow[]>,
	catalogComponentType: string,
): RenderComponentChildRow | undefined {
	const rows = rowsByCatalogType.get(catalogComponentType) ?? [];
	const row = rows.shift();
	if (rows.length === 0) rowsByCatalogType.delete(catalogComponentType);
	return row;
}

function takeRowId(rowsByKey: Map<string, { id?: string }[]>, key: string): string | undefined {
	const rows = rowsByKey.get(key) ?? [];
	const row = rows.shift();
	if (rows.length === 0) rowsByKey.delete(key);
	return row?.id;
}

function withRowId(id: string | undefined): { id?: string } {
	return id ? { id } : {};
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
			? deleteScreenDbRows(SCREEN_DB_TABLES.areaChildren, { area_id: inFilter(input.areaIds) })
			: Promise.resolve(),
		input.componentIds.length > 0
			? deleteScreenDbRows(SCREEN_DB_TABLES.componentChildren, {
					component_id: inFilter(input.componentIds),
				})
			: Promise.resolve(),
		input.screenRegionIds.length > 0
			? deleteScreenDbRows(SCREEN_DB_TABLES.screenRegionChildren, {
					screen_region_id: inFilter(input.screenRegionIds),
				})
			: Promise.resolve(),
	]);
	await writeScreenDbRows(SCREEN_DB_TABLES.screenRegionChildren, input.screenRegionChildren);
	await writeScreenDbRows(SCREEN_DB_TABLES.areaChildren, input.areaChildren);
	await writeScreenDbRows(SCREEN_DB_TABLES.componentChildren, input.componentChildren);
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
