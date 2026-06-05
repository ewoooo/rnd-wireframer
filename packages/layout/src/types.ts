import { RENDER_TREE_NODE_TYPE_GROUPS } from "@cx/schema";

/**
 * 노드 type 어휘의 정본은 @cx/schema다. layout은 자신이 다루는 구조 그룹
 * (screen root / screen region / layout primitive)만 그 정본에서 골라 재노출한다.
 */
export const LAYOUT_NODE_TYPES = {
	layout: RENDER_TREE_NODE_TYPE_GROUPS.layout,
	screenRegion: RENDER_TREE_NODE_TYPE_GROUPS.screenRegion,
	screenRoot: RENDER_TREE_NODE_TYPE_GROUPS.screenRoot,
} as const;

/**
 * layout/region 노드가 받는 prop의 형태 계약이다. 노드 prop의 정본은 위 타입들이
 * 소유하므로, 그 계약을 런타임에 검사 가능한 형태로 노출하는 이 테이블도 같은 곳에 둔다.
 * (검증 자체는 @cx/validation이 이 테이블을 소비해 수행한다.)
 */
export type LayoutPropContract = {
	booleanProps: readonly string[];
	enumProps: Record<string, readonly string[]>;
	numberProps: readonly string[];
	requiredProps: readonly string[];
	stringProps: readonly string[];
};

export type LayoutPropContractType =
	| (typeof LAYOUT_NODE_TYPES.layout)[number]
	| (typeof LAYOUT_NODE_TYPES.screenRegion)[number];

export const LAYOUT_PROP_CONTRACTS = {
	"Layout.Flex": {
		booleanProps: [],
		enumProps: {
			align: ["start", "center", "end", "stretch"],
			direction: ["row", "column"],
			justify: ["start", "center", "end", "between"],
		},
		numberProps: ["gap", "paddingX", "paddingY"],
		requiredProps: ["direction"],
		stringProps: [],
	},
	"Layout.Grid": {
		booleanProps: [],
		enumProps: {
			align: ["start", "center", "end", "stretch"],
			justify: ["start", "center", "end", "stretch"],
		},
		numberProps: ["gap", "paddingX", "paddingY"],
		requiredProps: [],
		stringProps: ["columns", "rows"],
	},
	"Screen.Header": {
		booleanProps: [],
		enumProps: {
			position: ["fixed", "sticky", "static"],
		},
		numberProps: ["height", "zIndex"],
		requiredProps: [],
		stringProps: [],
	},
	"Screen.Contents": {
		booleanProps: ["scroll"],
		enumProps: {},
		numberProps: [],
		requiredProps: [],
		stringProps: [],
	},
	"Screen.Bottom": {
		booleanProps: ["safeArea"],
		enumProps: {
			position: ["fixed", "sticky", "static"],
		},
		numberProps: ["height", "zIndex"],
		requiredProps: [],
		stringProps: [],
	},
} as const satisfies Record<LayoutPropContractType, LayoutPropContract>;

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

export type LayoutMetadata = {
	id: string;
	title?: string;
};

export type LayoutNode = {
	type: string;
	metadata: LayoutMetadata;
	componentVersion?: string;
};

export type LayoutFlexNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.layout)[0];
	props: FlexLayoutProps;
};

export type LayoutGridNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.layout)[1];
	props: GridLayoutProps;
};

export type ScreenHeaderNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRegion)[0];
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: LayoutNode[];
};

export type ScreenContentsNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRegion)[1];
	props?: {
		layout: FlexLayoutProps;
		scroll: boolean;
	};
	children?: LayoutNode[];
};

export type ScreenBottomNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRegion)[2];
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: FlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: LayoutNode[];
};

export type ScreenRegionNode = ScreenHeaderNode | ScreenContentsNode | ScreenBottomNode;

export type ScreenNode = LayoutNode & {
	type: (typeof LAYOUT_NODE_TYPES.screenRoot)[0];
	children: [ScreenHeaderNode, ScreenContentsNode, ScreenBottomNode];
};
