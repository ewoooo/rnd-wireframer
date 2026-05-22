import type {
	AssetRegistry,
	ComponentAssetInput,
	OrganismAssetInput,
	RegisterAssetsInput,
	RegisteredComponentAsset,
	RegisteredOrganismAsset,
	RegisteredOrganismComponentRef,
	RegisteredScreenAsset,
	RegisteredScreenOrganismRef,
	RegisteredScreenRouteAsset,
	RegisteredScreenVariantAsset,
	ScreenAssetInput,
	ScreenRouteAssetInput,
	ScreenVariantAssetInput,
} from "./types";

export function registerAssets(input: RegisterAssetsInput): AssetRegistry {
	const warnings: string[] = [];
	const components = orderByIndex(input.components ?? []).map(registerComponent);
	const componentById = new Map(components.map((component) => [component.id, component]));
	const organisms = orderByIndex(input.organisms ?? []).map((organism, index) => {
		return registerOrganism(organism, index, componentById, warnings);
	});
	const organismById = new Map(organisms.map((organism) => [organism.id, organism]));
	const routes = orderByIndex(input.routes).map((route, index) => {
		return registerRoute(route, index, organismById, warnings);
	});

	return {
		routes,
		organisms,
		components,
		warnings,
	};
}

function registerRoute(
	route: ScreenRouteAssetInput,
	index: number,
	organismById: Map<string, RegisteredOrganismAsset>,
	warnings: string[],
): RegisteredScreenRouteAsset {
	return {
		level: "route",
		id: route.id,
		name: route.name ?? route.id,
		order: normalizeOrder(route.order, index),
		...(route.description ? { description: route.description } : {}),
		variants: orderByIndex(route.variants).map((variant, variantIndex) => {
			return registerVariant(variant, variantIndex, organismById, warnings);
		}),
	};
}

function registerVariant(
	variant: ScreenVariantAssetInput,
	index: number,
	organismById: Map<string, RegisteredOrganismAsset>,
	warnings: string[],
): RegisteredScreenVariantAsset {
	return {
		level: "variant",
		id: variant.id,
		name: variant.name ?? variant.id,
		order: normalizeOrder(variant.order, index),
		...(variant.description ? { description: variant.description } : {}),
		screens: orderByIndex(variant.screens).map((screen, screenIndex) => {
			return registerScreen(screen, screenIndex, organismById, warnings);
		}),
	};
}

function registerScreen(
	screen: ScreenAssetInput,
	index: number,
	organismById: Map<string, RegisteredOrganismAsset>,
	warnings: string[],
): RegisteredScreenAsset {
	return {
		level: "screen",
		id: screen.id,
		name: screen.name ?? screen.id,
		order: normalizeOrder(screen.order, index),
		...(screen.description ? { description: screen.description } : {}),
		...(screen.surface ? { surface: screen.surface } : {}),
		...(screen.raw ? { raw: screen.raw } : {}),
		organisms: orderRefs(screen.organisms ?? [], "organismId").map((ref, refIndex) => {
			const organism = organismById.get(ref.organismId);
			if (!organism) {
				warnings.push(`Missing organism: ${ref.organismId}`);
			}

			const registeredRef: RegisteredScreenOrganismRef = {
				organismId: ref.organismId,
				order: normalizeOrder(ref.order, refIndex),
				...(organism ? { organism } : {}),
			};

			return registeredRef;
		}),
	};
}

function registerOrganism(
	organism: OrganismAssetInput,
	index: number,
	componentById: Map<string, RegisteredComponentAsset>,
	warnings: string[],
): RegisteredOrganismAsset {
	return {
		level: "organism",
		id: organism.id,
		name: organism.name ?? organism.id,
		order: normalizeOrder(organism.order, index),
		...(organism.description ? { description: organism.description } : {}),
		...(organism.layout ? { layout: organism.layout } : {}),
		components: orderRefs(organism.components ?? [], "componentId").map((ref, refIndex) => {
			const component = componentById.get(ref.componentId);
			if (!component) {
				warnings.push(`Missing component: ${ref.componentId}`);
			}

			const registeredRef: RegisteredOrganismComponentRef = {
				componentId: ref.componentId,
				order: normalizeOrder(ref.order, refIndex),
				...(component ? { component } : {}),
			};

			return registeredRef;
		}),
	};
}

function registerComponent(
	component: ComponentAssetInput,
	index: number,
): RegisteredComponentAsset {
	return {
		level: "component",
		id: component.id,
		name: component.name ?? component.id,
		order: normalizeOrder(component.order, index),
		type: component.type ?? "Unknown",
		...(component.description ? { description: component.description } : {}),
		props: { ...(component.props ?? {}) },
		...(component.raw ? { raw: component.raw } : {}),
	};
}

function orderByIndex<T extends { order?: number }>(items: T[]): T[] {
	return items
		.map((item, index) => ({ item, index }))
		.sort(
			(left, right) =>
				normalizeOrder(left.item.order, left.index) - normalizeOrder(right.item.order, right.index),
		)
		.map(({ item }) => item);
}

function orderRefs<T extends Record<TKey, string> & { order?: number }, TKey extends string>(
	items: T[],
	idKey: TKey,
): T[] {
	return items
		.map((item, index) => ({ item, index }))
		.sort((left, right) => {
			const orderDiff =
				normalizeOrder(left.item.order, left.index) - normalizeOrder(right.item.order, right.index);
			if (orderDiff !== 0) return orderDiff;
			return left.item[idKey].localeCompare(right.item[idKey]);
		})
		.map(({ item }) => item);
}

function normalizeOrder(order: number | undefined, index: number): number {
	return Number.isFinite(order) ? Number(order) : index + 1;
}
