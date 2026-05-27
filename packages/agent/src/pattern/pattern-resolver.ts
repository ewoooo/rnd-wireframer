import type {
	ComposedAreaNode,
	ComposedComponentNode,
	NodeLevel,
	PatternRef,
	PatternResolver,
} from "../types";

const DEFAULT_VARIANT = "default";

/**
 * Fallback pattern ID 상수. Resolver가 매칭에 실패했을 때 반환하는 기본값.
 * pattern-store에 별도 등록되어 있지 않은 deterministic 값.
 */
const FALLBACK_PATTERN_ID = {
	screen: "screen-shell",
	variant: "screen-variant",
	route: "screen-route",
	areaWithoutLayout: "area-section",
	areaWithLayout: (layout: string) => `area-${layout}`,
	region: (slot: string) => `region-${slot}`,
} as const;

export interface AreaResolutionInput extends ComposedAreaNode {
	__componentTypes?: ReadonlySet<string>;
}

import type {
	AreaPattern,
	CompositePattern,
	Pattern,
	PatternResolutionSignals,
} from "@cx/pattern-store";
import {
	isAreaPattern,
	isCompositePattern,
	listPatterns,
	normalizePatternId,
} from "@cx/pattern-store";

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

	const resolverByLevel = {
		component: (node) => {
			const component = node as ComposedComponentNode;
			const type = component.type ?? "unknown";
			return (
				resolveComposite(component, compositePatterns) ?? {
					id: `component-${normalizePatternId(type)}`,
					variant: DEFAULT_VARIANT,
					reasons: [`component type: ${type}`],
				}
			);
		},
		area: (node) => {
			const area = node as AreaResolutionInput;
			return (
				resolveArea(area, areaPatterns) ?? {
					id: area.layout
						? FALLBACK_PATTERN_ID.areaWithLayout(area.layout)
						: FALLBACK_PATTERN_ID.areaWithoutLayout,
					variant: DEFAULT_VARIANT,
					reasons: area.layout ? [`layout: ${area.layout}`] : ["default area pattern"],
				}
			);
		},
		screen: () => ({
			id: FALLBACK_PATTERN_ID.screen,
			variant: DEFAULT_VARIANT,
			reasons: ["deterministic screen shell"],
		}),
		region: (node) => {
			const region = node as { slot?: string };
			const slot = region.slot ?? "contents";
			return {
				id: FALLBACK_PATTERN_ID.region(slot),
				variant: DEFAULT_VARIANT,
				reasons: [`region slot: ${slot}`],
			};
		},
		variant: () => ({
			id: FALLBACK_PATTERN_ID.variant,
			variant: DEFAULT_VARIANT,
			reasons: ["default variant pattern"],
		}),
		route: () => ({
			id: FALLBACK_PATTERN_ID.route,
			variant: DEFAULT_VARIANT,
			reasons: ["default route pattern"],
		}),
	} satisfies Record<NodeLevel, (node: unknown) => PatternRef | undefined>;

	return ({ level, node }) => resolverByLevel[level]?.(node);
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

function resolveArea(area: AreaResolutionInput, candidates: AreaPattern[]): PatternRef | undefined {
	const componentTypes = area.__componentTypes ?? new Set<string>();
	const scored = candidates
		.map((pattern) => scoreAreaPattern(pattern, area, componentTypes))
		.filter((entry) => entry.score > 0);
	return pickWinner(scored);
}

function scoreAreaPattern(
	pattern: AreaPattern,
	area: ComposedAreaNode,
	componentTypes: ReadonlySet<string>,
): Scored<AreaPattern> {
	const reasons: string[] = [];
	let score = 0;
	const resolution = pattern.resolution;
	if (!resolution) return { pattern, score: 0, reasons };

	const typeMatcher = resolution.componentTypes;
	if (typeMatcher) {
		if (typeMatcher.noneOf?.some((t) => componentTypes.has(t))) {
			return { pattern, score: 0, reasons };
		}
		if (typeMatcher.allOf?.length) {
			const missing = typeMatcher.allOf.filter((t) => !componentTypes.has(t));
			if (missing.length > 0) return { pattern, score: 0, reasons };
			score += 20;
			reasons.push(`component types allOf matched (${typeMatcher.allOf.join(", ")})`);
		}
		if (typeMatcher.anyOf?.length) {
			const matched = typeMatcher.anyOf.filter((t) => componentTypes.has(t));
			if (matched.length > 0) {
				score += 10 * matched.length;
				reasons.push(`component types anyOf matched (${matched.join(", ")})`);
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
	// priority 시스템 제거 (2026-05-26): 동점일 때 pattern id 알파벳 순으로 deterministic 결정.
	// 다중 매칭이 의미 있는 다른 패턴을 가리키면 AI Pattern Selector가 최종 결정한다.
	scored.sort((a, b) => {
		const scoreDiff = b.score - a.score;
		if (scoreDiff !== 0) return scoreDiff;
		return a.pattern.id.localeCompare(b.pattern.id);
	});
	const winner = scored[0];
	return { id: winner.pattern.id, variant: DEFAULT_VARIANT, reasons: winner.reasons };
}

export type { PatternResolutionSignals };
