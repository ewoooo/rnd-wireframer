import type { SCHEMA_VERSION } from "./versions";

export type DesignSkillId =
	| "account-status-alert"
	| "bottom-sheet-decision"
	| "completion-feedback-screen"
	| "comparison-choice-screen"
	| "data-summary-card-screen"
	| "detail-confirmation-screen"
	| "empty-state-guidance"
	| "form-entry-screen"
	| "generic-composition"
	| "list-selection-screen"
	| "main-task-screen"
	| "multi-step-progress-screen";

export type DesignSkillScreenFamily =
	| "account-status"
	| "bottom-sheet"
	| "comparison-choice"
	| "completion-feedback"
	| "data-summary"
	| "detail-confirmation"
	| "empty-state"
	| "form-entry"
	| "generic"
	| "list-selection"
	| "main-task"
	| "multi-step-progress";

export type DesignSkillQualityGate =
	| "action-clarity"
	| "density-fit"
	| "pattern-fit"
	| "section-rhythm"
	| "source-fidelity"
	| "visual-hierarchy";

export type DesignSkillRef = {
	appliesTo: DesignSkillScreenFamily[];
	id: DesignSkillId;
	qualityGates: DesignSkillQualityGate[];
	reason: string;
	requiredDesignDocs: string[];
	version: string;
};

export type DesignSkillSelectionContract = {
	candidateSkills: DesignSkillRef[];
	fallback: boolean;
	rationale: string;
	schemaVersion: typeof SCHEMA_VERSION.designSkillSelection;
	selectedSkill: DesignSkillRef;
};
