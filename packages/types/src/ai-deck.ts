import type {
	ComponentPattern,
	ComponentPatternProp,
	ComponentPatternSlot,
	ComponentPatternStatus,
	ComponentPatternVariant,
} from "./component-pattern";
import type { ComponentPropContract } from "./component-catalog";
import type { DesignDocumentId } from "./composition-output";
import type { TokenRole, TokenSlot } from "./tokens";

/**
 * Build-time deck types.
 *
 * LLM Composer가 호출 시점에 받는 catalog/design/layoutPatternStore 카드덱.
 * SPEC §6 참조. 빌드 스크립트가 이 모양으로 생성하고, Validator가 lookup용으로 소비한다.
 */

export interface CatalogDeck {
	builtAt: string;
	version: string;
	primitives: PrimitiveCard[];
	componentPatterns: {
		registered: ComponentPatternCard[];
		proposed: ComponentPatternCard[];
	};
}

export interface PrimitiveCard {
	id: string;
	name: string;
	description: string;
	props: Array<{ name: string; contract: ComponentPropContract }>;
	variants: string[];
	tokensExpected: TokenRole[];
	tokenSlots?: Partial<Record<TokenSlot, TokenRole>>;
	exampleUsage: string;
}

export interface ComponentPatternCard {
	id: string;
	name: string;
	status: ComponentPatternStatus;
	intent: string;
	rationale: string;
	props: ComponentPatternProp[];
	slots: ComponentPatternSlot[];
	variants: ComponentPatternVariant[];
	/** propose 시 중복 방지를 위해 카드에 포함 (composition 자체는 비공개) */
	compositionDigest: string;
}

export interface DesignDeck {
	builtAt: string;
	version: string;
	documents: DesignDocumentCard[];
}

export type DesignDocumentAppliesTo =
	| "screen"
	| "area"
	| "componentPattern"
	| "interaction"
	| "layoutPattern";

export interface DesignDocumentCard {
	id: DesignDocumentId;
	title: string;
	responsibility: string;
	rules: Array<{
		id: string;
		section?: string;
		summary: string;
		appliesTo: DesignDocumentAppliesTo[];
	}>;
}

export type LayoutPatternNodeKind = "screen" | "area" | "group" | "region" | "composite";

export interface LayoutPatternStoreDeck {
	builtAt: string;
	version: string;
	patterns: LayoutPatternCard[];
}

export interface LayoutPatternCard {
	id: string;
	name: string;
	description: string;
	variants: string[];
	/** 이 layoutPattern이 적용 가능한 노드 종류 */
	appliesTo: LayoutPatternNodeKind[];
}

/** Optional shared full ComponentPattern lookup for Validator deeper checks. */
export type ComponentPatternRegistry = Map<string, ComponentPattern>;
