import {
	findPattern,
	listPatternSummaries,
	listPatterns,
	loadPatternStore,
} from "../internal/store";
import type { ChildrenLayoutPreset, PatternStoreTarget } from "./types";

export type { PatternSummary } from "../internal/store";
export { findPattern, listPatternSummaries, listPatterns, loadPatternStore };

export function getPatternPreset<TTarget extends PatternStoreTarget>(
	patternId: string | undefined,
	patternVariant: string | undefined,
	target: TTarget,
): ChildrenLayoutPreset | undefined {
	if (!patternId) return undefined;

	const pattern = findPattern(patternId, target);
	if (!pattern) return undefined;

	const variant = patternVariant ?? pattern.defaultVariant;
	return pattern.variants[variant];
}
