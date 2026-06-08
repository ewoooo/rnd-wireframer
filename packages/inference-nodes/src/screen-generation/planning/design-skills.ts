import type { DesignSkillSelectionContract } from "@cx/schema";
import { type DesignSkillRef, SCHEMA_VERSION, type SourceSpec } from "@cx/schema";
import type { PatternLayerCandidate } from "./types";

const DESIGN_SKILL_VERSION = "2026-06-01";

const DESIGN_SKILL_REFS = {
	"detail-confirmation-screen": {
		appliesTo: ["detail-confirmation"],
		id: "detail-confirmation-screen",
		qualityGates: ["visual-hierarchy", "action-clarity", "pattern-fit"],
		reason:
			"Use when a screen presents summary/detail evidence and closes with a primary confirmation action.",
		requiredDesignDocs: [
			"packages/agent/docs/skills/references/design/COMPOSITION_LAYERS.md",
			"packages/agent/docs/skills/references/design/SCREEN_PATTERN_SUMMARY.md",
			"packages/agent/docs/skills/references/design/INTERACTION_PATTERNS.md",
		],
		version: DESIGN_SKILL_VERSION,
	},
	"form-entry-screen": {
		appliesTo: ["form-entry"],
		id: "form-entry-screen",
		qualityGates: ["section-rhythm", "density-fit", "action-clarity", "source-fidelity"],
		reason:
			"Use when a screen contains input, validation, consent, verification, or submit evidence.",
		requiredDesignDocs: [
			"packages/agent/docs/skills/references/design/SECTION_PATTERNS.md",
			"packages/agent/docs/skills/references/design/INTERACTION_PATTERNS.md",
			"packages/agent/docs/skills/references/design/LAYOUT_SPACING_CONTRACT.md",
		],
		version: DESIGN_SKILL_VERSION,
	},
	"list-selection-screen": {
		appliesTo: ["list-selection"],
		id: "list-selection-screen",
		qualityGates: ["visual-hierarchy", "section-rhythm", "density-fit", "pattern-fit"],
		reason:
			"Use when a screen contains repeated rows, selectable choices, agreement lists, or comparison lists.",
		requiredDesignDocs: [
			"packages/agent/docs/skills/references/design/SECTION_PATTERNS.md",
			"packages/agent/docs/skills/references/design/COMPONENT_INVENTORY.md",
			"packages/agent/docs/skills/references/design/LAYOUT_SPACING_CONTRACT.md",
		],
		version: DESIGN_SKILL_VERSION,
	},
	"generic-composition": {
		appliesTo: ["generic"],
		id: "generic-composition",
		qualityGates: ["visual-hierarchy", "section-rhythm", "source-fidelity"],
		reason:
			"Fallback when SourceSpec and ScreenIntent do not provide enough evidence for a specific design skill.",
		requiredDesignDocs: [
			"packages/agent/docs/skills/references/design/COMPOSITION_LAYERS.md",
			"packages/agent/docs/skills/references/design/SCREEN_PATTERN_SUMMARY.md",
			"packages/agent/docs/skills/references/design/LAYOUT_SPACING_CONTRACT.md",
		],
		version: DESIGN_SKILL_VERSION,
	},
} as const satisfies Record<
	| "detail-confirmation-screen"
	| "form-entry-screen"
	| "generic-composition"
	| "list-selection-screen",
	DesignSkillRef
>;

const DESIGN_SKILL_MATCHERS = [
	{
		id: "form-entry-screen",
		terms: [
			"textfield",
			"input",
			"form",
			"validation",
			"verify",
			"request",
			"submit",
			"입력",
			"인증",
			"검증",
			"필수",
			"제출",
		],
	},
	{
		id: "list-selection-screen",
		terms: [
			"list",
			"checkbox",
			"radio",
			"select",
			"option",
			"agreement",
			"terms",
			"목록",
			"선택",
			"약관",
			"동의",
			"옵션",
		],
	},
	{
		id: "detail-confirmation-screen",
		terms: [
			"detail",
			"summary",
			"confirm",
			"complete",
			"product",
			"benefit",
			"price",
			"상세",
			"요약",
			"확인",
			"완료",
			"상품",
			"혜택",
		],
	},
] as const;

/**
 * Selects a bounded design skill for composition planning.
 * This helper returns ids, docs, and gates only; loading skill bodies belongs to @cx/agent.
 */
export function buildDesignSkillSelection(input: {
	layerCandidates?: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): DesignSkillSelectionContract {
	const evidence = createSelectionEvidence(input);
	const matched: { id: keyof typeof DESIGN_SKILL_REFS; score: number } | undefined =
		DESIGN_SKILL_MATCHERS.map((matcher) => ({
			id: matcher.id,
			score: matcher.terms.reduce((score, term) => score + countMatches(evidence, term), 0),
		}))
			.filter((candidate) => candidate.score > 0)
			.sort((left, right) => right.score - left.score)[0];
	const selectedSkillId: keyof typeof DESIGN_SKILL_REFS = matched?.id ?? "generic-composition";
	const selectedSkill = DESIGN_SKILL_REFS[selectedSkillId];
	const candidateSkills = matched
		? [selectedSkill, DESIGN_SKILL_REFS["generic-composition"]]
		: [DESIGN_SKILL_REFS["generic-composition"]];

	return {
		candidateSkills,
		fallback: selectedSkillId === "generic-composition",
		rationale: [
			`Selected ${selectedSkill.id} from SourceSpec, ScreenIntent, and pattern candidate evidence.`,
			`Required docs: ${selectedSkill.requiredDesignDocs.join(", ")}.`,
		].join(" "),
		schemaVersion: SCHEMA_VERSION.designSkillSelection,
		selectedSkill,
	};
}

function countMatches(input: string, term: string): number {
	return input.split(term).length - 1;
}

function createSelectionEvidence(input: {
	layerCandidates?: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): string {
	const screen = input.sourceSpec.sourceShape.screen;
	const sourceEvidence = [
		screen.name,
		screen.route,
		screen.screenCode,
		...screen.regions.flatMap((region) => [
			region.slot,
			...region.children.flatMap((area) => [
				area.sourceAreaId,
				area.sourceAreaName,
				...area.children.flatMap((component) => [
					component.componentType,
					component.label,
					component.roleAlias,
					component.sourceComponentId,
					component.sourceId,
					component.variant,
					component.raw ? JSON.stringify(component.raw) : undefined,
				]),
			]),
		]),
	].filter((value): value is string => Boolean(value));

	return JSON.stringify({
		layerCandidates: input.layerCandidates?.map((candidate) => ({
			layout: candidate.layout,
			reason: candidate.reason,
			title: candidate.title,
		})),
		screenIntent: input.screenIntent,
		sourceEvidence,
	}).toLowerCase();
}
