import type {
	ComposedComponentNode,
	ComposedAreaNode,
	PatternRef,
	PatternResolver,
} from "../types";

const DEFAULT_VARIANT = "default";

export interface AreaResolutionInput extends ComposedAreaNode {
	__compositeTypes?: ReadonlySet<string>;
}

import type {
	CompositePattern,
	AreaPattern,
	Pattern,
	PatternResolutionSignals,
} from "./pattern-schema";
import {
	isCompositePattern,
	isAreaPattern,
	listPatterns,
	normalizePatternId,
} from "./pattern-store";

export interface PatternResolverFactoryOptions {
	patterns?: Pattern[];
}

/**
 * Resolver chain: composite → area → screen.
 * decorate-assets processes assets in that order so area/screen resolution
 * can read upstream decorations from the cross-linked asset.
 */
export function createPatternResolver(
	options: PatternResolverFactoryOptions = {},
): PatternResolver {
	const patterns = options.patterns ?? listPatterns();
	const areaPatterns = patterns.filter(isAreaPattern);
	const compositePatterns = patterns.filter(isCompositePattern);

	return ({ level, node }) => {
		if (level === "component") {
			const component = node as ComposedComponentNode;
			const type = component.type ?? "unknown";
			return (
				resolveComposite(component, compositePatterns) ?? {
					id: `component-${normalizePatternId(type)}`,
					variant: DEFAULT_VARIANT,
					reasons: [`component type: ${type}`],
				}
			);
		}
		if (level === "area") {
			const area = node as AreaResolutionInput;
			return (
				resolveArea(area, areaPatterns) ?? {
					id: area.layout ? `area-${area.layout}` : "area-section",
					variant: DEFAULT_VARIANT,
					reasons: area.layout ? [`layout: ${area.layout}`] : ["default area pattern"],
				}
			);
		}
		if (level === "screen") {
			return {
				id: "screen-shell",
				variant: DEFAULT_VARIANT,
				reasons: ["deterministic screen shell"],
			};
		}
		if (level === "region") {
			const region = node as { slot?: string };
			const slot = region.slot ?? "contents";
			return {
				id: `region-${slot}`,
				variant: DEFAULT_VARIANT,
				reasons: [`region slot: ${slot}`],
			};
		}
		if (level === "variant") {
			return {
				id: "screen-variant",
				variant: DEFAULT_VARIANT,
				reasons: ["default variant pattern"],
			};
		}
		if (level === "route") {
			return {
				id: "screen-route",
				variant: DEFAULT_VARIANT,
				reasons: ["default route pattern"],
			};
		}
		return undefined;
	};
}

function resolveComposite(
	component: ComposedComponentNode,
	candidates: CompositePattern[],
): PatternRef | undefined {
	const scored = candidates
		.map((pattern) => scoreCompositePattern(pattern, component))
		.filter((entry) => entry.score > 0);
	return pickWinner(scored);
}

function scoreCompositePattern(
	pattern: CompositePattern,
	component: ComposedComponentNode,
): Scored<CompositePattern> {
	const reasons: string[] = [];
	let score = 0;
	const resolution = pattern.resolution;
	if (!resolution) return { pattern, score: 0, reasons };

	score += scoreNameKeywords(resolution, component.name, component.description, reasons);
	score += scoreIdPatterns(resolution, component.id, reasons);

	return { pattern, score, reasons };
}

function resolveArea(
	area: AreaResolutionInput,
	candidates: AreaPattern[],
): PatternRef | undefined {
	const compositeTypes = area.__compositeTypes ?? new Set<string>();
	const scored = candidates
		.map((pattern) => scoreAreaPattern(pattern, area, compositeTypes))
		.filter((entry) => entry.score > 0);
	return pickWinner(scored);
}

function scoreAreaPattern(
	pattern: AreaPattern,
	area: ComposedAreaNode,
	compositeTypes: ReadonlySet<string>,
): Scored<AreaPattern> {
	const reasons: string[] = [];
	let score = 0;
	const resolution = pattern.resolution;
	if (!resolution) return { pattern, score: 0, reasons };

	const typeMatcher = resolution.compositeTypes;
	if (typeMatcher) {
		if (typeMatcher.noneOf?.some((t) => compositeTypes.has(t))) {
			return { pattern, score: 0, reasons };
		}
		if (typeMatcher.allOf?.length) {
			const missing = typeMatcher.allOf.filter((t) => !compositeTypes.has(t));
			if (missing.length > 0) return { pattern, score: 0, reasons };
			score += 20;
			reasons.push(`composite types allOf matched (${typeMatcher.allOf.join(", ")})`);
		}
		if (typeMatcher.anyOf?.length) {
			const matched = typeMatcher.anyOf.filter((t) => compositeTypes.has(t));
			if (matched.length > 0) {
				score += 10 * matched.length;
				reasons.push(`composite types anyOf matched (${matched.join(", ")})`);
			}
		}
	}

	score += scoreNameKeywords(resolution, area.name, area.description, reasons);
	score += scoreIdPatterns(resolution, area.id, reasons);

	return { pattern, score, reasons };
}

function scoreNameKeywords(
	resolution: PatternResolutionSignals,
	name: string | undefined,
	description: string | undefined,
	reasons: string[],
): number {
	if (!resolution?.nameKeywords?.length) return 0;
	const haystack = `${name ?? ""} ${description ?? ""}`.toLowerCase();
	const matched = resolution.nameKeywords.filter((kw) => haystack.includes(kw.toLowerCase()));
	if (matched.length === 0) return 0;
	reasons.push(`name keywords matched (${matched.join(", ")})`);
	return 15 * matched.length;
}

function scoreIdPatterns(
	resolution: PatternResolutionSignals,
	id: string,
	reasons: string[],
): number {
	if (!resolution?.idPatterns?.length) return 0;
	const matched = resolution.idPatterns.filter((source) => safeRegexTest(source, id));
	if (matched.length === 0) return 0;
	reasons.push(`id pattern matched (${matched.join(", ")})`);
	return 3 * matched.length;
}

function safeRegexTest(source: string, value: string): boolean {
	try {
		return new RegExp(source).test(value);
	} catch {
		return false;
	}
}

interface Scored<TPattern extends Pattern> {
	pattern: TPattern;
	score: number;
	reasons: string[];
}

function pickWinner<TPattern extends Pattern>(
	scored: Array<Scored<TPattern>>,
): PatternRef | undefined {
	if (scored.length === 0) return undefined;
	scored.sort((a, b) => {
		const scoreDiff = b.score - a.score;
		if (scoreDiff !== 0) return scoreDiff;
		return (b.pattern.resolution?.priority ?? 0) - (a.pattern.resolution?.priority ?? 0);
	});
	const winner = scored[0];
	return { id: winner.pattern.id, variant: DEFAULT_VARIANT, reasons: winner.reasons };
}

export type { PatternResolutionSignals };
