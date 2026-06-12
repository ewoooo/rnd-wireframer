import type { StateCoverageHint } from "./design-context";
import type { SCHEMA_VERSION } from "./versions";

export type UsedSkillRef = {
	id: string;
	role?: string;
	sourceRef: string;
	stage: "compose" | "revise" | "understand";
	task: string;
};

export type ReferenceMatch = {
	referenceIds: string[];
	matchedPattern: string;
};

export type ScreenIntentContract = {
	audience?: string;
	contentPriority: string[];
	coreJudgment: string;
	ctaPromise: string;
	firstUnderstanding: string;
	missingDecisions?: string[];
	primaryTask?: string;
	rationale?: string;
	referenceMatch?: ReferenceMatch;
	schemaVersion: typeof SCHEMA_VERSION.screenIntent;
	sourceInterpretation: {
		defer: string[];
		preserve: string[];
		summarize: string[];
	};
	stateCoverageHints?: StateCoverageHint[];
	successMoment?: string;
	usedSkills?: UsedSkillRef[];
};
