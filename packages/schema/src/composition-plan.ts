import type { SCHEMA_VERSION } from "./versions";

export type CompositionPlanSection = {
	priority: number;
	role: "bottom-action" | "content" | "feedback" | "form" | "header" | "summary";
	sourceRefs: string[];
	strategy: string;
	targetRegion: "bottom" | "contents" | "header";
};

export type CompositionPlanDensity = "high" | "low" | "medium";

export type CompositionPlanRejectedPattern = {
	pattern: string;
	reason: string;
};

export type CompositionCurrentFit = {
	problems: string[];
	supportsJudgment: boolean;
};

export type CompositionProposal = {
	recommendedAreas: string[];
	shouldChangeAreaComposite: boolean;
};

export type CompositionTransformedSourceRef = {
	reason: string;
	sourceRef: string;
	transformation: "bound-prop" | "grouped" | "split" | "summarized";
};

/**
 * 어떤 디자인 SOT를 근거로 구조를 결정했는지의 기계적 추적.
 * usedReferenceIds는 downstream step의 selective reference mount 키로 쓰인다 —
 * 채택한 screen/area reference id의 합집합이어야 한다(recommendedAreas 포함).
 */
export type CompositionDesignTrace = {
	transformedSourceRefs?: CompositionTransformedSourceRef[];
	usedReferenceIds: string[];
	usedSkillIds: string[];
};

export type CompositionPlanContract = {
	compositionProposal: CompositionProposal;
	currentFitAssessment: CompositionCurrentFit;
	designTrace: CompositionDesignTrace;
	density: CompositionPlanDensity;
	layoutStrategy: string;
	patternRationale: string;
	primaryUserAction: string;
	rationale?: string;
	rejectedPatterns: CompositionPlanRejectedPattern[];
	schemaVersion: typeof SCHEMA_VERSION.compositionPlan;
	screenLayout: string;
	sectionRhythm: string;
	sections: CompositionPlanSection[];
	visualHierarchy: string;
};
