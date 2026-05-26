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

export type NodeHook = {
	trigger: string;
	action: string;
	target?: string;
	params?: Record<string, unknown>;
};

export type DatabaseScreenRouteRow = {
	id: string;
	moduleId: string;
	name: string;
	order: number;
	processId: string | null;
};

export type DatabaseScreenVariantRow = {
	id: string;
	screenRouteId: string;
	name: string;
	order: number;
	variantType: "base" | "edge";
	followUp: string | null;
};

export type DatabaseRegionChild = { kind: "component"; id: string } | { kind: "area"; id: string };

export type DatabasePatternRef = {
	id: string;
	variant?: string;
};

export type DatabaseScreenRegionType = string;

export type DatabaseScreenRegion = {
	type: DatabaseScreenRegionType;
	componentVersion?: string;
	metadata: { title: string; description?: string };
	pattern?: DatabasePatternRef;
	props?: Record<string, PropValue>;
	children: DatabaseRegionChild[];
};

export type DatabaseScreenRowMetadata = {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
};

export type DatabaseScreenBody = {
	type: string;
	regions: {
		header: DatabaseScreenRegion;
		contents: DatabaseScreenRegion;
		bottom: DatabaseScreenRegion;
	};
};

export type DatabaseScreenRow = {
	id: string;
	screenVariantId: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	version: string;
	order?: number;
	pattern?: DatabasePatternRef;
	patternId?: string;
	patternVariant?: string;
	metadata: DatabaseScreenRowMetadata;
	theme?: { mode?: "light" | "dark" | "system"; primaryColor?: string; fontFamily?: string };
	data?: Record<string, unknown>;
	screen: DatabaseScreenBody;
};

export type AreaTypeLiteral = "area.static" | "area.dynamic";

export type DatabaseAreaMetadata = {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
};

export type DatabaseAreaRow = {
	id: string;
	type: AreaTypeLiteral;
	version: string;
	key?: number;
	metadata: DatabaseAreaMetadata;
	props?: {
		name?: string;
		layout?: string;
		areaType?: string;
		visibility?: string;
		minCount?: number;
		maxCount?: number;
		priority?: number;
		errorPolicy?: string;
		policyAnchors?: string[];
		trigger?: { type: "boolean-state"; source: string; defaultValue?: boolean };
		[k: string]: unknown;
	};
	pattern?: DatabasePatternRef;
	children: Array<{ kind: "component"; id: string }>;
};

export type DatabaseComponentChildEntry = {
	component: { type?: string } & Record<string, unknown>;
	props: Record<string, unknown>;
};

export type DatabaseComponentMetadata = {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
};

export type DatabaseComponentRow = {
	id: string;
	type: string;
	version: string;
	metadata: DatabaseComponentMetadata;
	pattern: { id: string; variant: string };
	children: DatabaseComponentChildEntry[];
	hooks?: NodeHook[];
	events?: Record<string, unknown>;
};

export type MaterializedDatabaseNodeTables = {
	screenRoutes: DatabaseScreenRouteRow[];
	screenVariants: DatabaseScreenVariantRow[];
	screens: DatabaseScreenRow[];
	areas: DatabaseAreaRow[];
	components: DatabaseComponentRow[];
	warnings: string[];
};
