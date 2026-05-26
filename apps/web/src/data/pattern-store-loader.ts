import type {
	ChildrenLayoutPreset,
	PatternResolutionSignals,
	PatternStore,
	PatternStorePattern,
	SetMatcher,
} from "@cx/types";
import areaPatternSet from "../../../../database/pattern-store/area-patterns.json";
import compositePatternSet from "../../../../database/pattern-store/composite-patterns.json";
import regionPatternSet from "../../../../database/pattern-store/region-patterns.json";
import screenPatternSet from "../../../../database/pattern-store/screen-patterns.json";

const DEFAULT_PATTERN_VARIANT = "default";

type PatternCatalogMatch = {
	areas?: SetMatcher;
	composites?: SetMatcher;
	componentTypes?: SetMatcher;
	keywords?: string[];
	ids?: string[];
	priority?: number;
};

type PatternCatalogEntry = Pick<PatternStorePattern, "id" | "target" | "name" | "description"> & {
	variant?: string;
	variants?: Array<{ name?: string; id?: string } | string>;
	layout?: ChildrenLayoutPreset;
	match?: PatternCatalogMatch;
};

type PatternCatalogSet = {
	patterns: PatternCatalogEntry[];
};

const PATTERN_CATALOG_SETS = [
	regionPatternSet,
	areaPatternSet,
	compositePatternSet,
	screenPatternSet,
] as PatternCatalogSet[];

const RESOLUTION_MATCH_FIELDS = {
	areaPatterns: "areas",
	compositePatterns: "composites",
	componentTypes: "componentTypes",
	idPatterns: "ids",
	nameKeywords: "keywords",
	priority: "priority",
} as const satisfies Record<keyof PatternResolutionSignals, keyof PatternCatalogMatch>;

let cachedPatternStore: PatternStore | undefined;

export function loadPatternStoreForWorkbench(): PatternStore {
	if (cachedPatternStore) return cachedPatternStore;

	cachedPatternStore = {
		patterns: PATTERN_CATALOG_SETS.flatMap((set) => set.patterns).map(normalizeCatalogPattern),
	};

	return cachedPatternStore;
}

function normalizeCatalogPattern(pattern: PatternCatalogEntry): PatternStorePattern {
	const { layout, match, variant, variants, ...base } = pattern;
	const defaultVariant = variant ?? DEFAULT_PATTERN_VARIANT;
	const variantNames = normalizeVariantNames(variants, defaultVariant);

	return {
		...base,
		defaultVariant,
		resolution: normalizeCatalogMatch(match),
		variants: Object.fromEntries(variantNames.map((name) => [name, layout ?? {}])),
	};
}

function normalizeVariantNames(
	variants: PatternCatalogEntry["variants"],
	defaultVariant: string,
): string[] {
	if (!variants) return [defaultVariant];
	const names = variants
		.map((entry) => (typeof entry === "string" ? entry : (entry.name ?? entry.id)))
		.filter((name): name is string => typeof name === "string" && name.length > 0);
	return names.includes(defaultVariant) ? names : [defaultVariant, ...names];
}

function normalizeCatalogMatch(
	match: PatternCatalogMatch | undefined,
): PatternResolutionSignals | undefined {
	if (!match) return undefined;

	const resolution = Object.fromEntries(
		Object.entries(RESOLUTION_MATCH_FIELDS).flatMap(([resolutionKey, matchKey]) => {
			const value = match[matchKey];
			return value === undefined ? [] : [[resolutionKey, value]];
		}),
	) as PatternResolutionSignals;

	return Object.keys(resolution).length > 0 ? resolution : undefined;
}
