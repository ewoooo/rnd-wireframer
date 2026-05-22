import { listPatterns } from "../pattern-store";
import type {
	CompositePattern,
	OrganismPattern,
	Pattern,
	PatternResolutionSignals,
	ScreenPattern,
} from "../pattern-schema";
import type {
	MarketplaceConfidence,
	MarketplaceContext,
	MarketplaceProposal,
	MarketplaceRequest,
	Vendor,
} from "./types";

export interface VendorOptions {
	patterns?: Pattern[];
	maxAlternatives?: number;
}

export function createVendor(options: VendorOptions = {}): Vendor {
	const patterns = options.patterns ?? listPatterns();
	const maxAlternatives = options.maxAlternatives ?? 3;

	return {
		propose(request: MarketplaceRequest): MarketplaceProposal | undefined {
			const candidates = patterns.filter((p) => p.target === request.target);
			const rejected = new Set(request.rejectedPatterns ?? []);

			const scored = candidates
				.filter((p) => !rejected.has(p.id))
				.map((pattern) => scorePattern(pattern, request.context))
				.filter((entry) => entry.score > 0)
				.sort(byScoreThenPriority);

			if (scored.length === 0) return undefined;

			const winner = scored[0];
			const alternatives = scored.slice(1, maxAlternatives + 1).map((s) => s.pattern.id);
			return {
				patternId: winner.pattern.id,
				variantId: winner.pattern.defaultVariant,
				reasons: winner.reasons,
				alternatives,
				confidence: classifyConfidence(winner, scored),
				score: winner.score,
			};
		},
	};
}

interface Scored {
	pattern: Pattern;
	score: number;
	reasons: string[];
}

function byScoreThenPriority(a: Scored, b: Scored): number {
	const scoreDiff = b.score - a.score;
	if (scoreDiff !== 0) return scoreDiff;
	return (b.pattern.resolution?.priority ?? 0) - (a.pattern.resolution?.priority ?? 0);
}

function classifyConfidence(winner: Scored, scored: Scored[]): MarketplaceConfidence {
	if (winner.score >= 35) return "high";
	if (winner.score >= 20) {
		const gap = scored[1] ? winner.score - scored[1].score : winner.score;
		return gap >= 10 ? "high" : "medium";
	}
	return "low";
}

function scorePattern(pattern: Pattern, context: MarketplaceContext): Scored {
	const reasons: string[] = [];
	const resolution = pattern.resolution;
	if (!resolution) return { pattern, score: 0, reasons };

	let score = 0;
	if (pattern.target === "screen") {
		score += scoreOrganismMatcher(resolution, context, reasons);
	} else if (pattern.target === "organism") {
		score += scoreCompositeTypeMatcher(resolution, context, reasons);
	} else if (pattern.target === "composite") {
		score += scoreCompositeType(pattern, context, reasons);
	}
	if (score < 0) return { pattern, score: 0, reasons: [] };

	score += scoreNameKeywords(resolution, context, reasons);
	score += scoreIdPatterns(resolution, context.id, reasons);
	return { pattern, score, reasons };
}

function scoreOrganismMatcher(
	resolution: PatternResolutionSignals,
	context: MarketplaceContext,
	reasons: string[],
): number {
	const matcher = resolution?.organismPatterns;
	if (!matcher) return 0;
	const set = new Set(context.organismPatternIds ?? []);
	if (matcher.noneOf?.some((id) => set.has(id))) return -1;
	let score = 0;
	if (matcher.allOf?.length) {
		const missing = matcher.allOf.filter((id) => !set.has(id));
		if (missing.length > 0) return -1;
		score += 20;
		reasons.push(`organism allOf matched (${matcher.allOf.join(", ")})`);
	}
	if (matcher.anyOf?.length) {
		const matched = matcher.anyOf.filter((id) => set.has(id));
		if (matched.length > 0) {
			score += 10 * matched.length;
			reasons.push(`organism anyOf matched (${matched.join(", ")})`);
		}
	}
	return score;
}

function scoreCompositeTypeMatcher(
	resolution: PatternResolutionSignals,
	context: MarketplaceContext,
	reasons: string[],
): number {
	const matcher = resolution?.compositeTypes;
	if (!matcher) return 0;
	const set = new Set(context.compositeTypes ?? []);
	if (matcher.noneOf?.some((id) => set.has(id))) return -1;
	let score = 0;
	if (matcher.allOf?.length) {
		const missing = matcher.allOf.filter((id) => !set.has(id));
		if (missing.length > 0) return -1;
		score += 20;
		reasons.push(`composite types allOf matched (${matcher.allOf.join(", ")})`);
	}
	if (matcher.anyOf?.length) {
		const matched = matcher.anyOf.filter((id) => set.has(id));
		if (matched.length > 0) {
			score += 10 * matched.length;
			reasons.push(`composite types anyOf matched (${matched.join(", ")})`);
		}
	}
	return score;
}

function scoreCompositeType(pattern: Pattern, context: MarketplaceContext, reasons: string[]): number {
	if (pattern.target !== "composite") return 0;
	const cp = pattern as CompositePattern;
	const declared = cp.variants[cp.defaultVariant]?.type;
	const observed = context.compositeTypes?.[0];
	if (declared && observed && declared === observed) {
		reasons.push(`composite variant.type matched (${declared})`);
		return 30;
	}
	return 0;
}

function scoreNameKeywords(
	resolution: PatternResolutionSignals,
	context: MarketplaceContext,
	reasons: string[],
): number {
	if (!resolution?.nameKeywords?.length) return 0;
	const haystack = `${context.name ?? ""} ${context.description ?? ""}`.toLowerCase();
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
	const matched = resolution.idPatterns.filter((src) => safeRegex(src, id));
	if (matched.length === 0) return 0;
	reasons.push(`id pattern matched (${matched.join(", ")})`);
	return 3 * matched.length;
}

function safeRegex(source: string, value: string): boolean {
	try {
		return new RegExp(source).test(value);
	} catch {
		return false;
	}
}

export type { OrganismPattern, ScreenPattern };
