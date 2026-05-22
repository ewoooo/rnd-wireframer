import compositePatternSet from "../../../docs/pattern-store/composite-patterns.json" with {
	type: "json",
};
import organismPatternSet from "../../../docs/pattern-store/organism-patterns.json" with {
	type: "json",
};
import screenPatternSet from "../../../docs/pattern-store/screen-patterns.json" with {
	type: "json",
};
import {
	type CompositePattern,
	type CompositeVariant,
	type OrganismPattern,
	type OrganismVariant,
	type PageStackPattern,
	type Pattern,
	type PatternChromeSlot,
	type PatternResolutionSignals,
	patternStoreSchema,
	type ScreenPattern,
	type ScreenRegion,
	type ScreenVariant,
} from "./pattern-schema";

export type PatternStoreTarget = Pattern["target"];

export type {
	CompositePattern,
	CompositeVariant,
	OrganismPattern,
	OrganismVariant,
	PageStackPattern,
	Pattern,
	PatternChromeSlot,
	PatternResolutionSignals,
	ScreenPattern,
	ScreenRegion,
	ScreenVariant,
};

export type PatternStorePattern = Pattern;
export type PatternStorePageStack = PageStackPattern;

export interface PatternStore {
	patterns: Pattern[];
}

let cachedStore: PatternStore | undefined;

export function loadPatternStore(): PatternStore {
	if (cachedStore) return cachedStore;

	const merged = {
		patterns: [
			...(screenPatternSet as { patterns: unknown[] }).patterns,
			...(organismPatternSet as { patterns: unknown[] }).patterns,
			...(compositePatternSet as { patterns: unknown[] }).patterns,
		],
	};

	const parsed = patternStoreSchema.safeParse(merged);
	if (!parsed.success) {
		const lines = parsed.error.issues.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
			return `  - ${path}: ${issue.message}`;
		});
		throw new Error(`pattern store failed schema validation:\n${lines.join("\n")}`);
	}

	cachedStore = parsed.data;
	return cachedStore;
}

export function listPatterns(target?: PatternStoreTarget): Pattern[] {
	const all = loadPatternStore().patterns;
	if (!target) return all;
	return all.filter((pattern) => pattern.target === target);
}

export function findPattern(id: string, target?: PatternStoreTarget): Pattern | undefined {
	return loadPatternStore().patterns.find(
		(pattern) => pattern.id === id && (target ? pattern.target === target : true),
	);
}

export function isScreenPattern(pattern: Pattern): pattern is ScreenPattern {
	return pattern.target === "screen";
}

export function isOrganismPattern(pattern: Pattern): pattern is OrganismPattern {
	return pattern.target === "organism";
}

export function isCompositePattern(pattern: Pattern): pattern is CompositePattern {
	return pattern.target === "composite";
}
