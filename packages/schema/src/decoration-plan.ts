import type { SCHEMA_VERSION } from "./versions";

export type DecorationAreaRole =
	| "agreement-controls"
	| "bottom-action"
	| "content-list"
	| "form"
	| "message"
	| "navigation";

export type DecorationAreaPatternRole =
	| "app-bar"
	| "bottom-action"
	| "checkbox-stack"
	| "field-stack"
	| "list-stack"
	| "message-stack";

export type DecorationDisplayRules = {
	hideInternalSourceNames: boolean;
};

export type DecorationLayoutIntent = {
	areaPatternRole: DecorationAreaPatternRole;
};

export type DecorationRepeatedItem = {
	propsHint?: Record<string, unknown>;
	required?: boolean;
	sourceComponentRef: string;
	label: string;
};

export type DecorationArea = {
	componentRefs: string[];
	displayTitle: string;
	id: string;
	layoutIntent?: DecorationLayoutIntent;
	repeatedItems?: DecorationRepeatedItem[];
	role: DecorationAreaRole;
	sourceAreaId: string;
	splitFrom?: string;
	targetRegion: "bottom" | "contents" | "header" | "overlay";
};

export type DecorationDiagnostic = {
	code: string;
	message: string;
	severity: "error" | "warning";
	sourceRef?: string;
};

export type DecorationPlanContract = {
	areas: DecorationArea[];
	diagnostics?: DecorationDiagnostic[];
	displayRules: DecorationDisplayRules;
	schemaVersion: typeof SCHEMA_VERSION.decorationPlan;
	screenId: string;
	sourceScreenRef: string;
};
