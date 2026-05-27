import type {
	AreaPattern,
	AreaVariant,
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	Pattern,
	PatternResolutionSignals,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	RegionPattern,
	RegionVariant,
	ScreenPattern,
	ScreenVariant,
} from "@cx/types";
import { patternCatalogSets } from "./data";
import { patternStoreSchema } from "./schema";

export type {
	AreaPattern,
	AreaVariant,
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	Pattern,
	PatternResolutionSignals,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	RegionPattern,
	RegionVariant,
	ScreenPattern,
	ScreenVariant,
};

export type PatternStoreLayoutPreset = ChildrenLayoutPreset;
export type PatternStoreChildWrap = ChildWrapPreset;

export interface PatternSummary {
	id: string;
	target: PatternStoreTarget;
	name: string;
	description?: string;
	defaultVariant: string;
	variants: string[];
}

let cachedStore: PatternStore | undefined;

export function loadPatternStore(): PatternStore {
	if (cachedStore) return cachedStore;

	const merged = {
		patterns: patternCatalogSets.flatMap((set) => (set as { patterns: unknown[] }).patterns),
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

export const patternStore = loadPatternStore();

export function listPatterns(target?: PatternStoreTarget): Pattern[] {
	const all = loadPatternStore().patterns as Pattern[];
	if (!target) return all;
	return all.filter((pattern) => pattern.target === target);
}

export function listPatternSummaries(target?: PatternStoreTarget): PatternSummary[] {
	return listPatterns(target).map((pattern) => ({
		id: pattern.id,
		target: pattern.target,
		name: pattern.name,
		description: pattern.description,
		defaultVariant: pattern.defaultVariant,
		variants: Object.keys(pattern.variants),
	}));
}

export function findPattern(id: string, target?: PatternStoreTarget): Pattern | undefined {
	return listPatterns().find(
		(pattern) => pattern.id === id && (target ? pattern.target === target : true),
	);
}

export function isRegionPattern(pattern: Pattern): pattern is RegionPattern {
	return pattern.target === "region";
}

export function isAreaPattern(pattern: Pattern): pattern is AreaPattern {
	return pattern.target === "area";
}

export function isCompositePattern(pattern: Pattern): pattern is CompositePattern {
	return pattern.target === "composite";
}

export function isScreenPattern(pattern: Pattern): pattern is ScreenPattern {
	return pattern.target === "screen";
}

export function normalizePatternId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
