/**
 * A deterministic pattern-layer candidate produced from SourceSpec before agent selection.
 * Candidate ids form the allowed layout vocabulary downstream agents may choose from.
 */
export type PatternLayerCandidate = {
	constraints?: string[];
	id: string;
	level: "area" | "component" | "region" | "screen";
	layout: string;
	reason: string;
	targetRef: string;
	title: string;
};
