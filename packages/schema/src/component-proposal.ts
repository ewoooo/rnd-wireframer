import type { SCHEMA_VERSION } from "./versions";

/**
 * 제안의 성격.
 * - source-gap: SourceSpec이 요구한 상호작용/상태인데 카탈로그로 표현 불가해 격하됨.
 * - ux-improvement: 소스가 명시하진 않았으나 채택한 정답지(reference) 패턴이
 *   카탈로그에 없어 더 나은 UX로 못 간 경우. referenceEvidence가 필수다.
 */
export type ComponentProposalKind = "source-gap" | "ux-improvement";

/**
 * 카탈로그에 없지만 화면에 적합한 component/변형 후보.
 * 비파괴 제안이며 확정·반영은 사람의 카탈로그 mutation으로만 이뤄진다.
 */
export type ComponentProposal = {
	id: string;
	kind: ComponentProposalKind;
	proposedComponentType: string;
	rationale: string;
	sourceEvidence: string[];
	/** ux-improvement 제안의 근거 reference id(들). source-gap에서는 비워둔다. */
	referenceEvidence?: string[];
	nearestCatalogMatch: string;
	suggestedProps?: Record<string, unknown>;
};

export type ComponentProposalContract = {
	proposals: ComponentProposal[];
	schemaVersion: typeof SCHEMA_VERSION.componentProposal;
};
