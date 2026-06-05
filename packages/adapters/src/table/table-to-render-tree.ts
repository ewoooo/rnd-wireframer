import {
	RENDER_TREE_NODE_TYPE,
	type RenderTreeAreaNodeType,
	type RenderTreeScreenRegionNodeType,
} from "@cx/schema";
import type {
	MaterializeDiagnostic,
	MaterializedRenderTreeNode,
	MaterializedRenderTreeScreenBottomNode,
	MaterializedRenderTreeScreenContentsNode,
	MaterializedRenderTreeScreenHeaderNode,
	MaterializeRenderNodeResult,
	MaterializeRenderScreenResult,
	RenderAreaChildRow,
	RenderAreaRow,
	RenderComponentChildRow,
	RenderComponentRow,
	RenderReadModelRows,
	RenderScreenRegionChildRow,
	RenderScreenRegionRow,
	RenderScreenRow,
} from "./types";

export type MaterializeRenderScreenFromRowsInput = {
	rows: RenderReadModelRows;
	screenId: string;
};

export type MaterializeRenderAreaFromRowsInput = {
	areaId: string;
	rows: RenderReadModelRows;
};

export type MaterializeRenderComponentFromRowsInput = {
	componentId: string;
	rows: RenderReadModelRows;
};

type ScreenRegionRowType = "bottom" | "contents" | "header";

const SCREEN_REGION_NODE_TYPE_BY_ROW_TYPE = {
	bottom: RENDER_TREE_NODE_TYPE.screenBottom,
	contents: RENDER_TREE_NODE_TYPE.screenContents,
	header: RENDER_TREE_NODE_TYPE.screenHeader,
} as const satisfies Record<ScreenRegionRowType, RenderTreeScreenRegionNodeType>;

const AREA_NODE_TYPE_BY_ROW_TYPE = {
	area_dynamic: RENDER_TREE_NODE_TYPE.areaDynamic,
	area_static: RENDER_TREE_NODE_TYPE.areaStatic,
} as const satisfies Record<string, RenderTreeAreaNodeType>;

export function materializeRenderScreenFromRows({
	rows,
	screenId,
}: MaterializeRenderScreenFromRowsInput): MaterializeRenderScreenResult {
	const diagnostics: MaterializeDiagnostic[] = [];
	const screen = rows.screens.find((candidate) => candidate.id === screenId);

	if (!screen) {
		return {
			diagnostics: [
				{
					code: "missing_screen",
					id: screenId,
					severity: "error",
				},
			],
		};
	}

	const indexes = buildRowIndexes(rows, diagnostics);
	const screenRegions = rows.screenRegions.filter((region) => region.screen_id === screenId);
	const header = materializeHeaderRegion(screen, screenRegions, indexes, diagnostics);
	const contents = materializeContentsRegion(screen, screenRegions, indexes, diagnostics);
	const bottom = materializeBottomRegion(screen, screenRegions, indexes, diagnostics);

	return {
		diagnostics,
		node: {
			type: RENDER_TREE_NODE_TYPE.screen,
			componentVersion: screen.version ?? "1.0.0",
			layout: screen.layout_id ?? undefined,
			metadata: {
				author: screen.author ?? undefined,
				description: screen.description ?? undefined,
				id: screen.id,
				title: screen.name,
			},
			children: [header, contents, bottom],
		},
	};
}

export function materializeRenderAreaFromRows({
	areaId,
	rows,
}: MaterializeRenderAreaFromRowsInput): MaterializeRenderNodeResult {
	const diagnostics: MaterializeDiagnostic[] = [];
	const indexes = buildRowIndexes(rows, diagnostics);
	const area = indexes.areasById.get(areaId);

	if (!area) {
		return {
			diagnostics: [{ code: "missing_area", id: areaId, severity: "error" }],
		};
	}

	return {
		diagnostics,
		node: materializeArea(area, indexes, diagnostics),
	};
}

export function materializeRenderComponentFromRows({
	componentId,
	rows,
}: MaterializeRenderComponentFromRowsInput): MaterializeRenderNodeResult {
	const diagnostics: MaterializeDiagnostic[] = [];
	const indexes = buildRowIndexes(rows, diagnostics);
	const component = indexes.componentsById.get(componentId);

	if (!component) {
		return {
			diagnostics: [{ code: "missing_component", id: componentId, severity: "error" }],
		};
	}

	return {
		diagnostics,
		node: materializeComponent(component, indexes),
	};
}

type RowIndexes = {
	areaChildrenByAreaId: Map<string, RenderAreaChildRow[]>;
	areasById: Map<string, RenderAreaRow>;
	componentChildrenByComponentId: Map<string, RenderComponentChildRow[]>;
	componentsById: Map<string, RenderComponentRow>;
	regionChildrenByRegionId: Map<string, RenderScreenRegionChildRow[]>;
};

function buildRowIndexes(
	rows: RenderReadModelRows,
	diagnostics: MaterializeDiagnostic[],
): RowIndexes {
	return {
		areaChildrenByAreaId: groupOrderedChildren(rows.areaChildren, "area_id", diagnostics),
		areasById: indexById(rows.areas),
		componentChildrenByComponentId: groupOrderedChildren(
			rows.componentChildren,
			"component_id",
			diagnostics,
		),
		componentsById: indexById(rows.components),
		regionChildrenByRegionId: groupOrderedChildren(
			rows.screenRegionChildren,
			"screen_region_id",
			diagnostics,
		),
	};
}

function materializeHeaderRegion(
	screen: RenderScreenRow,
	screenRegions: RenderScreenRegionRow[],
	indexes: RowIndexes,
	diagnostics: MaterializeDiagnostic[],
): MaterializedRenderTreeScreenHeaderNode {
	const region = readRegion("header", screen, screenRegions, diagnostics);
	return {
		...materializeRegionBase("header", screen, region, indexes, diagnostics),
		type: SCREEN_REGION_NODE_TYPE_BY_ROW_TYPE.header,
	};
}

function materializeContentsRegion(
	screen: RenderScreenRow,
	screenRegions: RenderScreenRegionRow[],
	indexes: RowIndexes,
	diagnostics: MaterializeDiagnostic[],
): MaterializedRenderTreeScreenContentsNode {
	const region = readRegion("contents", screen, screenRegions, diagnostics);
	return {
		...materializeRegionBase("contents", screen, region, indexes, diagnostics),
		type: SCREEN_REGION_NODE_TYPE_BY_ROW_TYPE.contents,
	};
}

function materializeBottomRegion(
	screen: RenderScreenRow,
	screenRegions: RenderScreenRegionRow[],
	indexes: RowIndexes,
	diagnostics: MaterializeDiagnostic[],
): MaterializedRenderTreeScreenBottomNode {
	const region = readRegion("bottom", screen, screenRegions, diagnostics);
	return {
		...materializeRegionBase("bottom", screen, region, indexes, diagnostics),
		type: SCREEN_REGION_NODE_TYPE_BY_ROW_TYPE.bottom,
	};
}

function readRegion(
	type: ScreenRegionRowType,
	screen: RenderScreenRow,
	screenRegions: RenderScreenRegionRow[],
	diagnostics: MaterializeDiagnostic[],
): RenderScreenRegionRow | undefined {
	const matchingRegions = screenRegions.filter((region) => region.type === type);
	const region = matchingRegions[0];
	if (matchingRegions.length > 1) {
		diagnostics.push({
			code: "duplicate_region",
			id: `${screen.id}.${type}`,
			parentId: screen.id,
			severity: "error",
		});
	}
	if (!region) {
		diagnostics.push({
			code: "missing_region",
			id: `${screen.id}.${type}`,
			parentId: screen.id,
			severity: "error",
		});
	}
	return region;
}

function materializeRegionBase(
	type: ScreenRegionRowType,
	screen: RenderScreenRow,
	region: RenderScreenRegionRow | undefined,
	indexes: RowIndexes,
	diagnostics: MaterializeDiagnostic[],
) {
	const regionId = region?.id ?? `${screen.id}.${type}`;
	const children = materializeRegionChildren(regionId, indexes, diagnostics);
	return {
		componentVersion: "0.1.0",
		layout: region?.layout_id ?? undefined,
		metadata: {
			id: regionId,
			title: readRegionNodeType(type),
		},
		children,
	};
}

function materializeRegionChildren(
	regionId: string,
	indexes: RowIndexes,
	diagnostics: MaterializeDiagnostic[],
): MaterializedRenderTreeNode[] {
	const children = indexes.regionChildrenByRegionId.get(regionId) ?? [];
	return children.flatMap((child) => {
		const area = indexes.areasById.get(child.area_id);
		if (!area) {
			diagnostics.push({
				code: "missing_area",
				id: child.area_id,
				parentId: regionId,
				severity: "error",
			});
			return [];
		}
		return [materializeArea(area, indexes, diagnostics)];
	});
}

function materializeArea(
	area: RenderAreaRow,
	indexes: RowIndexes,
	diagnostics: MaterializeDiagnostic[],
): MaterializedRenderTreeNode {
	const childRows = indexes.areaChildrenByAreaId.get(area.id) ?? [];
	const children = childRows.flatMap((child) => {
		const component = indexes.componentsById.get(child.component_id);
		if (!component) {
			diagnostics.push({
				code: "missing_component",
				id: child.component_id,
				parentId: area.id,
				severity: "error",
			});
			return [];
		}
		return [materializeComponent(component, indexes)];
	});

	return {
		type: readAreaNodeType(area.type),
		componentVersion: area.version ?? "1.0.0",
		layout: area.layout_id ?? undefined,
		metadata: {
			author: area.author ?? undefined,
			description: area.description ?? undefined,
			id: area.id,
			title: area.name,
		},
		props: area.props ?? undefined,
		children,
	};
}

function materializeComponent(
	component: RenderComponentRow,
	indexes: RowIndexes,
): MaterializedRenderTreeNode {
	const childRows = indexes.componentChildrenByComponentId.get(component.id) ?? [];
	const firstChild = childRows[0];
	const common = {
		componentVersion: component.version ?? "1.0.0",
		display: component.display ?? undefined,
		layout: component.layout_id ?? undefined,
		metadata: {
			author: component.author ?? undefined,
			description: component.description ?? undefined,
			id: component.id,
			title: component.name,
		},
		type: component.type,
	};

	if (childRows.length <= 1) {
		return {
			...common,
			props: firstChild ? materializeComponentChildProps(firstChild) : undefined,
		};
	}

	return {
		...common,
		children: childRows.map((child, index) => ({
			type: child.catalog_component_type,
			componentVersion: component.version ?? "1.0.0",
			metadata: {
				id: `${component.id}.${index}`,
				title: child.catalog_component_type,
			},
			props: materializeComponentChildProps(child),
		})),
	};
}

function materializeComponentChildProps(
	child: RenderComponentChildRow,
): MaterializedRenderTreeNode["props"] {
	if (!child.variant) return child.props ?? undefined;
	return {
		variant: child.variant,
		...(child.props ?? {}),
	};
}

function groupOrderedChildren<Row extends { order_index: number }>(
	rows: Row[],
	key: keyof Row,
	diagnostics: MaterializeDiagnostic[],
): Map<string, Row[]> {
	const grouped = new Map<string, Row[]>();
	for (const row of rows) {
		const parentId = String(row[key]);
		const siblings = grouped.get(parentId) ?? [];
		siblings.push(row);
		grouped.set(parentId, siblings);
	}

	for (const [parentId, siblings] of grouped) {
		const seen = new Set<number>();
		for (const row of siblings) {
			if (seen.has(row.order_index)) {
				diagnostics.push({
					code: "invalid_child_order",
					id: String(row.order_index),
					parentId,
					severity: "warning",
				});
			}
			seen.add(row.order_index);
		}
		siblings.sort((left, right) => left.order_index - right.order_index);
	}

	return grouped;
}

function indexById<Row extends { id: string }>(rows: Row[]): Map<string, Row> {
	return new Map(rows.map((row) => [row.id, row]));
}

function readAreaNodeType(type: string): RenderTreeAreaNodeType {
	if (type in AREA_NODE_TYPE_BY_ROW_TYPE) {
		return AREA_NODE_TYPE_BY_ROW_TYPE[type as keyof typeof AREA_NODE_TYPE_BY_ROW_TYPE];
	}
	return RENDER_TREE_NODE_TYPE.areaStatic;
}

function readRegionNodeType(type: ScreenRegionRowType): RenderTreeScreenRegionNodeType {
	return SCREEN_REGION_NODE_TYPE_BY_ROW_TYPE[type];
}
