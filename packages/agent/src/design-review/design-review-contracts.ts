import type { RenderTreeNodeKind } from "@cx/renderer";
import type { PatternRef, RegionSlot } from "../types";

export const DESIGN_REFERENCE_PATHS = [
	"docs/design/COMPOSITION_LAYERS.md",
	"docs/design/LAYOUT_SPACING_CONTRACT.md",
	"docs/design/SECTION_PATTERNS.md",
	"docs/design/SCREEN_PATTERN_SUMMARY.md",
	"docs/design/COMPONENT_INVENTORY.md",
	"docs/design/INTERACTION_PATTERNS.md",
	"docs/design/VISUAL_FOUNDATION_OBSERVATIONS.md",
	"docs/design/DESIGN_FOUNDATION.md",
] as const;

export const REGION_SLOTS = [
	"header",
	"contents",
	"bottom",
] as const satisfies readonly RegionSlot[];

export const DESIGN_REVIEW_STAGE = {
	version: "1.0.0",
	deterministicReviewer: "deterministic-design-review",
	defaultReviewer: "design-review-agent",
	defaultTreeStage: "decorated",
} as const;

export const DESIGN_REVIEW_REFERENCES = {
	interactionCta: {
		path: "docs/design/INTERACTION_PATTERNS.md",
		section: "CTA",
		rationale: "Primary screen actions should be separated from inline content actions.",
	},
	compositionLayer: {
		path: "docs/design/COMPOSITION_LAYERS.md",
		section: "Area to Screen composition",
		rationale:
			"Screen-level actions belong to the screen composition layer, not arbitrary content area flow.",
	},
} as const;

export interface DesignReviewRuleContract {
	id: string;
	sourceRegions: readonly RegionSlot[];
	targetRegion: RegionSlot;
	placement: "first" | "last" | "before" | "after" | "replace";
	componentKinds?: readonly RenderTreeNodeKind[];
	componentTypes?: readonly string[];
	componentIdPatterns?: readonly string[];
	labelPropNames: readonly string[];
	labelPatterns?: readonly string[];
	hookActions?: readonly string[];
	requiresLastAreaChild?: boolean;
	finding: {
		idTemplate: string;
		severity: "error" | "warning" | "suggestion";
		title: string;
		descriptionTemplate: string;
	};
	operation: {
		idTemplate: string;
		priority: "P0" | "P1" | "P2" | "P3";
		confidence?: number;
		rationaleTemplate: string;
	};
	designReferences: readonly [
		typeof DESIGN_REVIEW_REFERENCES.interactionCta,
		typeof DESIGN_REVIEW_REFERENCES.compositionLayer,
	];
}

export const DESIGN_REVIEW_RULES = [
	{
		id: "primary-screen-action-in-contents",
		sourceRegions: ["contents"],
		targetRegion: "bottom",
		placement: "last",
		componentKinds: ["action"],
		componentIdPatterns: ["action-area"],
		labelPropNames: ["label", "title"],
		labelPatterns: [
			"다음",
			"확인",
			"완료",
			"인증 확인",
			"시작",
			"submit",
			"confirm",
			"next",
			"done",
		],
		hookActions: ["navigate", "submit"],
		requiresLastAreaChild: true,
		finding: {
			idTemplate: "primary-cta-in-contents-{screenId}-{componentId}",
			severity: "warning",
			title: "Primary CTA is placed in contents",
			descriptionTemplate:
				"{componentId} appears to be a screen-level primary action inside {areaId}.",
		},
		operation: {
			idTemplate: "move-{componentId}-to-bottom",
			priority: "P1",
			confidence: 0.82,
			rationaleTemplate:
				"{componentId} is a primary navigation/action CTA and should be promoted to the bottom region.",
		},
		designReferences: [
			DESIGN_REVIEW_REFERENCES.interactionCta,
			DESIGN_REVIEW_REFERENCES.compositionLayer,
		],
	},
] as const satisfies readonly DesignReviewRuleContract[];

export interface SyntheticRegionAreaContract {
	idSuffix: string;
	name: string;
	layout: string;
	pattern: PatternRef;
}

export const SYNTHETIC_REGION_AREA_CONTRACTS = {
	header: {
		idSuffix: "header-actions",
		name: "상단 액션 영역",
		layout: "vertical",
		pattern: {
			id: "action-stack",
			variant: "default",
			reasons: ["design review synthetic region area contract"],
		},
	},
	contents: {
		idSuffix: "contents-actions",
		name: "본문 액션 영역",
		layout: "vertical",
		pattern: {
			id: "action-stack",
			variant: "default",
			reasons: ["design review synthetic region area contract"],
		},
	},
	bottom: {
		idSuffix: "bottom-actions",
		name: "하단 액션 영역",
		layout: "vertical",
		pattern: {
			id: "bottom-action-area",
			variant: "default",
			reasons: ["design review synthetic region area contract"],
		},
	},
} as const satisfies Record<RegionSlot, SyntheticRegionAreaContract>;
