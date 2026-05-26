import type { ComponentPropContract } from "./component-catalog";
import type { TokenRole } from "./tokens";

/**
 * Schema C — ComponentPattern Object.
 * primitives(+다른 registered componentPatterns)의 parametrized composition.
 * proposed와 registered가 동일한 모양을 공유하며 status 필드만 다르다.
 * 자세한 계약은 database/AI-COMPOSITION-SPEC.md §4 참조.
 */

export type ComponentPatternStatus = "registered" | "proposed";

export type ComponentPatternSlotAccepts = "primitive" | "componentPattern" | "any";

export type ComponentPatternSlotCardinality = "one" | "many";

export interface ComponentPatternProp {
	name: string;
	contract: ComponentPropContract;
	required: boolean;
	description: string;
}

export interface ComponentPatternSlot {
	/** "actions", "media" 등 */
	name: string;
	accepts: ComponentPatternSlotAccepts;
	cardinality: ComponentPatternSlotCardinality;
	description: string;
}

export interface ComponentPatternVariant {
	name: string;
	/** 기존 variantTokens 계약 준수 */
	variantTokens: Record<string, string>;
	description: string;
}

export type ComponentPatternNodeKind = "primitive" | "componentPattern" | "slot";

export interface ComponentPatternNode {
	kind: ComponentPatternNodeKind;
	/** primitiveId 또는 componentPatternId. kind === "slot"이면 미사용. */
	ref?: string;
	/** kind === "slot"일 때 필요. */
	slotName?: string;
	/** 정적/바인딩 */
	props?: Record<string, unknown>;
	children?: ComponentPatternNode[];
}

export interface TokenUsage {
	/** 예: "root.background" */
	path: string;
	role: TokenRole;
	/** 예: "color.surface.primary" */
	tokenRef: string;
}

export interface ComponentPatternProposedBy {
	by: "llm";
	model: string;
	/** 처음 제안된 화면 */
	screen: string;
	/** ISO timestamp */
	timestamp: string;
}

export interface ComponentPattern {
	/** kebab-case, 예: "card-product-summary" */
	id: string;
	/** 사람 읽는 이름 */
	name: string;
	status: ComponentPatternStatus;
	/** semver */
	version: string;

	/** 한 줄: "상품 핵심 요약을 카드로 표시" */
	intent: string;
	/** PRDD 인용 포함 자세한 설명 */
	rationale: string;

	props: ComponentPatternProp[];
	slots: ComponentPatternSlot[];
	variants: ComponentPatternVariant[];

	/** root node (DAG) */
	composition: ComponentPatternNode;

	tokensUsed: TokenUsage[];

	/** AI 저작 메타 */
	proposedBy?: ComponentPatternProposedBy;
	/** proposed → registered 승격 시 원본 id */
	promotedFrom?: string;
	/** 사용 통계 (승격 후보 판단) */
	usedInScreens?: string[];
}
