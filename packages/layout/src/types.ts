import { RENDER_TREE_NODE_TYPE_GROUPS } from "@cx/schema";
import type { LayoutPatternPropContract } from "./catalog-types";

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
 * primitive/chrome 레이아웃 노드 타입이 받는 prop의 계약이다. 노드 type 어휘의 정본은
 * 위 타입들이 소유하므로 그 계약도 같은 곳에 둔다. 모양은 catalog entry의 props 계약
 * (LayoutPatternPropContract)과 동일 — external/패턴/노드타입이 단일 prop-contract 모양을
 * 공유하고, @cx/validation이 resolver를 통해 이 테이블을 소비해 검증한다.
 */
export type LayoutNodePropContractType =
	| (typeof LAYOUT_NODE_TYPES.layout)[number]
	| (typeof LAYOUT_NODE_TYPES.screenRegion)[number];

export const LAYOUT_NODE_TYPE_PROP_CONTRACTS: Record<
	LayoutNodePropContractType,
	Record<string, LayoutPatternPropContract>
> = {
	"Layout.Flex": {
		direction: { type: "enum", values: ["row", "column"], required: true },
		align: { type: "enum", values: ["start", "center", "end", "stretch"] },
		justify: { type: "enum", values: ["start", "center", "end", "between"] },
		gap: { type: "number" },
		paddingX: { type: "number" },
		paddingY: { type: "number" },
	},
	"Layout.Grid": {
		columns: { type: "string" },
		rows: { type: "string" },
		align: { type: "enum", values: ["start", "center", "end", "stretch"] },
		justify: { type: "enum", values: ["start", "center", "end", "stretch"] },
		gap: { type: "number" },
		paddingX: { type: "number" },
		paddingY: { type: "number" },
	},
	"Screen.Header": {
		position: { type: "enum", values: ["fixed", "sticky", "static"] },
		height: { type: "number" },
		zIndex: { type: "number" },
	},
	"Screen.Contents": {
		scroll: { type: "boolean" },
	},
	"Screen.Bottom": {
		safeArea: { type: "boolean" },
		position: { type: "enum", values: ["fixed", "sticky", "static"] },
		height: { type: "number" },
		zIndex: { type: "number" },
	},
};

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
