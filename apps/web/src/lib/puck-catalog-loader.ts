import type { PuckCatalogItem } from "@cx/adapters/puck";
import {
	materializeRenderAreaFromRows,
	materializeRenderComponentFromRows,
	type RenderAreaChildRow,
	type RenderAreaRow,
	type RenderComponentChildRow,
	type RenderComponentRow,
	type RenderReadModelRows,
} from "@cx/adapters/table";
import { inFilter, readScreenDbRows, SCREEN_DB_TABLES, uniqueIds } from "./screen-db-rest";

/**
 * Puck editor의 catalog 패널이 소비하는 catalog item을 Screen DB row에서 만든다.
 * Puck shape(`PuckCatalogItem`)에 대한 의존은 이 파일에 격리하고,
 * screen-db-loader(=Screen DB read facade)는 Puck 어휘를 모른다.
 */
export type PuckCatalogScope = "area" | "screen-region";

const PUCK_CATALOG_ITEM_PREFIX_BY_SCOPE = {
	area: "component",
	"screen-region": "area",
} as const satisfies Record<PuckCatalogScope, string>;

export async function listPuckCatalogItems(scope: PuckCatalogScope): Promise<PuckCatalogItem[]> {
	const loaders = {
		area: listPuckComponentCatalogItems,
		"screen-region": listPuckAreaCatalogItems,
	} as const satisfies Record<PuckCatalogScope, () => Promise<PuckCatalogItem[]>>;

	return loaders[scope]();
}

async function listPuckAreaCatalogItems(): Promise<PuckCatalogItem[]> {
	const areas = await readScreenDbRows<RenderAreaRow>(SCREEN_DB_TABLES.areas, {
		order: "name.asc,id.asc",
		select: "id,type,version,layout_id,name,description,author,props",
	});
	const areaIds = areas.map((area) => area.id);
	const areaChildren =
		areaIds.length > 0
			? await readScreenDbRows<RenderAreaChildRow>(SCREEN_DB_TABLES.areaChildren, {
					area_id: inFilter(areaIds),
					order: "area_id.asc,order_index.asc",
					select: "id,area_id,component_id,order_index",
				})
			: [];
	const componentIds = uniqueIds(areaChildren.map((child) => child.component_id));
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
	const components = await readScreenDbRows<RenderComponentRow>(SCREEN_DB_TABLES.components, {
		order: "name.asc,id.asc",
		select: "id,type,version,layout_id,name,description,author,display,hooks",
	});
	const componentIds = components.map((component) => component.id);
	const componentChildren =
		componentIds.length > 0
			? await readScreenDbRows<RenderComponentChildRow>(SCREEN_DB_TABLES.componentChildren, {
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
		readScreenDbRows<RenderComponentRow>(SCREEN_DB_TABLES.components, {
			id: inFilter(componentIds),
			order: "name.asc,id.asc",
			select: "id,type,version,layout_id,name,description,author,display,hooks",
		}),
		readScreenDbRows<RenderComponentChildRow>(SCREEN_DB_TABLES.componentChildren, {
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
