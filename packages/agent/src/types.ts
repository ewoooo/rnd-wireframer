import type { NodeDisplay, NodeHook } from "@cx/types/database-tables";
import type { ScreenSurfaceType } from "@cx/types/node-types";

export type { NodeDisplay, NodeHook, ScreenSurfaceType };

export type NodeLevel = "route" | "variant" | "screen" | "region" | "area" | "component";

export interface OrderedNode {
	id: string;
	name?: string;
	order?: number;
	description?: string;
}

export interface ScreenAreaRefInput {
	areaId: string;
	order?: number;
}

export interface ComposedScreenRegionChildren {
	header?: ScreenAreaRefInput[];
	contents?: ScreenAreaRefInput[];
	bottom?: ScreenAreaRefInput[];
}

export interface ComposedScreenNode extends OrderedNode {
	variantId?: string;
	/** 정규 screen type. Register에서 결정된 값이 그대로 통과. */
	screenType?: ScreenSurfaceType;
	surface?: string;
	children: ComposedScreenRegionChildren;
}

export interface ComposedComponentNode extends OrderedNode {
	type?: string;
	policyID?: string[];
	props?: Record<string, unknown>;
	hooks?: NodeHook[];
	display?: NodeDisplay;
}

export interface RegisteredComponentNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "component";
	name: string;
	type: string;
	description?: string;
	policyID?: string[];
	props: Record<string, unknown>;
}

export interface RegisteredScreenAreaRef {
	areaId: string;
	order: number;
	area?: RegisteredAreaNode;
	/** Register가 결정한 region slot. Compose는 이 값을 그대로 사용. */
	slot?: RegionSlot;
}

/** Screen surface 정규형. Register 단계가 결정. (re-export됨 — 상단 참조) */

export interface RegisteredScreenNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "screen";
	name: string;
	description?: string;
	/** 정규 screen type. Register 책임. */
	screenType: ScreenSurfaceType;
	/** 화면 경로 텍스트 (PRDD frontmatter). 정규 type과 별개. */
	surface?: string;
	/** Region 구조 미사용 시 (legacy 호환) flat area refs */
	areas: RegisteredScreenAreaRef[];
	/** PRDD 영역=0. 컴포넌트가 직접 region 자식. */
	header?: RegisteredHeaderRegion;
	/** PRDD 영역 1~998. Area 노드가 region 자식. */
	contents?: RegisteredContentsRegion;
	/** PRDD 영역≥999. 컴포넌트가 직접 region 자식. */
	bottom?: RegisteredBottomRegion;
}

export interface PatternRef {
	id: string;
	variant: string;
	reasons?: string[];
}

export interface DecoratedScreenNode extends ComposedScreenNode {
	pattern: PatternRef;
	regionPatterns?: Partial<Record<RegionSlot, PatternRef>>;
}

export interface DecoratedComponentNode extends ComposedComponentNode {
	pattern: PatternRef;
}

export interface PatternResolverInput<TNode> {
	level: NodeLevel;
	node: TNode;
}

export type PatternResolver = <TNode>(input: PatternResolverInput<TNode>) => PatternRef | undefined;

// ============================================================================
// Region 1급 시민 + Area (구 Area) 트리 구조
// ----------------------------------------------------------------------------
// PRDD 영역 번호 → Region/Area 분류 contract:
//   영역 === 0     → Region(slot='header'),   children = Component refs
//   영역 1..998    → Region(slot='contents'), children = Area nodes (key=영역)
//   영역 >= 999    → Region(slot='bottom'),   children = Component refs
// ============================================================================

export type RegionSlot = "header" | "contents" | "bottom";

export interface RegisteredAreaChildRef {
	componentId: string;
	order: number;
	component?: RegisteredComponentNode;
}

export interface RegisteredAreaNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "area";
	/** PRDD 영역 no. (PRDD 출처일 때만 채움; legacy 호환 시 undefined). */
	key?: number;
	name: string;
	description?: string;
	layout?: string;
	/** 영역 유형: static / dynamic */
	areaType?: "static" | "dynamic";
	/** 노출 조건 (예: "항상", "조건 시") */
	visibility?: string;
	/** 서버 제어 항목 (자유 텍스트) */
	serverControl?: string;
	minCount?: number;
	maxCount?: number;
	priority?: number;
	/** 오류 처리 방식 */
	errorPolicy?: string;
	/** 자식 컴포넌트들의 [정책:...] 태그 합집합 */
	policyAnchors?: string[];
	children: RegisteredAreaChildRef[];
}

export interface RegisteredRegionNode<TSlot extends RegionSlot, TChild> {
	level: "region";
	slot: TSlot;
	children: TChild[];
}

export type RegisteredHeaderRegion = RegisteredRegionNode<"header", RegisteredAreaChildRef>;
export type RegisteredContentsRegion = RegisteredRegionNode<"contents", RegisteredAreaNode>;
export type RegisteredBottomRegion = RegisteredRegionNode<"bottom", RegisteredAreaChildRef>;

// ---- Composed / Decorated level (PRDD region/area pipeline) ----

export interface ComposedAreaChildRef {
	componentId: string;
	order: number;
}

export interface ComposedAreaNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "area";
	key?: number;
	name: string;
	description?: string;
	layout?: string;
	areaType?: "static" | "dynamic";
	visibility?: string;
	serverControl?: string;
	minCount?: number;
	maxCount?: number;
	priority?: number;
	errorPolicy?: string;
	policyAnchors?: string[];
	children: ComposedAreaChildRef[];
}

export interface ComposedRegionNode<TSlot extends RegionSlot, TChild> {
	level: "region";
	slot: TSlot;
	children: TChild[];
}

export type ComposedHeaderRegion = ComposedRegionNode<"header", ComposedAreaChildRef>;
export type ComposedContentsRegion = ComposedRegionNode<"contents", ComposedAreaNode>;
export type ComposedBottomRegion = ComposedRegionNode<"bottom", ComposedAreaChildRef>;

export interface ComposedPrddScreen {
	screen: ComposedScreenNode;
	header: ComposedHeaderRegion;
	contents: ComposedContentsRegion;
	bottom: ComposedBottomRegion;
	components: ComposedComponentNode[];
	areas: ComposedAreaNode[];
	warnings: string[];
}

export interface DecoratedAreaNode extends ComposedAreaNode {
	pattern: PatternRef;
}

export interface DecoratedRegionNode<TSlot extends RegionSlot, TChild> {
	level: "region";
	slot: TSlot;
	pattern: PatternRef;
	children: TChild[];
}

export type DecoratedHeaderRegion = DecoratedRegionNode<"header", ComposedAreaChildRef>;
export type DecoratedContentsRegion = DecoratedRegionNode<"contents", DecoratedAreaNode>;
export type DecoratedBottomRegion = DecoratedRegionNode<"bottom", ComposedAreaChildRef>;

export interface DecoratedPrddScreen {
	screen: DecoratedScreenNode;
	header: DecoratedHeaderRegion;
	contents: DecoratedContentsRegion;
	bottom: DecoratedBottomRegion;
	components: DecoratedComponentNode[];
	areas: DecoratedAreaNode[];
	warnings: string[];
}
