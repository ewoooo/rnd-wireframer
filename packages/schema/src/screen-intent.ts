import type { SCHEMA_VERSION } from "./versions";

export type ScreenIntentContract = {
	contentPriority: string[];
	primaryUserAction?: string;
	rationale?: string;
	schemaVersion: typeof SCHEMA_VERSION.screenIntent;
	screenPurpose: string;
	sourceInterpretation: {
		defer: string[];
		preserve: string[];
		summarize: string[];
	};
};
