import { loadPatternStore } from "@cx/agent/pattern-store";
import {
	validateWireframeSchemaFull,
	type WireframeNode,
	type WireframeSchema,
} from "@cx/renderer";
import {
	type DatabaseAreaSet,
	type DatabaseComponentSet,
	type DatabaseScreenRouteSet,
	type DatabaseScreenSet,
	type DatabaseScreenVariantSet,
	tablesToRenderTrees,
	validateDatabaseScreenSource,
} from "@/adapters/tables-to-render-tree";
import areasTable from "../../../../database/tables/areas.json";
import componentsTable from "../../../../database/tables/components.json";
import screenRoutesTable from "../../../../database/tables/screen_routes.json";
import screenVariantsTable from "../../../../database/tables/screen_variants.json";
import screensTable from "../../../../database/tables/screens.json";

type WireframeScreenSet = {
	screens: WireframeSchema[];
};

type ComponentTableSet = {
	components: DatabaseComponentSet["components"];
};

const screenRouteSet = screenRoutesTable as unknown as DatabaseScreenRouteSet;
const screenVariantSet = screenVariantsTable as unknown as DatabaseScreenVariantSet;
const componentTableSet = componentsTable as unknown as ComponentTableSet;
const areas = (areasTable as unknown as DatabaseAreaSet).areas;
const orderedDatabaseScreens = orderDatabaseScreens(
	(screensTable as unknown as DatabaseScreenSet).screens,
	screenVariantSet,
	screenRouteSet,
);

const renderedScreens = tablesToRenderTrees({
	screens: orderedDatabaseScreens,
	areas,
	components: componentTableSet.components,
	patternStore: loadPatternStore(),
}) satisfies WireframeScreenSet["screens"];

const wireframeWorkbenchData = renderedScreens.map((schema, index) => {
	const databaseScreen = orderedDatabaseScreens[index];
	const validation = validateWireframeSchemaFull(schema);
	const variant = screenVariantSet.screenVariants.find(
		(candidate) => candidate.id === databaseScreen.screenVariantId,
	);
	const route = screenRouteSet.screenRoutes.find(
		(candidate) => candidate.id === variant?.screenRouteId,
	);
	const areas = extractAreas(schema);

	return {
		code: schema.metadata.id,
		name: schema.metadata.title,
		description: schema.metadata.description ?? schema.children[0]?.metadata.title,
		module: route?.moduleId ?? schema.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
		areas,
		screenOrder: databaseScreen.order ?? index + 1,
		screenRouteId: route?.id ?? "unknown-route",
		screenRouteName: route?.name ?? "Unknown route",
		schema,
		screenVariantId: variant?.id ?? databaseScreen.screenVariantId ?? schema.metadata.id,
		screenVariantName: variant?.name ?? schema.metadata.title,
		screenVariantOrder: variant?.order ?? databaseScreen.order ?? index + 1,
		screenVariantType: variant?.variantType ?? "base",
		sourceValidationErrors: validateDatabaseScreenSource(databaseScreen),
		validationStats: validation.stats,
		warnings: [],
	};
});

const areaCatalog = getAreaCatalog(renderedScreens);

export function loadLocalWorkbenchData() {
	return {
		areas: areaCatalog,
		screens: wireframeWorkbenchData,
	};
}

function extractAreas(schema: WireframeSchema) {
	const areas: Array<{ order: number; areaCode: string }> = [];

	forEachNode(schema.children, (node) => {
		if (!isAreaNode(node)) return;

		areas.push({
			order: areas.length + 1,
			areaCode: node.metadata.id,
		});
	});

	return areas;
}

function getAreaCatalog(schemas: WireframeSchema[]) {
	const byCode = new Map<
		string,
		{
			code: string;
			componentCount: number;
			name: string;
			stateCount: number;
			usage: string;
		}
	>();

	for (const schema of schemas) {
		forEachNode(schema.children, (node) => {
			if (!isAreaNode(node)) return;

			const code = node.metadata.id;
			byCode.set(code, {
				code,
				name: node.metadata.title,
				usage: "section",
				stateCount: 1,
				componentCount: node.children?.length ?? 0,
			});
		});
	}

	return Array.from(byCode.values());
}

function orderDatabaseScreens(
	screens: DatabaseScreenSet["screens"],
	variants: DatabaseScreenVariantSet,
	routes: DatabaseScreenRouteSet,
) {
	const routeOrderByCode = new Map(routes.screenRoutes.map((route) => [route.id, route.order]));
	const variantByCode = new Map(variants.screenVariants.map((variant) => [variant.id, variant]));

	return [...screens].sort((left, right) => {
		const leftVariant = left.screenVariantId ? variantByCode.get(left.screenVariantId) : undefined;
		const rightVariant = right.screenVariantId
			? variantByCode.get(right.screenVariantId)
			: undefined;
		const leftRouteOrder = leftVariant
			? (routeOrderByCode.get(leftVariant.screenRouteId) ?? Number.MAX_SAFE_INTEGER)
			: Number.MAX_SAFE_INTEGER;
		const rightRouteOrder = rightVariant
			? (routeOrderByCode.get(rightVariant.screenRouteId) ?? Number.MAX_SAFE_INTEGER)
			: Number.MAX_SAFE_INTEGER;

		return (
			leftRouteOrder - rightRouteOrder ||
			(leftVariant?.order ?? Number.MAX_SAFE_INTEGER) -
				(rightVariant?.order ?? Number.MAX_SAFE_INTEGER) ||
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			(left.id ?? "").localeCompare(right.id ?? "")
		);
	});
}

function forEachNode(nodes: WireframeNode[], callback: (node: WireframeNode) => void): void {
	for (const node of nodes) {
		callback(node);
		if (node.children) {
			forEachNode(node.children, callback);
		}
	}
}

function isAreaNode(node: WireframeNode) {
	return node.type === "area.static" || node.type === "area.dynamic" || node.type === "Area";
}
