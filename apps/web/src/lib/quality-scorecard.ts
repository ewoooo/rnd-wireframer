import type { RenderTree } from "@cx/renderer";
import { flattenRenderTree } from "./render-tree-diff";

export type QualityScorecard = {
	genericLayoutCount: number;
	missingLayoutCount: number;
	nodeCount: number;
	placeholderCount: number;
	stateCoverageCount: number;
};

const PLACEHOLDER_PATTERN = /\{[^}]+\}|예:|TODO|sample|placeholder/giu;
const GENERIC_LAYOUTS = new Set([
	"layout.area.productHeroSummary",
	"layout.composite.componentSectionMessage",
]);

export function createQualityScorecard(renderTree: RenderTree | undefined): QualityScorecard {
	const nodes = flattenRenderTree(renderTree);
	const serialized = JSON.stringify(renderTree ?? {});

	return {
		genericLayoutCount: nodes.filter((node) => node.layout && GENERIC_LAYOUTS.has(node.layout))
			.length,
		missingLayoutCount: nodes.filter((node) => !node.layout).length,
		nodeCount: nodes.length,
		placeholderCount: (serialized.match(PLACEHOLDER_PATTERN) ?? []).length,
		stateCoverageCount: nodes.filter((node) => node.display?.stateRole || node.display?.when)
			.length,
	};
}
