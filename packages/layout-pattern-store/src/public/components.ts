import {
	findRegisteredLayoutPatternComponent,
	findRegisteredLayoutPatternComponentByLayoutId,
	listRegisteredLayoutPatternComponents,
} from "../components/registry";
import type { LayoutPatternComponentEntry } from "../components/types";
import type { PatternStoreTarget } from "./types";

export type { LayoutPatternComponentEntry } from "../components/types";

export function findLayoutPatternComponentByLayoutId(
	layoutId: string,
): LayoutPatternComponentEntry | undefined {
	return findRegisteredLayoutPatternComponentByLayoutId(layoutId);
}

export function findLayoutPatternComponent(
	patternId: string,
	target?: PatternStoreTarget,
): LayoutPatternComponentEntry | undefined {
	const entry = findRegisteredLayoutPatternComponent(patternId);
	if (!entry) return undefined;
	return target && entry.target !== target ? undefined : entry;
}

export function listLayoutPatternComponents(): LayoutPatternComponentEntry[] {
	return listRegisteredLayoutPatternComponents();
}
