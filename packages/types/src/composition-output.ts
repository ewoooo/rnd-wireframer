/**
 * Schema B — Composition Decision Output.
 * LLM #1 Compose의 주 산출물.
 * Schema A의 source를 참조해 어떤 UI 블록을 어디에 놓을지 결정한다.
 * Schema A의 원문 필드를 덮어쓰지 않는다.
 * 자세한 계약은 database/AI-COMPOSITION-SPEC.md §3 참조.
 *
 * 주의: 이 파일에서는 ComponentPattern (Schema C) / GapReport (Schema D) 를
 * type-only로 가져와 순환을 피한다.
 */
import type { ComponentPattern } from "./component-pattern";
import type { GapReport } from "./gap-report";
import type { EventHook, PrddAreaSlot, PrddBinding } from "./prdd-screen-record";

export type CompositionMode =
	| "reuse-primitive"
	| "reuse-pattern"
	| "propose-pattern"
	| "report-gap";

export type ScreenStrategy =
	| "task-flow"
	| "comparison"
	| "decision-summary"
	| "error-recovery"
	| "form-entry"
	| "detail-reading"
	| "confirmation"
	| "support";

export type ScreenArchetype =
	| "commerce-detail"
	| "form-entry"
	| "agreement-flow"
	| "confirmation"
	| "list-browse"
	| "support"
	| "generic-detail";

export type ArchetypeBlockId =
	| "navigation"
	| "hero-summary"
	| "hero-media"
	| "primary-facts"
	| "price-summary"
	| "price-accordion"
	| "benefit-list"
	| "option-selection"
	| "option-list"
	| "option-grid"
	| "delivery-info"
	| "rich-image-tab"
	| "product-more-link"
	| "coupon-benefit"
	| "map-store-list"
	| "brand-benefit-list"
	| "product-disclosure"
	| "bottom-cta"
	| "supporting-info"
	| "disclosure"
	| "disclosure-list"
	| "primary-action"
	| "sticky-cta"
	| "terms-list"
	| "agreement-control"
	| "form-fields"
	| "validation-feedback"
	| "result-state"
	| "next-action"
	| "list-results"
	| "card-list"
	| "product-list"
	| "product-list-group"
	| "product-list-horizontal"
	| "product-list-row"
	| "filter-sort"
	| "summary-card"
	| "filter-chip"
	| "text-list"
	| "info-text-list"
	| "notice-list"
	| "accordion-list"
	| "search-filter"
	| "tab-filter"
	| "support-action"
	| "section-header"
	| "divider"
	| "footer-legal";

export type AreaRole =
	| "navigation"
	| "hero"
	| "summary"
	| "form"
	| "list"
	| "guide"
	| "error"
	| "empty"
	| "confirmation"
	| "action"
	| "supporting";

export type AreaVisualIntent =
	| "primary"
	| "secondary"
	| "supporting"
	| "warning"
	| "confirmation"
	| "cta-support";

export type CompositionAction =
	| "preserve-source-area"
	| "merge-source-areas"
	| "split-source-area"
	| "synthesize-supporting-area";

export type DecisionEmphasis = "high" | "medium" | "low";

export type DraftConfidence = "high" | "medium" | "low";

export type DesignDocumentId =
	| "COMPOSITION_LAYERS.md"
	| "DESIGN_FOUNDATION.md"
	| "LAYOUT_SPACING_CONTRACT.md"
	| "SECTION_PATTERNS.md"
	| "SCREEN_PATTERN_SUMMARY.md"
	| "COMPONENT_INVENTORY.md"
	| "INTERACTION_PATTERNS.md"
	| "VISUAL_FOUNDATION_OBSERVATIONS.md";

export interface DesignReference {
	document: DesignDocumentId;
	section?: string;
	reason: string;
}

export interface LayoutPatternDraft {
	layoutPatternId: string;
	variant?: string;
	reasons: string[];
	confidence: DraftConfidence;
}

export interface CompositionSourceRef {
	screenId: string;
	areaId?: string;
	areaNo?: number;
	componentRow?: number;
	componentEntryId?: string;
	semanticName?: string;
	rawComponentId?: string;
	reason: string;
}

export type CompositionSelection =
	| {
			mode: "reuse-primitive";
			primitiveId: string;
			variant?: string;
	  }
	| {
			mode: "reuse-pattern";
			componentPatternId: string;
			variant?: string;
	  }
	| {
			mode: "propose-pattern";
			/** proposedComponentPatterns[].id 와 매칭 */
			proposedComponentPatternId: string;
			variant?: string;
	  }
	| {
			mode: "report-gap";
			/** gapReports[].id 와 매칭 */
			gapReportId: string;
	  };

export interface CompositionDecision {
	/** stable id, 예: cmp-NOVA-...-a1-2 */
	id: string;
	mode: CompositionMode;

	/** 추적성: 모든 decision은 Schema A의 원천 위치를 반드시 가리킨다. */
	sourceRef: {
		screenId: string;
		areaId: string;
		componentRow?: number;
		componentEntryId?: string;
		semanticName?: string;
		rawComponentId?: string;
	};
	sourceRefs: CompositionSourceRef[];

	target: {
		areaId: string;
		order: number;
		/** componentPattern slot에 끼워 넣는 경우 */
		slot?: string;
	};

	/** 이 decision이 표현하려는 UI 의미 */
	intent: string;
	/** PRDD 근거. 최소 1개 구체 근거 포함. */
	rationale: string;
	emphasis: DecisionEmphasis;
	policyRefs: string[];
	stateRefs: string[];

	selection: CompositionSelection;
	/** primitive/componentPattern public contract에 맞춘 props */
	props: Record<string, unknown>;
	bindings: PrddBinding[];
	hooks: EventHook[];

	display?: {
		/** Schema A visibility/state 문구 참조. 자유 표현 저장만. */
		visibleWhen?: string;
		emptyWhen?: string;
		errorWhen?: string;
	};

	/** componentPattern 내부 배치가 필요한 경우 작성. */
	layoutPatternDraft?: LayoutPatternDraft;
	/** decision-level designRefs는 조건부 필수 (SPEC §7.1 참조). */
	designRefs?: DesignReference[];
}

export interface CompositionArea {
	/** Schema A RegisteredArea.area.id */
	areaId: string;
	/** 대표 PRDD 영역 번호 또는 areaId */
	sourceAreaRef: string;
	sourceRefs: CompositionSourceRef[];
	compositionAction: CompositionAction;
	slot: PrddAreaSlot;
	role: AreaRole;
	intent: string;
	visualIntent: AreaVisualIntent;
	order: number;
	decisionIds: string[];
	synthetic?: {
		reason: string;
		basedOnSourceRefs: CompositionSourceRef[];
	};

	/** Compose가 만드는 1차 layoutPattern. Decorate는 검증·보정만 한다. */
	layoutPatternDraft: LayoutPatternDraft;
	designRefs: DesignReference[];
}

export interface CompositionScreen {
	screenId: string;
	/** PRDD 전체를 읽은 화면 목적 */
	intent: string;
	/** 사용자가 이 화면에서 달성해야 하는 일 */
	primaryUserGoal: string;
	strategy: ScreenStrategy;
	/** deterministic scaffold resolver가 고른 화면 원형 */
	archetype: ScreenArchetype;
	/** archetype scaffold 대비 Compose가 채운/합성/누락 처리한 block 현황 */
	completeness: {
		requiredBlocks: ArchetypeBlockId[];
		presentBlocks: ArchetypeBlockId[];
		syntheticBlocks: ArchetypeBlockId[];
		missingBlocks: ArchetypeBlockId[];
		omittedBlocks: Array<{
			blockId: ArchetypeBlockId;
			reason: string;
		}>;
	};
	/** Schema A states[].state 참조 */
	stateRefs: string[];
	/** Schema A flow row에서 파생한 stable id */
	flowRefs: string[];
	policyRefs: string[];
	designRefs: DesignReference[];
	layoutPatternDraft: LayoutPatternDraft;
}

export interface CompositionWarning {
	sourceRef?: CompositionDecision["sourceRef"];
	message: string;
}

export interface CompositionOutput {
	kind: "composition-output";
	schemaVersion: string;
	source: {
		screenId: string;
		registeredSchemaVersion: string;
		catalogDeckVersion: string;
		designDeckVersion: string;
		layoutPatternStoreDeckVersion: string;
	};

	screen: CompositionScreen;
	areas: CompositionArea[];
	decisions: CompositionDecision[];

	/** Schema C. mode === "propose-pattern"에서 참조. */
	proposedComponentPatterns: ComponentPattern[];
	/** Schema D. mode === "report-gap"에서 참조. */
	gapReports: GapReport[];
	warnings: CompositionWarning[];
}
