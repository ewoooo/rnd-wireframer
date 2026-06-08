import { createHash } from "node:crypto";

export type RenderDbRow = Record<string, unknown>;

export type RenderProjection = {
	areaChildren: RenderDbRow[];
	areas: RenderDbRow[];
	componentChildren: RenderDbRow[];
	components: RenderDbRow[];
	rowCounts: Record<string, number>;
	screenRegionChildren: RenderDbRow[];
	screenRegions: RenderDbRow[];
	screenRoutes: RenderDbRow[];
	screenVariants: RenderDbRow[];
	screens: RenderDbRow[];
};

export type CanonicalDuplicateGroup = {
	canonicalId: string;
	count: number;
	ids: string[];
	signature: string;
};

export type CanonicalizationReport = {
	areaDuplicateGroups: CanonicalDuplicateGroup[];
	areaIdMap: Record<string, string>;
	componentDuplicateGroups: CanonicalDuplicateGroup[];
	componentIdMap: Record<string, string>;
	rowCounts: Record<string, number>;
};

export type CanonicalizationResult = {
	projection: RenderProjection;
	report: CanonicalizationReport;
};

type RowGroup = {
	canonicalId: string;
	rows: RenderDbRow[];
	signature: string;
};

export function canonicalizeRenderProjection(projection: RenderProjection): CanonicalizationResult {
	const componentChildrenByComponentId = groupRowsByStringKey(
		projection.componentChildren,
		"component_id",
	);
	const componentGroups = groupBySignature(projection.components, (component) =>
		createComponentSignature(component, componentChildrenByComponentId),
	);
	const componentIdMap = buildIdMap(componentGroups);
	const canonicalComponents = componentGroups.map((group) =>
		renameRow(readRepresentative(group.rows), group.canonicalId),
	);
	const canonicalComponentChildren = componentGroups.flatMap((group) =>
		(componentChildrenByComponentId.get(readRequiredId(readRepresentative(group.rows))) ?? []).map(
			(child, index) =>
				stripRowId({
					...child,
					component_id: group.canonicalId,
					order_index: index,
				}),
		),
	);

	const canonicalAreaChildrenBeforeAreaDedupe = projection.areaChildren.map((child) =>
		stripRowId({
			...child,
			component_id: componentIdMap[String(child.component_id)] ?? child.component_id,
		}),
	);
	const areaChildrenByAreaId = groupRowsByStringKey(
		canonicalAreaChildrenBeforeAreaDedupe,
		"area_id",
	);
	const areaGroups = groupBySignature(projection.areas, (area) =>
		createAreaSignature(area, areaChildrenByAreaId),
	);
	const areaIdMap = buildIdMap(areaGroups);
	const canonicalAreas = areaGroups.map((group) =>
		renameRow(readRepresentative(group.rows), group.canonicalId),
	);
	const canonicalAreaChildren = areaGroups.flatMap((group) =>
		(areaChildrenByAreaId.get(readRequiredId(readRepresentative(group.rows))) ?? []).map(
			(child, index) =>
				stripRowId({
					...child,
					area_id: group.canonicalId,
					order_index: index,
				}),
		),
	);
	const canonicalScreenRegionChildren = projection.screenRegionChildren.map((child) =>
		stripRowId({
			...child,
			area_id: areaIdMap[String(child.area_id)] ?? child.area_id,
		}),
	);

	const canonicalProjection: RenderProjection = {
		...projection,
		areaChildren: canonicalAreaChildren,
		areas: canonicalAreas,
		componentChildren: canonicalComponentChildren,
		components: canonicalComponents,
		rowCounts: buildRowCounts({
			...projection,
			areaChildren: canonicalAreaChildren,
			areas: canonicalAreas,
			componentChildren: canonicalComponentChildren,
			components: canonicalComponents,
			screenRegionChildren: canonicalScreenRegionChildren,
		}),
		screenRegionChildren: canonicalScreenRegionChildren,
	};

	return {
		projection: canonicalProjection,
		report: {
			areaDuplicateGroups: toDuplicateGroups(areaGroups),
			areaIdMap,
			componentDuplicateGroups: toDuplicateGroups(componentGroups),
			componentIdMap,
			rowCounts: {
				after_render_area_children: canonicalAreaChildren.length,
				after_render_areas: canonicalAreas.length,
				after_render_component_children: canonicalComponentChildren.length,
				after_render_components: canonicalComponents.length,
				after_render_screen_region_children: canonicalScreenRegionChildren.length,
				before_render_area_children: projection.areaChildren.length,
				before_render_areas: projection.areas.length,
				before_render_component_children: projection.componentChildren.length,
				before_render_components: projection.components.length,
				before_render_screen_region_children: projection.screenRegionChildren.length,
			},
		},
	};
}

export function createComponentSignature(
	component: RenderDbRow,
	childrenByComponentId: Map<string, RenderDbRow[]>,
): string {
	const componentId = readRequiredId(component);
	const children = (childrenByComponentId.get(componentId) ?? []).map((child) => ({
		catalog_component_type: child.catalog_component_type ?? null,
		order_index: Number(child.order_index ?? 0),
		props: normalizeValue(child.props ?? null),
		variant: child.variant ?? null,
	}));
	children.sort(compareOrderThenJson);
	return stableStringify({
		children,
		display: normalizeValue(component.display ?? null),
		hooks: normalizeValue(component.hooks ?? null),
		layout_id: component.layout_id ?? null,
		type: component.type ?? null,
		version: component.version ?? null,
	});
}

export function createAreaSignature(
	area: RenderDbRow,
	childrenByAreaId: Map<string, RenderDbRow[]>,
): string {
	const areaId = readRequiredId(area);
	const children = (childrenByAreaId.get(areaId) ?? []).map((child) => ({
		component_id: child.component_id ?? null,
		order_index: Number(child.order_index ?? 0),
	}));
	children.sort(compareOrderThenJson);
	return stableStringify({
		children,
		layout_id: area.layout_id ?? null,
		props: normalizeValue(area.props ?? null),
		type: area.type ?? null,
		version: area.version ?? null,
	});
}

export function createCanonicalComponentId(signature: string, representative: RenderDbRow): string {
	return `component.${slugify(String(representative.type ?? "component"))}.${hashSignature(signature)}`;
}

export function createCanonicalAreaId(signature: string, representative: RenderDbRow): string {
	const seed = String(representative.layout_id ?? representative.type ?? "area");
	return `area.${slugify(seed.replace(/^layout\.area\./, ""))}.${hashSignature(signature)}`;
}

export function stableStringify(value: unknown): string {
	return JSON.stringify(normalizeValue(value));
}

export function hashSignature(signature: string): string {
	return createHash("sha256").update(signature).digest("hex").slice(0, 12);
}

function groupBySignature(
	rows: RenderDbRow[],
	readSignature: (row: RenderDbRow) => string,
): RowGroup[] {
	const groupsBySignature = new Map<string, RenderDbRow[]>();
	for (const row of rows) {
		const signature = readSignature(row);
		const group = groupsBySignature.get(signature) ?? [];
		group.push(row);
		groupsBySignature.set(signature, group);
	}
	return Array.from(groupsBySignature.entries())
		.map(([signature, rows]) => {
			const sortedRows = [...rows].sort(compareRowsById);
			const representative = readRepresentative(sortedRows);
			const canonicalId =
				sortedRows.length > 1
					? readCanonicalId(signature, representative)
					: readRequiredId(representative);
			return {
				canonicalId,
				rows: sortedRows,
				signature,
			};
		})
		.sort((left, right) => left.canonicalId.localeCompare(right.canonicalId));
}

function readCanonicalId(signature: string, representative: RenderDbRow): string {
	if (isComponentRow(representative)) return createCanonicalComponentId(signature, representative);
	return createCanonicalAreaId(signature, representative);
}

function isComponentRow(row: RenderDbRow): boolean {
	return typeof row.layout_id === "string" && row.layout_id.startsWith("layout.composite.");
}

function buildIdMap(groups: RowGroup[]): Record<string, string> {
	const idMap: Record<string, string> = {};
	for (const group of groups) {
		for (const row of group.rows) {
			idMap[readRequiredId(row)] = group.canonicalId;
		}
	}
	return idMap;
}

function toDuplicateGroups(groups: RowGroup[]): CanonicalDuplicateGroup[] {
	return groups
		.filter((group) => group.rows.length > 1)
		.map((group) => ({
			canonicalId: group.canonicalId,
			count: group.rows.length,
			ids: group.rows.map(readRequiredId),
			signature: group.signature,
		}))
		.sort(
			(left, right) =>
				right.count - left.count || left.canonicalId.localeCompare(right.canonicalId),
		);
}

function readRepresentative(rows: RenderDbRow[]): RenderDbRow {
	const [first] = rows;
	if (!first) throw new Error("Cannot choose a representative from an empty row group.");
	return first;
}

function renameRow(row: RenderDbRow, id: string): RenderDbRow {
	return {
		...row,
		id,
	};
}

function stripRowId(row: RenderDbRow): RenderDbRow {
	const { id: _id, ...rest } = row;
	return rest;
}

function readRequiredId(row: RenderDbRow): string {
	const id = row.id;
	if (typeof id !== "string" || !id) throw new Error("Render DB row is missing id.");
	return id;
}

function groupRowsByStringKey(rows: RenderDbRow[], key: string): Map<string, RenderDbRow[]> {
	const grouped = new Map<string, RenderDbRow[]>();
	for (const row of rows) {
		const value = row[key];
		if (typeof value !== "string" || !value) continue;
		const group = grouped.get(value) ?? [];
		group.push(row);
		grouped.set(value, group);
	}
	for (const group of grouped.values()) {
		group.sort((left, right) => Number(left.order_index ?? 0) - Number(right.order_index ?? 0));
	}
	return grouped;
}

function compareRowsById(left: RenderDbRow, right: RenderDbRow): number {
	return readRequiredId(left).localeCompare(readRequiredId(right));
}

function compareOrderThenJson(left: { order_index: number }, right: { order_index: number }) {
	return (
		left.order_index - right.order_index ||
		stableStringify(left).localeCompare(stableStringify(right))
	);
}

function normalizeValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalizeValue);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, child]) => [key, normalizeValue(child)]),
	);
}

function slugify(value: string): string {
	const ascii = value
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return ascii || "node";
}

function buildRowCounts(projection: Omit<RenderProjection, "rowCounts">): Record<string, number> {
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
