import type { SCHEMA_VERSION } from "./versions";

/**
 * 카탈로그에 없지만 화면에 적합한 component/변형 후보.
 * 비파괴 제안이며 확정·반영은 사람의 카탈로그 mutation으로만 이뤄진다.
 */
export type ComponentProposal = {
	id: string;
	proposedComponentType: string;
	rationale: string;
	sourceEvidence: string[];
	nearestCatalogMatch: string;
	suggestedProps?: Record<string, unknown>;
};

export type ComponentProposalContract = {
	proposals: ComponentProposal[];
	schemaVersion: typeof SCHEMA_VERSION.componentProposal;
};
