import type {
	GeneratedNodeTree,
	RegisteredRouteNode,
	RegisteredScreenNode,
	RegisteredTableRows,
	RegisteredVariantNode,
} from "../types";
import { registerAssets } from "./register-assets";

export function registerAssetsToTables(input: GeneratedNodeTree): RegisteredTableRows {
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
	const areas = registry.areas.map((area) => ({
		id: area.id,
		name: area.name,
		order: area.order,
		...(area.description ? { description: area.description } : {}),
		...(area.layout ? { layout: area.layout } : {}),
		children: area.children.map((component) => ({
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
		areas,
		components,
		warnings: [...registry.warnings],
	};
}

function mapVariantRow(route: RegisteredRouteNode, variant: RegisteredVariantNode) {
	return {
		code: variant.id,
		screenRouteCode: route.id,
		name: variant.name,
		order: variant.order,
		...(variant.description ? { description: variant.description } : {}),
	};
}

function mapScreenRow(variant: RegisteredVariantNode, screen: RegisteredScreenNode) {
	return {
		id: screen.id,
		screenVariantId: variant.id,
		name: screen.name,
		order: screen.order,
		...(screen.description ? { description: screen.description } : {}),
		...(screen.surface ? { surface: screen.surface } : {}),
		areas: screen.areas.map((area) => ({
			areaId: area.areaId,
			order: area.order,
		})),
	};
}
