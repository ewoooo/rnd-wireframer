import { createPatternResolver, type AreaResolutionInput } from "../pattern/pattern-resolver";
import type {
	ComposedComponentNode,
	ComposedNodeTree,
	ComposedAreaNode,
	ComposedRouteNode,
	ComposedScreenNode,
	ComposedVariantNode,
	DecoratedComponentNode,
	DecoratedNodeTree,
	DecoratedAreaNode,
	DecoratedRouteNode,
	DecoratedScreenNode,
	DecoratedVariantNode,
	PatternRef,
	PatternResolver,
} from "../types";

export interface DecorateRegisteredAssetsOptions {
	resolvePattern?: PatternResolver;
}

export function decorateRegisteredAssets(
	composed: ComposedNodeTree,
	options: DecorateRegisteredAssetsOptions = {},
): DecoratedNodeTree {
	const resolvePattern = options.resolvePattern ?? createPatternResolver();

	const components: DecoratedComponentNode[] = (composed.components ?? []).map((component) =>
		attachPattern(component, "component", resolvePattern),
	);
	const componentTypeById = new Map<string, string>();
	for (const component of components) {
		if (component.type) componentTypeById.set(component.id, component.type);
	}

	const areas: DecoratedAreaNode[] = (composed.areas ?? []).map((area) =>
		attachAreaPattern(area, componentTypeById, resolvePattern),
	);

	const screens: DecoratedScreenNode[] = composed.screens.map((screen) =>
		attachPattern(screen, "screen", resolvePattern),
	);
	const variants: DecoratedVariantNode[] = composed.variants.map((variant) =>
		attachPattern(variant, "variant", resolvePattern),
	);
	const routes: DecoratedRouteNode[] = composed.routes.map((route) =>
		attachPattern(route, "route", resolvePattern),
	);

	return { routes, variants, screens, areas, components, warnings: [] };
}

function attachPattern<
	TLevel extends "route" | "variant" | "screen" | "component",
	TNode extends
		| ComposedRouteNode
		| ComposedVariantNode
		| ComposedScreenNode
		| ComposedComponentNode,
>(node: TNode, level: TLevel, resolvePattern: PatternResolver): TNode & { pattern: PatternRef } {
	const pattern = resolvePattern({ level, node }) ?? fallbackPattern(level);
	return { ...node, pattern };
}

function attachAreaPattern(
	area: ComposedAreaNode,
	componentTypeById: ReadonlyMap<string, string>,
	resolvePattern: PatternResolver,
): DecoratedAreaNode {
	const compositeTypes = new Set<string>();
	for (const ref of area.children ?? []) {
		const type = componentTypeById.get(ref.componentId);
		if (type) compositeTypes.add(type);
	}
	const resolverInput: AreaResolutionInput = { ...area, __compositeTypes: compositeTypes };
	const pattern =
		resolvePattern({ level: "area", node: resolverInput }) ?? fallbackPattern("area");
	return { ...area, pattern };
}

function fallbackPattern(level: string): PatternRef {
	return { id: `${level}-unknown`, variant: "default", reasons: ["no matching pattern"] };
}
