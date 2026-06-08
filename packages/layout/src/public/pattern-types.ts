export type PropBinding = {
	bind: string;
	default?: string | number | boolean | null;
};

export type PropValue =
	| string
	| number
	| boolean
	| null
	| PropValue[]
	| { [key: string]: PropValue }
	| PropBinding;

export type DatabasePatternRef = {
	id: string;
	variant?: string;
};

export type ScreenRegionType = "Screen.Header" | "Screen.Contents" | "Screen.Bottom";

export type PatternLayoutProps = Record<string, PropValue>;

export type ChildWrapPreset = {
	kind: "page-stack";
	appliesTo?: Array<"component" | "area">;
	divider?: "contents" | "none" | "section";
	itemPaddingX?: number;
	itemTemplate?: "card-0" | "default-20" | "plain";
	paddingY?: number;
	sectionPaddingX?: number;
	sectionGap?: number;
	slotInsetX?: number;
};

export type ChildrenLayoutPreset = {
	childOrder?: "explicit" | "repeat";
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
export type LayoutPatternTarget = PatternStoreTarget;

export type LayoutPatternPropType =
	| "array"
	| "boolean"
	| "enum"
	| "node"
	| "number"
	| "object"
	| "string";

export type LayoutPatternPropContract = {
	type: LayoutPatternPropType;
	aiWritable?: boolean;
	description?: string;
	required?: boolean;
	values?: string[];
};

export type LayoutPatternChildrenContract = {
	accepts: "any" | "area" | "area-or-component" | "component" | "none" | "region";
	max?: number;
	min?: number;
};

export type LayoutPatternStatus = "deprecated" | "draft" | "ready";

export type LayoutPatternCatalogEntry = {
	id: `layout.${LayoutPatternTarget}.${string}`;
	target: LayoutPatternTarget;
	name: string;
	componentID: string;
	children?: LayoutPatternChildrenContract;
	description?: string;
	props?: Record<string, LayoutPatternPropContract>;
	status?: LayoutPatternStatus;
};

export type LayoutPatternCatalog = {
	patterns: LayoutPatternCatalogEntry[];
};

export type LayoutCatalogListOptions = {
	status?: LayoutPatternStatus;
	target?: LayoutPatternTarget;
};

export type CreateLayoutCandidateInput = {
	entry: LayoutPatternCatalogEntry;
};

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

export type PatternStoreIssueCode = "duplicate-pattern-id" | "pattern-not-found" | "schema-invalid";

export type PatternStoreIssue = {
	code: PatternStoreIssueCode;
	message: string;
	path?: Array<string | number>;
};

export type PatternStoreChangeType = "create" | "delete" | "update" | "upsert";

export type PatternStoreChange = {
	type: PatternStoreChangeType;
	id: string;
	target: PatternStoreTarget;
	before?: PatternStorePattern;
	after?: PatternStorePattern;
};

export type CreateLayoutPatternInput = PatternStorePattern;

export type ReadLayoutPatternInput = {
	id: string;
	target?: PatternStoreTarget;
};

export type UpdateLayoutPatternInput = {
	id: string;
	target?: PatternStoreTarget;
	patch: Partial<Omit<PatternStorePattern, "id">>;
};

export type DeleteLayoutPatternInput = {
	id: string;
	target?: PatternStoreTarget;
};

export type UpsertLayoutPatternInput = PatternStorePattern;

export type PatternStoreReadResult =
	| { ok: true; pattern: PatternStorePattern }
	| { ok: false; issues: PatternStoreIssue[] };

export type PatternStoreMutationResult =
	| {
			ok: true;
			store: PatternStore;
			pattern?: PatternStorePattern;
			changes: PatternStoreChange[];
	  }
	| { ok: false; issues: PatternStoreIssue[] };
