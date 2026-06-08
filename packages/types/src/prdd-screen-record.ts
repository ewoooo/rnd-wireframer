import type { ScreenSurfaceType } from "./node-types";

/**
 * Schema A — PRDD Screen Record.
 *
 * Register 단계가 PRDD .md를 결정론적으로 파싱해 만든 **AI Compose 입력 사이드카**.
 * runtime `RegisteredScreenNode`(packages/agent/src/types.ts) 와 책임이 다르다:
 *
 * - runtime `RegisteredScreenNode` — route/variant/screen tree의 노드. Composer/Decorator/Materializer가 소비.
 * - **PrddScreenRecord** — PRDD prose 1급 보존본. LLM #1 Compose가 의미 해석용으로 읽음.
 *
 * Register가 한 PRDD에서 **두 표상을 함께** 생성한다. 둘은 다음 invariant를 공유한다:
 * - 같은 `screenId`
 * - 같은 `importJobId` (한 import 호출에서 동시 생성됨을 보증)
 * - `areas.length`, `area.children.length` 가 1:1로 추적 가능
 *
 * 자세한 계약은 database/AI-COMPOSITION-SPEC.md §2 참조.
 */

export type PrddBindingOrigin = "api" | "policy" | "static" | "state";

export interface PrddBinding {
	origin: PrddBindingOrigin;
	/** "FN-PRDD-DTL-001" / "PI-..." / "-" 등 원문 */
	ref: string;
	/** PRDD 바인딩(소스) 컬럼 원문 */
	description: string;
}

export interface EventHook {
	/** onClick, onChange 등 */
	trigger: string;
	/** navigate, setState, apiCall 등 */
	action: string;
	target?: string;
	params?: Record<string, unknown>;
}

export interface PrddScreenState {
	/** "default" | "loading" | "error" | 그 외 PRDD 정의 */
	state: string;
	/** PRDD "트리거" 컬럼 자연어 그대로 */
	trigger: string;
	/** [영역 N] 어떤 변화 */
	changes: PrddAreaChange[];
	/** 후속 액션 (예: apiCall) */
	action?: string;
}

export interface PrddAreaChange {
	/** "영역 1" 또는 areaId */
	areaRef: string;
	/** 변화 산문 */
	description: string;
}

export interface PrddScreenFlow {
	kind: "transition" | "case-branch";
	targetScreenId: string;
	targetScreenName: string;
	/** PRDD "조건" 컬럼 자연어 그대로 */
	condition: string;
	/** "전달 데이터" 컬럼 원문 */
	payload?: string;
	/** "후속 처리" 컬럼 원문 */
	postProcess?: string;
}

export type PrddAreaSlot = "header" | "contents" | "bottom";

export type PrddVisibilityHintKind = "always" | "state" | "api" | "policy";

export interface PrddVisibilityHint {
	kind: PrddVisibilityHintKind;
	ref?: string;
}

export interface PrddArea {
	areaId: string;
	order: number;
	slot: PrddAreaSlot;
	area: {
		level: "area";
		id: string;
		name: string;
		description: string;
		/** PRDD "영역 레이아웃" 컬럼 원문 (예: "vertical") */
		layout: string;

		/** PRDD "노출 조건" 컬럼 원문. 보존 1급. */
		visibilityRuleRaw: string;
		/** deterministic parser가 명확히 판정 가능한 경우만 채움. raw를 대체하지 않음. */
		visibilityRuleHint?: PrddVisibilityHint;

		serverControls: string[];
		countMin?: number;
		countMax?: number;
		priority?: number;
		errorHandling?: string;
		/** 정책 인용 산문 (비고 컬럼). 한 줄에 한 인용. */
		notes: string[];

		children: PrddComponentEntry[];
	};
}

export interface PrddComponentEntry {
	/** catalog 매칭 결과. null이면 미해석. */
	primitiveId: string | null;

	/** 예: "CardSummaryProductSummary" */
	semanticName: string;
	/** 예: "CardSummary" (PRDD 컴포넌트 ID 컬럼 원문) */
	rawComponentId: string;
	/** PRDD variant 컬럼 원문. 없으면 null. */
	variantHint: string | null;
	/** "title: {상품명}<br>subText: ..." 그대로 */
	displayTextTemplate: string;
	bindings: PrddBinding[];
	events: EventHook[];
	/** 비고 산문 (정책 근거 포함) */
	notes: string[];
	/** notes에서 추출한 정책 ID들 */
	policyIds: string[];
	order: number;
}

export interface PrddScreenRecord {
	level: "screen";
	id: string;
	name: string;
	order: number;
	screenType: ScreenSurfaceType;
	description: string;

	/**
	 * Register가 부여하는 import 호출 ID.
	 * 동일 PRDD import 호출에서 함께 생성된 runtime `RegisteredScreenNode` 와 매칭하는 cross-table invariant key.
	 */
	importJobId: string;

	states: PrddScreenState[];
	flow: PrddScreenFlow[];
	policyGroups: string[];
	useCases: string[];
	features: string[];

	areas: PrddArea[];
}
