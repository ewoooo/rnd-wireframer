import type { PropValue } from "./database-tables";

export type PatternLayoutProps = Record<string, PropValue>;

export type ChildWrapPreset = {
	kind: "page-stack";
	appliesTo?: Array<"component" | "area">;
	divider?: { type: "contents" | "section" };
	itemPaddingX?: number;
	paddingY?: number;
	sectionPaddingX?: number;
};

export type ChildrenLayoutPreset = {
	childOrder?: "explicit";
	childWrap?: ChildWrapPreset;
	direction?: "horizontal" | "vertical";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	layoutProps?: PatternLayoutProps;
};

export type RegionVariant = ChildrenLayoutPreset;
export type AreaVariant = ChildrenLayoutPreset;
export type CompositeVariant = ChildrenLayoutPreset;
export type ScreenVariant = ChildrenLayoutPreset;

export type SetMatcher = {
	anyOf?: string[];
	allOf?: string[];
	noneOf?: string[];
};

export type PatternResolutionSignals = {
	areaPatterns?: SetMatcher;
	compositePatterns?: SetMatcher;
	componentTypes?: SetMatcher;
	nameKeywords?: string[];
	idPatterns?: string[];
	priority?: number;
};

export type PatternStoreTarget = "screen" | "region" | "area" | "composite";

export type PatternStorePattern = {
	id: string;
	target: PatternStoreTarget;
	name: string;
	description?: string;
	defaultVariant: string;
	resolution?: PatternResolutionSignals;
	variants: Record<string, ChildrenLayoutPreset>;
};

export type RegionPattern = PatternStorePattern & { target: "region" };
export type AreaPattern = PatternStorePattern & { target: "area" };
export type CompositePattern = PatternStorePattern & { target: "composite" };
export type ScreenPattern = PatternStorePattern & { target: "screen" };
export type Pattern = ScreenPattern | RegionPattern | AreaPattern | CompositePattern;

export type PatternStore = {
	patterns: PatternStorePattern[];
};
