import { registerAssets } from "./register-assets";
import type {
	RegisterAssetMockInput,
	RegisterAssetsInput,
	RegisteredAssetTables,
	RegisteredScreenAsset,
	RegisteredScreenRouteAsset,
	RegisteredScreenVariantAsset,
} from "./types";

export function registerAssetsToTables(
	input: RegisterAssetsInput,
	mockInput: RegisterAssetMockInput = {},
): RegisteredAssetTables {
	const registry = registerAssets(input);
	const screenRoutes = registry.routes.map((route) => ({
		code: route.id,
		name: route.name,
		order: route.order,
		...(route.description ? { description: route.description } : {}),
	}));
	const screenVariants = registry.routes.flatMap((route) => {
		return route.variants.map((variant) => mapVariantRow(route, variant));
	});
	const screens = registry.routes.flatMap((route) => {
		return route.variants.flatMap((variant) => {
			return variant.screens.map((screen) => mapScreenRow(variant, screen));
		});
	});
	const organisms = registry.organisms.map((organism) => ({
		id: organism.id,
		name: organism.name,
		order: organism.order,
		...(organism.description ? { description: organism.description } : {}),
		...(organism.layout ? { layout: organism.layout } : {}),
		components: organism.components.map((component) => ({
			componentId: component.componentId,
			order: component.order,
		})),
	}));
	const components = registry.components.map((component) => ({
		id: component.id,
		name: component.name,
		order: component.order,
		type: component.type,
		...(component.description ? { description: component.description } : {}),
		props: { ...component.props },
	}));

	return {
		screenRoutes,
		screenVariants,
		screens,
		screenMockData: (mockInput.screenMockData ?? []).map((mock) => ({
			screenId: mock.screenId,
			scenario: mock.scenario ?? "default",
			...(mock.generatedBy ? { generatedBy: mock.generatedBy } : {}),
			...(mock.source ? { source: mock.source } : {}),
			...(mock.sourceRefs ? { sourceRefs: [...mock.sourceRefs] } : {}),
			data: { ...mock.data },
		})),
		organisms,
		components,
		warnings: [...registry.warnings],
	};
}

function mapVariantRow(route: RegisteredScreenRouteAsset, variant: RegisteredScreenVariantAsset) {
	return {
		code: variant.id,
		screenRouteCode: route.id,
		name: variant.name,
		order: variant.order,
		...(variant.description ? { description: variant.description } : {}),
	};
}

function mapScreenRow(variant: RegisteredScreenVariantAsset, screen: RegisteredScreenAsset) {
	return {
		id: screen.id,
		screenVariantId: variant.id,
		name: screen.name,
		order: screen.order,
		...(screen.description ? { description: screen.description } : {}),
		...(screen.surface ? { surface: screen.surface } : {}),
		organisms: screen.organisms.map((organism) => ({
			organismId: organism.organismId,
			order: organism.order,
		})),
	};
}
