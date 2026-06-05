import type { PatternLayerCandidate } from "@cx/orchestration/types";
import {
	type CompositionPlanContract,
	type DesignSkillSelectionContract,
	SCHEMA_VERSION,
	type SourceSpec,
	type ValidationReportContract,
} from "@cx/schema";

export function createFakeCompositionPlan(
	sourceSpec: SourceSpec,
	layerCandidates: PatternLayerCandidate[],
	designSkillSelection?: DesignSkillSelectionContract,
): CompositionPlanContract {
	const screenLayout =
		layerCandidates.find((candidate) => candidate.level === "screen")?.layout ??
		"layout.screen.commerceDetailScreen";
	const skillId = designSkillSelection?.selectedSkill.id ?? "generic-composition";

	return {
		density: sourceSpec.sourceShape.screen.regions.length > 3 ? "high" : "medium",
		layoutStrategy: `Use ${skillId} guidance while keeping source regions as stable screen rails for RenderTree generation.`,
		patternRationale: `Fake composition keeps the available screen layout while preserving source region order and ${skillId} design-skill gates for later pattern selection.`,
		primaryUserAction: "complete-primary-flow",
		rationale:
			"Fake composition plan records the design composition decision before pattern selection.",
		rejectedPatterns: [],
		schemaVersion: SCHEMA_VERSION.compositionPlan,
		screenLayout,
		sectionRhythm:
			"Preserve source region order and use region boundaries as the first section rhythm signal.",
		sections: sourceSpec.sourceShape.screen.regions.map((region, index) => ({
			priority: index + 1,
			role: REGION_SECTION_ROLE[region.slot] ?? "content",
			sourceRefs: region.children.flatMap((area) => [
				area.sourceAreaId,
				...area.children.map((component) => component.sourceId ?? component.sourceComponentId),
			]),
			strategy: `Preserve ${region.slot} source order and map it to a stable screen section.`,
			targetRegion: REGION_TARGET[region.slot] ?? "contents",
		})),
		visualHierarchy: `Header establishes context, contents carry the main information, and bottom action closes the flow when present under ${skillId}.`,
	};
}

export function createFakePatternSelection(layerCandidates: PatternLayerCandidate[]) {
	return {
		confidence: layerCandidates.length > 0 ? 1 : 0,
		reason:
			"Fake smoke runner selects all resolved screen, region, area, and component layer candidates.",
		schemaVersion: "pattern-selection.v0.1",
		selectedCandidates: layerCandidates.map((candidate) => ({
			id: candidate.id,
			level: candidate.level,
			layout: candidate.layout,
			targetRef: candidate.targetRef,
		})),
	};
}

export function createFakeComponentProposal() {
	return {
		proposals: [],
		schemaVersion: SCHEMA_VERSION.componentProposal,
	};
}

export function createFakeQualityInspection(
	validationReport: ValidationReportContract | undefined,
) {
	const warningCount = validationReport?.summary.warningCount ?? 0;

	return {
		findings: warningCount
			? [
					{
						code: "validation-warning-review",
						layer: "revise",
						message: "Generation result has validation warnings that should be reviewed.",
						path: ["validationReport", "issues"],
						severity: "warning",
						suggestion: "Inspect warning paths before approving the generated screen.",
					},
				]
			: [],
		inspection: {
			compositionAligned: warningCount === 0,
			sourceFaithful: warningCount === 0,
			visualHierarchyClear: true,
		},
		scores: {
			actionClarity: warningCount === 0 ? 5 : 3,
			densityFit: warningCount === 0 ? 5 : 3,
			fidelity: warningCount === 0 ? 5 : 3,
			hierarchy: warningCount === 0 ? 5 : 3,
			patternFit: warningCount === 0 ? 5 : 3,
			separation: warningCount === 0 ? 5 : 3,
		},
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		summary: {
			errorCount: 0,
			warningCount: warningCount > 0 ? 1 : 0,
		},
	};
}

const REGION_SECTION_ROLE = {
	bottom: "bottom-action",
	contents: "content",
	header: "header",
	unknown: "content",
} as const;

const REGION_TARGET = {
	bottom: "bottom",
	contents: "contents",
	header: "header",
	unknown: "contents",
} as const;
