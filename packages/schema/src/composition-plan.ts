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

/**
 * 채택하고 싶은 정답지(reference) 패턴이 있으나 카탈로그에 그 컴포넌트가 없어
 * 평면 어휘로 격하한 지점. 비파괴 추적 신호 — 트리 생성에는 영향을 주지 않고
 * 11-component-proposal이 ux-improvement 제안의 근거(referenceEvidence)로 읽는다.
 */
export type CompositionCatalogGap = {
	desiredPattern: string;
	referenceIds: string[];
	targetSourceRefs: string[];
	reason: string;
};

export type CompositionPlanContract = {
	catalogGaps?: CompositionCatalogGap[];
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
