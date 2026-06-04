import { createPatternResolver } from "../pattern/pattern-resolver";
import type {
	ComposedAreaNode,
	ComposedPrddScreen,
	DecoratedAreaNode,
	DecoratedBottomRegion,
	DecoratedComponentNode,
	DecoratedContentsRegion,
	DecoratedHeaderRegion,
	DecoratedPrddScreen,
	DecoratedScreenNode,
	PatternRef,
	PatternResolver,
} from "../types";

export interface DecoratePrddOptions {
	resolvePattern?: PatternResolver;
}

export function decoratePrddScreen(
	composed: ComposedPrddScreen,
	options: DecoratePrddOptions = {},
): DecoratedPrddScreen {
	const resolvePattern = options.resolvePattern ?? createPatternResolver();
	const warnings = [...composed.warnings];

	const components: DecoratedComponentNode[] = composed.components.map((c) => ({
		...c,
		pattern: resolvePattern({ level: "component", node: c }) ?? fallback("component"),
	}));

	const areas: DecoratedAreaNode[] = composed.areas.map((a) => decorateArea(a, resolvePattern));

	const screen: DecoratedScreenNode = {
		...composed.screen,
		pattern: resolvePattern({ level: "screen", node: composed.screen }) ?? fallback("screen"),
	};

	const header: DecoratedHeaderRegion = {
		level: "region",
		slot: "header",
		pattern: resolvePattern({ level: "region", node: composed.header }) ?? fallback("region-header"),
		children: composed.header.children,
	};
	const contents: DecoratedContentsRegion = {
		level: "region",
		slot: "contents",
		pattern:
			resolvePattern({ level: "region", node: composed.contents }) ?? fallback("region-contents"),
		children: areas,
	};
	const bottom: DecoratedBottomRegion = {
		level: "region",
		slot: "bottom",
		pattern: resolvePattern({ level: "region", node: composed.bottom }) ?? fallback("region-bottom"),
		children: composed.bottom.children,
	};

	return { screen, header, contents, bottom, components, areas, warnings };
}

function decorateArea(area: ComposedAreaNode, resolve: PatternResolver): DecoratedAreaNode {
	return {
		...area,
		pattern: resolve({ level: "area", node: area }) ?? fallback("area"),
	};
}

function fallback(level: string): PatternRef {
	return { id: `${level}-unknown`, variant: "default", reasons: ["no matching pattern"] };
}
