import type { AreaType, ScreenRegionType, ScreenSurfaceType } from "./node-types";

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

export type NodeDisplay = {
	when?: PropBinding | boolean;
	stateRole?: "base" | "loading" | "empty" | "error" | "success" | "disabled" | "expanded";
};

// 공통 layout props. @cx/layout, @cx/renderer가 모두 이 정의를 사용한다.
export type FlexLayoutProps = {
	direction: "row" | "column";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type GridLayoutProps = {
	columns?: string;
	rows?: string;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "stretch";
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

export type NodeMetadata = {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
};

// 공통 row 베이스. 레벨 구분은 MaterializedNodeTree의 배열 위치(screens/areas/components)로 한다.
export type BaseRow = {
	id: string;
	version: string;
	metadata: NodeMetadata;
	pattern?: DatabasePatternRef;
};

export type DatabaseScreenRegionType = ScreenRegionType;

// Region은 row가 아닌 inline 구조체 — id/version 없음, ScreenBody.regions 안에서만 존재
export type DatabaseScreenRegion = {
	type: DatabaseScreenRegionType;
	componentVersion?: string;
	metadata: { title: string; description?: string };
	pattern?: DatabasePatternRef;
	props?: Record<string, PropValue>;
	children: DatabaseRegionChild[];
};

export type DatabaseScreenBody = {
	type: ScreenSurfaceType;
	regions: {
		header: DatabaseScreenRegion;
		contents: DatabaseScreenRegion;
		bottom: DatabaseScreenRegion;
	};
};

export type DatabaseScreenRow = BaseRow & {
	screenVariantId: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	order?: number;
	patternId?: string;
	patternVariant?: string;
	theme?: { mode?: "light" | "dark" | "system"; primaryColor?: string; fontFamily?: string };
	data?: Record<string, unknown>;
	screen: DatabaseScreenBody;
};

export type AreaTypeLiteral = AreaType;

export type DatabaseAreaRow = BaseRow & {
	type: AreaTypeLiteral;
	key?: number;
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
	children: Array<{ kind: "component"; id: string }>;
};

export type DatabaseComponentChildEntry = {
	component: { type?: string } & Record<string, unknown>;
	props: Record<string, unknown>;
};

export type DatabaseComponentRow = BaseRow & {
	type: string;
	pattern: DatabasePatternRef; // component는 pattern 필수
	children: DatabaseComponentChildEntry[];
	hooks?: NodeHook[];
	display?: NodeDisplay;
	events?: Record<string, unknown>;
};

// 후방호환 alias — 새 코드는 NodeMetadata를 직접 쓰세요
export type DatabaseScreenRowMetadata = NodeMetadata;
export type DatabaseAreaMetadata = NodeMetadata;
export type DatabaseComponentMetadata = NodeMetadata;

export type MaterializedNodeTree = {
	screenRoutes: DatabaseScreenRouteRow[];
	screenVariants: DatabaseScreenVariantRow[];
	screens: DatabaseScreenRow[];
	areas: DatabaseAreaRow[];
	components: DatabaseComponentRow[];
	warnings: string[];
};
