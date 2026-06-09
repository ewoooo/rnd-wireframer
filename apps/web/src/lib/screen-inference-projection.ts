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
	SCREEN_REGION_TYPE_BY_NODE_TYPE,
} from "@cx/schema";
import { SCREEN_DB_TABLES } from "./screen-db-rest";

export type ApplyScreenInferenceDiagnostic = {
	code: "missing_region" | "unsupported_area_child" | "unsupported_region_child";
	id: string;
	parentId?: string;
	severity: "error" | "warning";
};

export type ScreenInferenceProjection = {
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

export function projectScreenInferenceFinalResult(
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

		const regionType = SCREEN_REGION_TYPE_BY_NODE_TYPE[regionNode.type];
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

export function readProjectionRowCounts(
	projection: ScreenInferenceProjection,
): Record<string, number> {
	return {
		[SCREEN_DB_TABLES.areaChildren]: projection.areaChildren.length,
		[SCREEN_DB_TABLES.areas]: projection.areas.length,
		[SCREEN_DB_TABLES.componentChildren]: projection.componentChildren.length,
		[SCREEN_DB_TABLES.components]: projection.components.length,
		[SCREEN_DB_TABLES.screenRegionChildren]: projection.screenRegionChildren.length,
		[SCREEN_DB_TABLES.screenRegions]: projection.screenRegions.length,
		[SCREEN_DB_TABLES.screenRoutes]: projection.screenRoutes.length,
		[SCREEN_DB_TABLES.screenVariants]: projection.screenVariants.length,
		[SCREEN_DB_TABLES.screens]: projection.screens.length,
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

function readLayoutId(node: RenderTreeNodeContract | RenderTreeScreenNodeContract): string | null {
	return typeof node.layout === "string" ? node.layout : null;
}

function normalizeAreaType(type: string): string {
	if (type === RENDER_TREE_NODE_TYPE.areaDynamic) return "area_dynamic";
	if (type === RENDER_TREE_NODE_TYPE.areaStatic) return "area_static";
	return type;
}
