import { loadPatternStore } from "@cx/agent/pattern-store";
import {
	registerWireframeNodeKinds,
	validateWireframeSchemaFull,
	type WireframeNode,
	type WireframeNodeKind,
	type WireframeSchema,
} from "@cx/renderer";
import {
	type DatabaseComponentSet,
	type DatabaseAreaSet,
	type DatabaseScreenRouteSet,
	type DatabaseScreenSet,
	type DatabaseScreenVariantSet,
	tablesToRenderTrees,
	validateSampleScreenSource,
} from "@/adapters/tables-to-render-tree";
import componentRendererKindsSet from "../../../../database/tables/component_renderer_kinds.json";
import compositeSampleSet from "../../../../database/tables/components.json";
import areaSampleSet from "../../../../database/tables/areas.json";
import screenRouteSampleSet from "../../../../database/tables/screen_routes.json";
import screenVariantSampleSet from "../../../../database/tables/screen_variants.json";
import screenSampleSet from "../../../../database/tables/screens.json";

type WireframeScreenSet = {
	screens: WireframeSchema[];
};

type ComponentTableSet = {
	components: DatabaseComponentSet["composites"];
};

registerWireframeNodeKinds(
	(componentRendererKindsSet as { mappings: Array<{ type: string; kind: WireframeNodeKind }> })
		.mappings,
);

const sampleRouteSet = screenRouteSampleSet as unknown as DatabaseScreenRouteSet;
const sampleVariantSet = screenVariantSampleSet as unknown as DatabaseScreenVariantSet;
const componentTableSet = compositeSampleSet as unknown as ComponentTableSet;
const areas = (areaSampleSet as unknown as DatabaseAreaSet).areas;
const orderedSampleScreens = getOrderedSampleScreens(
	(screenSampleSet as unknown as DatabaseScreenSet).screens,
	sampleVariantSet,
	sampleRouteSet,
);

const sampleScreens = tablesToRenderTrees({
	screens: orderedSampleScreens,
	areas,
	composites: componentTableSet.components,
	patternStore: loadPatternStore(),
}) satisfies WireframeScreenSet["screens"];

const wireframeWorkbenchData = sampleScreens.map((schema, index) => {
	const sampleScreen = orderedSampleScreens[index];
	const validation = validateWireframeSchemaFull(schema);
	const variant = sampleVariantSet.screenVariants.find(
		(candidate) => candidate.id === sampleScreen.screenVariantId,
	);
	const route = sampleRouteSet.screenRoutes.find(
		(candidate) => candidate.id === variant?.screenRouteId,
	);
	const areas = extractAreas(schema);

	return {
		code: schema.metadata.id,
		name: schema.metadata.title,
		description: schema.metadata.description ?? schema.children[0]?.metadata.title,
		module: route?.moduleId ?? schema.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
		areas,
		screenOrder: sampleScreen.order ?? index + 1,
		screenRouteId: route?.id ?? "unknown-route",
		screenRouteName: route?.name ?? "Unknown route",
		schema,
		screenVariantId: variant?.id ?? sampleScreen.screenVariantId ?? schema.metadata.id,
		screenVariantName: variant?.name ?? schema.metadata.title,
		screenVariantOrder: variant?.order ?? sampleScreen.order ?? index + 1,
		screenVariantType: variant?.variantType ?? "base",
		sourceValidationErrors: validateSampleScreenSource(sampleScreen),
		validationStats: validation.stats,
		warnings: [],
	};
});

const areaCatalog = getAreaCatalog(sampleScreens);

export function loadLocalWorkbenchData() {
	return {
		areas: areaCatalog,
		screens: wireframeWorkbenchData,
	};
}

function extractAreas(schema: WireframeSchema) {
	const areas: Array<{ order: number; areaCode: string }> = [];

	forEachNode(schema.children, (node) => {
		if (node.type !== "Area") return;

		areas.push({
			order: areas.length + 1,
			areaCode: String(node.props?.areaCode ?? node.metadata.id),
		});
	});

	return areas;
}

function getAreaCatalog(schemas: WireframeSchema[]) {
	const byCode = new Map<
		string,
		{
			code: string;
			compositeCount: number;
			name: string;
			stateCount: number;
			usage: string;
		}
	>();

	for (const schema of schemas) {
		forEachNode(schema.children, (node) => {
			if (node.type !== "Area") return;

			const code = String(node.props?.areaCode ?? node.metadata.id);
			byCode.set(code, {
				code,
				name: String(node.props?.name ?? node.metadata.title),
				usage: "section",
				stateCount: 1,
				compositeCount: node.children?.length ?? 0,
			});
		});
	}

	return Array.from(byCode.values());
}

function getOrderedSampleScreens(
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
