import compositePatternSet from "../../../../database/pattern-store/composite-patterns.json" with {
	type: "json",
};
import areaPatternSet from "../../../../database/pattern-store/area-patterns.json" with {
	type: "json",
};
import regionPatternSet from "../../../../database/pattern-store/region-patterns.json" with {
	type: "json",
};
import {
	type ChildrenLayoutPreset,
	type ChildWrapPreset,
	type CompositePattern,
	type CompositeVariant,
	type AreaPattern,
	type AreaVariant,
	type Pattern,
	type PatternResolutionSignals,
	patternStoreSchema,
	type RegionPattern,
	type RegionVariant,
} from "./pattern-schema";

export type PatternStoreTarget = Pattern["target"];

export type {
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	AreaPattern,
	AreaVariant,
	Pattern,
	PatternResolutionSignals,
	RegionPattern,
	RegionVariant,
};

export type PatternStorePattern = Pattern;
export type PatternStoreLayoutPreset = ChildrenLayoutPreset;
export type PatternStoreChildWrap = ChildWrapPreset;

export interface PatternStore {
	patterns: Pattern[];
}

let cachedStore: PatternStore | undefined;

export function loadPatternStore(): PatternStore {
	if (cachedStore) return cachedStore;

	const merged = {
		patterns: [
			...(regionPatternSet as { patterns: unknown[] }).patterns,
			...(areaPatternSet as { patterns: unknown[] }).patterns,
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

export function isRegionPattern(pattern: Pattern): pattern is RegionPattern {
	return pattern.target === "region";
}

export function isAreaPattern(pattern: Pattern): pattern is AreaPattern {
	return pattern.target === "area";
}

export function isCompositePattern(pattern: Pattern): pattern is CompositePattern {
	return pattern.target === "composite";
}

export function normalizePatternId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
