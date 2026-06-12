import type { SCHEMA_VERSION } from "./versions";

export const RENDER_TREE_NODE_TYPE = {
	areaDynamic: "area.dynamic",
	areaStatic: "area.static",
	layoutFlex: "Layout.Flex",
	layoutGrid: "Layout.Grid",
	pageStack: "PageStack",
	screen: "Screen",
	screenBottom: "Screen.Bottom",
	screenContents: "Screen.Contents",
	screenHeader: "Screen.Header",
} as const;

export const RENDER_TREE_SCREEN_ROOT_NODE_TYPES = [RENDER_TREE_NODE_TYPE.screen] as const;

export const RENDER_TREE_SCREEN_REGION_NODE_TYPES = [
	RENDER_TREE_NODE_TYPE.screenHeader,
	RENDER_TREE_NODE_TYPE.screenContents,
	RENDER_TREE_NODE_TYPE.screenBottom,
] as const;

export const RENDER_TREE_LAYOUT_NODE_TYPES = [
	RENDER_TREE_NODE_TYPE.layoutFlex,
	RENDER_TREE_NODE_TYPE.layoutGrid,
] as const;

export const RENDER_TREE_WRAPPER_NODE_TYPES = [RENDER_TREE_NODE_TYPE.pageStack] as const;

export const RENDER_TREE_AREA_NODE_TYPES = [
	RENDER_TREE_NODE_TYPE.areaStatic,
	RENDER_TREE_NODE_TYPE.areaDynamic,
] as const;

/**
 * 노드 type을 구조 역할(screenRoot/screenRegion/layout/wrapper/area)별로 묶은 그룹이다.
 * renderer/layout이 각자 평행하게 정의하던 노드 type 어휘를 이 한 곳에서만 파생하도록 한다.
 */
export const RENDER_TREE_NODE_TYPE_GROUPS = {
	area: RENDER_TREE_AREA_NODE_TYPES,
	layout: RENDER_TREE_LAYOUT_NODE_TYPES,
	screenRegion: RENDER_TREE_SCREEN_REGION_NODE_TYPES,
	screenRoot: RENDER_TREE_SCREEN_ROOT_NODE_TYPES,
	wrapper: RENDER_TREE_WRAPPER_NODE_TYPES,
} as const;

export type RenderTreeAreaNodeType = (typeof RENDER_TREE_AREA_NODE_TYPES)[number];
export type RenderTreeScreenRegionNodeType = (typeof RENDER_TREE_SCREEN_REGION_NODE_TYPES)[number];

export const SCREEN_REGION_TYPE_BY_NODE_TYPE = {
	[RENDER_TREE_NODE_TYPE.screenBottom]: "bottom",
	[RENDER_TREE_NODE_TYPE.screenContents]: "contents",
	[RENDER_TREE_NODE_TYPE.screenHeader]: "header",
} as const satisfies Record<RenderTreeScreenRegionNodeType, "bottom" | "contents" | "header">;

export type ScreenRegionKey =
	(typeof SCREEN_REGION_TYPE_BY_NODE_TYPE)[RenderTreeScreenRegionNodeType];

export const SCREEN_REGION_NODE_TYPE_BY_REGION_KEY = {
	bottom: RENDER_TREE_NODE_TYPE.screenBottom,
	contents: RENDER_TREE_NODE_TYPE.screenContents,
	header: RENDER_TREE_NODE_TYPE.screenHeader,
} as const satisfies Record<ScreenRegionKey, RenderTreeScreenRegionNodeType>;

type StateRoleBehavior =
	| { kind: "visibility" }
	| { kind: "state"; prop: string; source: "when" | "notWhen" };

/**
 * display.stateRole의 런타임 의미를 정의하는 단일 진실원.
 * - visibility: when이 거짓이면 노드 자체를 렌더 트리에서 제거한다.
 * - state: 노드는 항상 유지하고, when 평가 결과를 상태 prop으로 주입한다.
 *   source="notWhen"이면 prop = !when (정상/충족 조건 미달 시 상태 on: disabled/loading/error),
 *   source="when"이면 prop = when (조건 충족 시 상태 on: success/expanded).
 * resolveRenderNode가 이 테이블만 참조한다(문자열 키 switch 금지).
 */
export const RENDER_TREE_STATE_ROLE_BEHAVIOR = {
	base: { kind: "visibility" },
	empty: { kind: "visibility" },
	loading: { kind: "state", prop: "loading", source: "notWhen" },
	error: { kind: "state", prop: "error", source: "notWhen" },
	disabled: { kind: "state", prop: "disabled", source: "notWhen" },
	success: { kind: "state", prop: "success", source: "when" },
	expanded: { kind: "state", prop: "expanded", source: "when" },
} as const satisfies Record<string, StateRoleBehavior>;

export type RenderTreeStateRole = keyof typeof RENDER_TREE_STATE_ROLE_BEHAVIOR;

export type SchemaPropBinding = {
	bind: string;
	default?: string | number | boolean | null;
};

export type SchemaPropValue =
	| string
	| number
	| boolean
	| null
	| SchemaPropValue[]
	| { [key: string]: SchemaPropValue }
	| SchemaPropBinding;

export type RenderTreeMetadata = {
	id: string;
	author?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type RenderTreeNodeMetadata = RenderTreeMetadata & {
	title: string;
};

export type RenderTreeNodeContract = {
	children?: RenderTreeNodeContract[];
	componentVersion: string;
	display?: {
		stateRole?: RenderTreeStateRole;
		when?: SchemaPropBinding | boolean;
	};
	layout?: string;
	metadata: RenderTreeNodeMetadata;
	props?: Record<string, SchemaPropValue>;
	type: string;
};

export type RenderTreeFlexLayoutProps = {
	direction: "row" | "column";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type RenderTreeGridLayoutProps = {
	columns?: string;
	rows?: string;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "stretch";
};

export type RenderTreeScreenHeaderNodeContract = Omit<
	RenderTreeNodeContract,
	"children" | "props" | "type"
> & {
	type: "Screen.Header";
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: RenderTreeFlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: RenderTreeNodeContract[];
};

export type RenderTreeScreenContentsNodeContract = Omit<
	RenderTreeNodeContract,
	"children" | "props" | "type"
> & {
	type: "Screen.Contents";
	props?: {
		layout: RenderTreeFlexLayoutProps;
		scroll: boolean;
	};
	children: RenderTreeNodeContract[];
};

export type RenderTreeScreenBottomNodeContract = Omit<
	RenderTreeNodeContract,
	"children" | "props" | "type"
> & {
	type: "Screen.Bottom";
	props?: {
		position: "fixed" | "sticky" | "static";
		layout: RenderTreeFlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: RenderTreeNodeContract[];
};

export type RenderTreeScreenNodeContract = Omit<RenderTreeNodeContract, "children" | "type"> & {
	type: "Screen";
	children: [
		RenderTreeScreenHeaderNodeContract,
		RenderTreeScreenContentsNodeContract,
		RenderTreeScreenBottomNodeContract,
	];
};

export type RenderTreeLayoutFlexNodeContract = Omit<RenderTreeNodeContract, "props" | "type"> & {
	type: "Layout.Flex";
	props: RenderTreeFlexLayoutProps;
};

export type RenderTreeLayoutGridNodeContract = Omit<RenderTreeNodeContract, "props" | "type"> & {
	type: "Layout.Grid";
	props: RenderTreeGridLayoutProps;
};

export type RenderTreeContract = {
	children: RenderTreeNodeContract[];
	data?: Record<string, unknown>;
	metadata: RenderTreeMetadata;
	minRendererVersion?: string;
	theme?: {
		fontFamily?: string;
		mode?: "dark" | "light" | "system";
		primaryColor?: string;
	};
	version: typeof SCHEMA_VERSION.renderTree;
};

export function isRenderTreeAreaNodeType(type: string): type is RenderTreeAreaNodeType {
	return (RENDER_TREE_AREA_NODE_TYPES as readonly string[]).includes(type);
}

export function isRenderTreeScreenRegionNodeType(
	type: string,
): type is RenderTreeScreenRegionNodeType {
	return (RENDER_TREE_SCREEN_REGION_NODE_TYPES as readonly string[]).includes(type);
}

export function isRenderTreeAreaNode(node: RenderTreeNodeContract): boolean {
	return isRenderTreeAreaNodeType(node.type);
}

export function isRenderTreeScreenRegionNode(
	node: RenderTreeNodeContract,
): node is
	| RenderTreeScreenBottomNodeContract
	| RenderTreeScreenContentsNodeContract
	| RenderTreeScreenHeaderNodeContract {
	return isRenderTreeScreenRegionNodeType(node.type);
}
