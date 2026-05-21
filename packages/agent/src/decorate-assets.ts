import type {
	AssetDecoration,
	AssetRegistry,
	DecoratedAsset,
	DecoratedAssetRegistry,
	DecoratedOrganismAsset,
	DecoratedScreenAsset,
	DecoratedScreenRouteAsset,
	DecoratedScreenVariantAsset,
	PatternResolver,
	RegisteredComponentAsset,
	RegisteredOrganismAsset,
	RegisteredScreenAsset,
	RegisteredScreenRouteAsset,
	RegisteredScreenVariantAsset,
} from "./types";

export interface DecorateRegisteredAssetsOptions {
	resolvePattern?: PatternResolver;
}

export function decorateRegisteredAssets(
	registry: AssetRegistry,
	options: DecorateRegisteredAssetsOptions = {},
): DecoratedAssetRegistry {
	const resolvePattern = options.resolvePattern ?? defaultPatternResolver;
	const decoratedComponents = registry.components.map((component) => {
		return decorate(component, "component", resolvePattern);
	});
	const decoratedComponentById = new Map(
		decoratedComponents.map((component) => [component.asset.id, component]),
	);
	const decoratedOrganisms = registry.organisms.map((organism) => {
		return decorateOrganism(organism, decoratedComponentById, resolvePattern);
	});
	const decoratedOrganismById = new Map(
		decoratedOrganisms.map((organism) => [organism.asset.id, organism]),
	);
	const routes = registry.routes.map((route) => {
		return decorateRoute(route, decoratedOrganismById, resolvePattern);
	});

	return {
		routes,
		organisms: decoratedOrganisms,
		components: decoratedComponents,
		warnings: [...registry.warnings],
	};
}

function decorateRoute(
	route: RegisteredScreenRouteAsset,
	organismById: Map<string, DecoratedAsset<DecoratedOrganismAsset>>,
	resolvePattern: PatternResolver,
): DecoratedAsset<DecoratedScreenRouteAsset> {
	const asset: DecoratedScreenRouteAsset = {
		...route,
		variants: route.variants.map((variant) =>
			decorateVariant(variant, organismById, resolvePattern),
		),
	};

	return decorate(asset, "route", resolvePattern);
}

function decorateVariant(
	variant: RegisteredScreenVariantAsset,
	organismById: Map<string, DecoratedAsset<DecoratedOrganismAsset>>,
	resolvePattern: PatternResolver,
): DecoratedAsset<DecoratedScreenVariantAsset> {
	const asset: DecoratedScreenVariantAsset = {
		...variant,
		screens: variant.screens.map((screen) => decorateScreen(screen, organismById, resolvePattern)),
	};

	return decorate(asset, "variant", resolvePattern);
}

function decorateScreen(
	screen: RegisteredScreenAsset,
	organismById: Map<string, DecoratedAsset<DecoratedOrganismAsset>>,
	resolvePattern: PatternResolver,
): DecoratedAsset<DecoratedScreenAsset> {
	const asset: DecoratedScreenAsset = {
		...screen,
		organisms: screen.organisms.map((ref) => {
			const organism = organismById.get(ref.organismId);
			return {
				organismId: ref.organismId,
				order: ref.order,
				...(organism ? { organism } : {}),
			};
		}),
	};

	return decorate(asset, "screen", resolvePattern);
}

function decorateOrganism(
	organism: RegisteredOrganismAsset,
	componentById: Map<string, DecoratedAsset<RegisteredComponentAsset>>,
	resolvePattern: PatternResolver,
): DecoratedAsset<DecoratedOrganismAsset> {
	const asset: DecoratedOrganismAsset = {
		...organism,
		components: organism.components.map((ref) => {
			const component = componentById.get(ref.componentId);
			return {
				componentId: ref.componentId,
				order: ref.order,
				...(component ? { component } : {}),
			};
		}),
	};

	return decorate(asset, "organism", resolvePattern);
}

function decorate<TAsset>(
	asset: TAsset,
	level: Parameters<PatternResolver>[0]["level"],
	resolvePattern: PatternResolver,
): DecoratedAsset<TAsset> {
	return {
		asset,
		decoration: resolvePattern({ level, asset }) ?? fallbackDecoration(level),
	};
}

export const defaultPatternResolver: PatternResolver = ({ level, asset }) => {
	if (level === "route") {
		return {
			patternId: "screen-route",
			reasons: ["default route pattern"],
		};
	}

	if (level === "variant") {
		return {
			patternId: "screen-variant",
			reasons: ["default variant pattern"],
		};
	}

	if (level === "screen") {
		const screen = asset as RegisteredScreenAsset;
		return {
			patternId: screen.surface ? `screen-${screen.surface}` : "screen-page",
			reasons: screen.surface ? [`surface: ${screen.surface}`] : ["default screen pattern"],
		};
	}

	if (level === "organism") {
		const organism = asset as RegisteredOrganismAsset;
		return {
			patternId: organism.layout ? `organism-${organism.layout}` : "organism-section",
			reasons: organism.layout ? [`layout: ${organism.layout}`] : ["default organism pattern"],
		};
	}

	if (level === "component") {
		const component = asset as RegisteredComponentAsset;
		return {
			patternId: `component-${normalizePatternId(component.type)}`,
			reasons: [`component type: ${component.type}`],
		};
	}

	return undefined;
};

function fallbackDecoration(level: string): AssetDecoration {
	return {
		patternId: `${level}-unknown`,
		reasons: ["no matching pattern"],
	};
}

function normalizePatternId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
