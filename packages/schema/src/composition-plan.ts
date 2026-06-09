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

export type CompositionPlanContract = {
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
