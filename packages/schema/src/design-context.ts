export type DesignContextBundleId =
	| "interaction-state"
	| "layout-composition"
	| "quality-review"
	| "visual-foundation";

export type DesignContextBundleRef = {
	id: DesignContextBundleId;
	reason: string;
	sourceDocs: string[];
	version: string;
};

export type StateCoverageHint = {
	reason: string;
	surface: "async" | "detail" | "form" | "list" | "search";
	states: Array<"disabled" | "empty" | "error" | "loading" | "populated" | "validation">;
};
