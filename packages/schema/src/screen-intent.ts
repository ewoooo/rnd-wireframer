import type { StateCoverageHint } from "./design-context";
import type { SCHEMA_VERSION } from "./versions";

export type ScreenIntentContract = {
	audience?: string;
	contentPriority: string[];
	missingDecisions?: string[];
	primaryUserAction?: string;
	primaryTask?: string;
	rationale?: string;
	schemaVersion: typeof SCHEMA_VERSION.screenIntent;
	screenPurpose: string;
	sourceInterpretation: {
		defer: string[];
		preserve: string[];
		summarize: string[];
	};
	stateCoverageHints?: StateCoverageHint[];
	successMoment?: string;
};
