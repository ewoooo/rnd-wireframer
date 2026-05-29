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

export type DesignContextBundleContent = DesignContextBundleRef & {
	/** 선택된 번들 문서를 결합한 에이전트용 규칙 본문. */
	body: string;
};

export type StateCoverageHint = {
	reason: string;
	surface: "async" | "detail" | "form" | "list" | "search";
	states: Array<"disabled" | "empty" | "error" | "loading" | "populated" | "validation">;
};
