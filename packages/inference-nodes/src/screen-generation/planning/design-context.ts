import type { DesignContextBundleId, DesignContextBundleRef, SourceSpec } from "@cx/schema";
import { readReportSummary } from "../shared/report-summary";
import type { DesignContextBundleSelection, PatternLayerCandidate } from "./types";

const DESIGN_CONTEXT_BUNDLE_VERSION = "2026-05-29";

const DESIGN_CONTEXT_BUNDLE_SOURCE_DOCS = {
	"interaction-state": ["packages/agent/docs/skills/references/design/INTERACTION_PATTERNS.md", "packages/agent/docs/skills/references/design/SECTION_PATTERNS.md"],
	"layout-composition": [
		"packages/agent/docs/skills/references/design/COMPOSITION_LAYERS.md",
		"packages/agent/docs/skills/references/design/SECTION_PATTERNS.md",
		"packages/agent/docs/skills/references/design/SCREEN_PATTERN_SUMMARY.md",
		"packages/agent/docs/skills/references/design/LAYOUT_SPACING_CONTRACT.md",
	],
	"quality-review": [
		"packages/agent/docs/quality-review/checklist.md",
		"packages/agent/docs/screen-generation/checklist.md",
	],
	"visual-foundation": [
		"packages/agent/docs/skills/references/design/LAYOUT_SPACING_CONTRACT.md",
		"packages/agent/docs/skills/references/design/VISUAL_FOUNDATION_OBSERVATIONS.md",
		"packages/agent/docs/skills/references/design/COMPONENT_INVENTORY.md",
	],
} as const satisfies Record<DesignContextBundleId, string[]>;

const DESIGN_CONTEXT_BUNDLE_REASONS = {
	"interaction-state":
		"Source or upstream context implies form, list, search, detail, or async state coverage.",
	"layout-composition":
		"Every screen generation needs stable Screen/Region/Area composition guidance.",
	"quality-review": "Validation or review stages need shared source-fidelity and anti-slop gates.",
	"visual-foundation":
		"Every screen generation needs SKT SDUI spacing, divider, and typography guardrails.",
} as const satisfies Record<DesignContextBundleId, string>;

/**
 * Selects design-context bundle refs from deterministic inputs.
 * The helper returns ids and provenance only; bundle file loading belongs outside orchestration.
 */
export function buildDesignContextBundleRefs(input: {
	compositionPlan?: unknown;
	layerCandidates?: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
	validationReport?: unknown;
}): DesignContextBundleSelection {
	const selectedIds = new Set<DesignContextBundleId>(["layout-composition", "visual-foundation"]);

	if (hasStatefulSurface(input.sourceSpec, input.screenIntent, input.compositionPlan)) {
		selectedIds.add("interaction-state");
	}

	if (hasValidationIssues(input.validationReport)) {
		selectedIds.add("quality-review");
	}

	const bundleRefs = [...selectedIds].map((id) => createDesignContextBundleRef(id));

	return {
		bundleRefs,
		rationale: [
			"Selected deterministic design-context bundles from SourceSpec, upstream design artifacts, and validation state.",
			`Bundle ids: ${bundleRefs.map((bundleRef) => bundleRef.id).join(", ")}.`,
		].join(" "),
	};
}

function createDesignContextBundleRef(id: DesignContextBundleId): DesignContextBundleRef {
	return {
		id,
		reason: DESIGN_CONTEXT_BUNDLE_REASONS[id],
		sourceDocs: [...DESIGN_CONTEXT_BUNDLE_SOURCE_DOCS[id]],
		version: DESIGN_CONTEXT_BUNDLE_VERSION,
	};
}

function hasStatefulSurface(
	sourceSpec: SourceSpec,
	screenIntent: unknown,
	compositionPlan: unknown,
): boolean {
	const sourceText = JSON.stringify(sourceSpec).toLowerCase();
	const upstreamText = JSON.stringify({ compositionPlan, screenIntent }).toLowerCase();
	return STATEFUL_SURFACE_TERMS.some(
		(term) => sourceText.includes(term) || upstreamText.includes(term),
	);
}

const STATEFUL_SURFACE_TERMS = [
	"async",
	"empty",
	"error",
	"form",
	"input",
	"list",
	"loading",
	"search",
	"select",
	"validation",
	"검색",
	"목록",
	"에러",
	"오류",
	"입력",
	"폼",
	"필수",
] as const;

function hasValidationIssues(input: unknown): boolean {
	const report = readReportSummary(input);
	return Boolean(report && report.errorCount + report.warningCount > 0);
}
