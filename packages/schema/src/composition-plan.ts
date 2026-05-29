import type { SCHEMA_VERSION } from "./versions";

export type CompositionPlanSection = {
	priority: number;
	role: "bottom-action" | "content" | "feedback" | "form" | "header" | "summary";
	sourceRefs: string[];
	strategy: string;
	targetRegion: "bottom" | "contents" | "header" | "overlay";
};

export type CompositionPlanContract = {
	layoutStrategy: string;
	rationale?: string;
	schemaVersion: typeof SCHEMA_VERSION.compositionPlan;
	screenLayout: string;
	sections: CompositionPlanSection[];
};
