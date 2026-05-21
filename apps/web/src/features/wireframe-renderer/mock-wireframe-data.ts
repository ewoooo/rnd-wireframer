import type { WireframeNode, WireframeSchema } from "@cx/renderer";
import {
	type PatternStore,
	type SampleCompositeSet,
	type SampleOrganismSet,
	type SampleScreenRouteSet,
	type SampleScreenSet,
	type SampleScreenVariantSet,
	tablesToRenderTrees,
	validateSampleScreenSource,
} from "@/features/wireframe-renderer/tables-to-render-tree";
import compositeSampleSet from "../../../../../database/tables/components.json";
import organismSampleSet from "../../../../../database/tables/organisms.json";
import screenMockDataSet from "../../../../../database/tables/screen_mock_data.json";
import screenRouteSampleSet from "../../../../../database/tables/screen_routes.json";
import screenVariantSampleSet from "../../../../../database/tables/screen_variants.json";
import screenSampleSet from "../../../../../database/tables/screens.json";
import compositePatternSet from "../../../../../docs/pattern-store/composite-patterns.json";
import organismPatternSet from "../../../../../docs/pattern-store/organism-patterns.json";
import screenPatternSet from "../../../../../docs/pattern-store/screen-patterns.json";

type WireframeScreenSet = {
	screens: WireframeSchema[];
};

type ComponentTableSet = {
	components: SampleCompositeSet["composites"];
};

type ScreenMockDataSet = {
	screenMockData: Array<{
		screenId: string;
		scenario: string;
		data: Record<string, unknown>;
	}>;
};

const sampleRouteSet = screenRouteSampleSet as unknown as SampleScreenRouteSet;
const sampleVariantSet = screenVariantSampleSet as unknown as SampleScreenVariantSet;
const componentTableSet = compositeSampleSet as unknown as ComponentTableSet;
const mockDataByScreenId = new Map(
	(screenMockDataSet as unknown as ScreenMockDataSet).screenMockData
		.filter((entry) => entry.scenario === "default")
		.map((entry) => [entry.screenId, entry.data]),
);
const orderedSampleScreens = getOrderedSampleScreens(
	(screenSampleSet as unknown as SampleScreenSet).screens.map((screen) => ({
		...screen,
		data: mockDataByScreenId.get(screen.id ?? screen.metadata.id),
	})),
	sampleVariantSet,
	sampleRouteSet,
);

const sampleScreens = tablesToRenderTrees({
	screens: orderedSampleScreens,
	organisms: (organismSampleSet as unknown as SampleOrganismSet).organisms,
	composites: componentTableSet.components,
	patternStore: getPatternStore(),
}) satisfies WireframeScreenSet["screens"];

export const wireframeWorkbenchData = sampleScreens.map((schema, index) => {
	const sampleScreen = orderedSampleScreens[index];
	const variant = sampleVariantSet.screenVariants.find(
		(candidate) => candidate.code === sampleScreen.screenVariantCode,
	);
	const route = sampleRouteSet.screenRoutes.find(
		(candidate) => candidate.code === variant?.screenRouteCode,
	);
	const organisms = extractOrganisms(schema);

	return {
		code: schema.metadata.id,
		name: schema.metadata.title,
		description: schema.metadata.description ?? schema.children[0]?.metadata.title,
		module: route?.module ?? schema.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
		organisms,
		screenOrder: sampleScreen.order ?? index + 1,
		screenRouteCode: route?.code ?? "unknown-route",
		screenRouteName: route?.name ?? "Unknown route",
		schema,
		screenVariantId: variant?.code ?? sampleScreen.screenVariantCode ?? schema.metadata.id,
		screenVariantName: variant?.name ?? schema.metadata.title,
		screenVariantType: variant?.variantType ?? "base",
		sourceValidationErrors: validateSampleScreenSource(sampleScreen),
		warnings: [],
	};
});

export const organismCatalog = getOrganismCatalog(sampleScreens);

function getPatternStore(): PatternStore {
	return {
		patterns: [
			...(screenPatternSet as unknown as PatternStore).patterns,
			...(organismPatternSet as unknown as PatternStore).patterns,
			...(compositePatternSet as unknown as PatternStore).patterns,
		],
	};
}

function extractOrganisms(schema: WireframeSchema) {
	const organisms: Array<{ order: number; organismCode: string }> = [];

	forEachNode(schema.children, (node) => {
		if (node.type !== "Organism") return;

		organisms.push({
			order: organisms.length + 1,
			organismCode: String(node.props?.organismCode ?? node.metadata.id),
		});
	});

	return organisms;
}

function getOrganismCatalog(schemas: WireframeSchema[]) {
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
			if (node.type !== "Organism") return;

			const code = String(node.props?.organismCode ?? node.metadata.id);
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
	screens: SampleScreenSet["screens"],
	variants: SampleScreenVariantSet,
	routes: SampleScreenRouteSet,
) {
	const routeOrderByCode = new Map(routes.screenRoutes.map((route) => [route.code, route.order]));
	const variantByCode = new Map(variants.screenVariants.map((variant) => [variant.code, variant]));

	return [...screens].sort((left, right) => {
		const leftVariant = left.screenVariantCode
			? variantByCode.get(left.screenVariantCode)
			: undefined;
		const rightVariant = right.screenVariantCode
			? variantByCode.get(right.screenVariantCode)
			: undefined;
		const leftRouteOrder = leftVariant
			? (routeOrderByCode.get(leftVariant.screenRouteCode) ?? Number.MAX_SAFE_INTEGER)
			: Number.MAX_SAFE_INTEGER;
		const rightRouteOrder = rightVariant
			? (routeOrderByCode.get(rightVariant.screenRouteCode) ?? Number.MAX_SAFE_INTEGER)
			: Number.MAX_SAFE_INTEGER;

		return (
			leftRouteOrder - rightRouteOrder ||
			(leftVariant?.order ?? Number.MAX_SAFE_INTEGER) -
				(rightVariant?.order ?? Number.MAX_SAFE_INTEGER) ||
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			left.metadata.id.localeCompare(right.metadata.id)
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
