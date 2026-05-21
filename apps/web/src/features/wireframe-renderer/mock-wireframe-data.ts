import type { WireframeNode, WireframeSchema } from "@cx/wireframe";

import componentSampleSet from "@/app/data/sample/components.json";
import organismSampleSet from "@/app/data/sample/organisms.json";
import patternSampleSet from "@/app/data/sample/patterns.json";
import screenRouteSampleSet from "@/app/data/sample/screen_routes.json";
import screenVariantSampleSet from "@/app/data/sample/screen_variants.json";
import screenSampleSet from "@/app/data/sample/screens.json";
import {
	generateRenderTrees,
	type SampleComponentSet,
	type SampleOrganismSet,
	type SamplePatternSet,
	type SampleScreenRouteSet,
	type SampleScreenSet,
	type SampleScreenVariantSet,
	validateSampleScreenSource,
} from "@/features/wireframe-renderer/generate-render-tree";

type WireframeScreenSet = {
	screens: WireframeSchema[];
};

const sampleRouteSet = screenRouteSampleSet as unknown as SampleScreenRouteSet;
const sampleVariantSet = screenVariantSampleSet as unknown as SampleScreenVariantSet;
const orderedSampleScreens = getOrderedSampleScreens(
	(screenSampleSet as unknown as SampleScreenSet).screens,
	sampleVariantSet,
	sampleRouteSet,
);

const sampleScreens = generateRenderTrees({
	screens: orderedSampleScreens,
	organisms: (organismSampleSet as unknown as SampleOrganismSet).organisms,
	components: (componentSampleSet as unknown as SampleComponentSet).components,
	patterns: (patternSampleSet as unknown as SamplePatternSet).patterns,
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

function extractOrganisms(schema: WireframeSchema) {
	const organisms: Array<{ order: number; organismCode: string }> = [];

	forEachNode(schema.children, (node) => {
		if (node.type !== "OrganismSection" && node.type !== "Organism.Section") return;

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
			componentCount: number;
			name: string;
			stateCount: number;
			usage: string;
		}
	>();

	for (const schema of schemas) {
		forEachNode(schema.children, (node) => {
			if (node.type !== "OrganismSection" && node.type !== "Organism.Section") return;

			const code = String(node.props?.organismCode ?? node.metadata.id);
			byCode.set(code, {
				code,
				name: String(node.props?.name ?? node.metadata.title),
				usage: "section",
				stateCount: 1,
				componentCount: node.children?.length ?? 0,
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
