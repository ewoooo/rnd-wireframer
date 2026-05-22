import {
	isCompositePattern,
	isOrganismPattern,
	isScreenPattern,
	listPatterns,
} from "../pattern-store";
import type {
	CompositePattern,
	OrganismPattern,
	Pattern,
	PatternResolutionSignals,
	ScreenPattern,
} from "../pattern-schema";
import type {
	AssetDecoration,
	DecoratedOrganismAsset,
	DecoratedScreenAsset,
	PatternResolver,
	RegisteredComponentAsset,
} from "../types";

export interface PatternResolverFactoryOptions {
	patterns?: Pattern[];
	deriveVariantKey?: (screenId: string) => string;
}

/**
 * Resolver chain: composite → organism → screen.
 * decorate-assets processes assets in that order so organism/screen resolution
 * can read upstream decorations from the cross-linked asset.
 */
export function createPatternResolver(options: PatternResolverFactoryOptions = {}): PatternResolver {
	const patterns = options.patterns ?? listPatterns();
	const deriveKey = options.deriveVariantKey ?? defaultDeriveVariantKey;
	const screenPatterns = patterns.filter(isScreenPattern);
	const organismPatterns = patterns.filter(isOrganismPattern);
	const compositePatterns = patterns.filter(isCompositePattern);

	const screenCache = new Map<string, AssetDecoration | undefined>();

	return ({ level, asset }) => {
		if (level === "component") {
			return resolveComposite(asset as RegisteredComponentAsset, compositePatterns);
		}
		if (level === "organism") {
			return resolveOrganism(asset as DecoratedOrganismAsset, organismPatterns);
		}
		if (level === "screen") {
			const screen = asset as DecoratedScreenAsset;
			const key = deriveKey(screen.id);
			if (screenCache.has(key)) return screenCache.get(key);
			const decoration = resolveScreen(screen, screenPatterns);
			screenCache.set(key, decoration);
			return decoration;
		}
		return undefined;
	};
}

export function createScreenPatternResolver(
	options: PatternResolverFactoryOptions = {},
): PatternResolver {
	return createPatternResolver(options);
}

function defaultDeriveVariantKey(screenId: string): string {
	return screenId.replace(/-(?:0|E\d+|\d+)$/i, "");
}

function resolveComposite(
	component: RegisteredComponentAsset,
	candidates: CompositePattern[],
): AssetDecoration | undefined {
	const scored = candidates
		.map((pattern) => scoreCompositePattern(pattern, component))
		.filter((entry) => entry.score > 0);
	return pickWinner(scored);
}

function scoreCompositePattern(
	pattern: CompositePattern,
	component: RegisteredComponentAsset,
): Scored<CompositePattern> {
	const reasons: string[] = [];
	let score = 0;
	const resolution = pattern.resolution;
	if (!resolution) return { pattern, score: 0, reasons };

	const variantType = pattern.variants[pattern.defaultVariant]?.type;
	if (variantType && variantType === component.type) {
		score += 30;
		reasons.push(`variant.type matched (${variantType})`);
	}

	score += scoreNameKeywords(resolution, component.name, component.description, reasons);
	score += scoreIdPatterns(resolution, component.id, reasons);

	return { pattern, score, reasons };
}

function resolveOrganism(
	organism: DecoratedOrganismAsset,
	candidates: OrganismPattern[],
): AssetDecoration | undefined {
	const compositeTypes = new Set<string>();
	for (const ref of organism.components) {
		const type = ref.component?.asset.type;
		if (type) compositeTypes.add(type);
	}
	const scored = candidates
		.map((pattern) => scoreOrganismPattern(pattern, organism, compositeTypes))
		.filter((entry) => entry.score > 0);
	return pickWinner(scored);
}

function scoreOrganismPattern(
	pattern: OrganismPattern,
	organism: DecoratedOrganismAsset,
	compositeTypes: Set<string>,
): Scored<OrganismPattern> {
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

	score += scoreNameKeywords(resolution, organism.name, organism.description, reasons);
	score += scoreIdPatterns(resolution, organism.id, reasons);

	return { pattern, score, reasons };
}

function resolveScreen(
	screen: DecoratedScreenAsset,
	candidates: ScreenPattern[],
): AssetDecoration | undefined {
	const organismPatternIds = collectDecoratedOrganismPatternIds(screen);
	const scored = candidates
		.map((pattern) => scoreScreenPattern(pattern, screen, organismPatternIds))
		.filter((entry) => entry.score > 0);
	return pickWinner(scored);
}

function collectDecoratedOrganismPatternIds(screen: DecoratedScreenAsset): Set<string> {
	const ids = new Set<string>();
	for (const ref of screen.organisms) {
		const patternId = ref.organism?.decoration.patternId;
		if (patternId) ids.add(patternId);
	}
	return ids;
}

function scoreScreenPattern(
	pattern: ScreenPattern,
	screen: DecoratedScreenAsset,
	organismPatternIds: Set<string>,
): Scored<ScreenPattern> {
	const reasons: string[] = [];
	let score = 0;
	const resolution = pattern.resolution;
	if (!resolution) return { pattern, score: 0, reasons };

	const orgMatcher = resolution.organismPatterns;
	if (orgMatcher) {
		if (orgMatcher.noneOf?.some((id) => organismPatternIds.has(id))) {
			return { pattern, score: 0, reasons };
		}
		if (orgMatcher.allOf?.length) {
			const missing = orgMatcher.allOf.filter((id) => !organismPatternIds.has(id));
			if (missing.length > 0) return { pattern, score: 0, reasons };
			score += 20;
			reasons.push(`organism allOf matched (${orgMatcher.allOf.join(", ")})`);
		}
		if (orgMatcher.anyOf?.length) {
			const matched = orgMatcher.anyOf.filter((id) => organismPatternIds.has(id));
			if (matched.length > 0) {
				score += 10 * matched.length;
				reasons.push(`organism anyOf matched (${matched.join(", ")})`);
			}
		}
	}

	score += scoreNameKeywords(resolution, screen.name, screen.description, reasons);
	score += scoreIdPatterns(resolution, screen.id, reasons);

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
): AssetDecoration | undefined {
	if (scored.length === 0) return undefined;
	scored.sort((a, b) => {
		const scoreDiff = b.score - a.score;
		if (scoreDiff !== 0) return scoreDiff;
		return (b.pattern.resolution?.priority ?? 0) - (a.pattern.resolution?.priority ?? 0);
	});
	const winner = scored[0];
	return { patternId: winner.pattern.id, reasons: winner.reasons };
}

export type { DecoratedOrganismAsset, PatternResolutionSignals };
