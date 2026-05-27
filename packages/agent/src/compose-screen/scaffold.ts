import type { ArchetypeBlockId, ScreenArchetype, ScreenStrategy } from "@cx/types/composition-output";

export interface ArchetypeScaffold {
	archetype: ScreenArchetype;
	strategy: ScreenStrategy;
	requiredBlocks: ArchetypeBlockId[];
	optionalBlocks: ArchetypeBlockId[];
	allowedSyntheticBlocks: ArchetypeBlockId[];
}

/**
 * Archetype scaffold catalog. Compose LLM #1이 받는 prior이자 Validator의 검증 근거.
 * archetype 선택 자체는 LLM 책임이고, 코드는 catalog lookup과 invariant 검증만 한다.
 */
export const ARCHETYPE_SCAFFOLD_CATALOG: Record<ScreenArchetype, ArchetypeScaffold> = {
	"agreement-flow": {
		archetype: "agreement-flow",
		strategy: "task-flow",
		requiredBlocks: ["navigation", "terms-list", "agreement-control", "primary-action"],
		optionalBlocks: ["supporting-info", "disclosure"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"commerce-detail": {
		archetype: "commerce-detail",
		strategy: "detail-reading",
		requiredBlocks: ["navigation", "hero-media", "hero-summary", "primary-facts", "primary-action"],
		optionalBlocks: [
			"price-summary",
			"price-accordion",
			"benefit-list",
			"option-selection",
			"option-list",
			"option-grid",
			"delivery-info",
			"rich-image-tab",
			"product-more-link",
			"coupon-benefit",
			"map-store-list",
			"brand-benefit-list",
			"product-disclosure",
			"supporting-info",
			"disclosure",
			"disclosure-list",
			"footer-legal",
			"sticky-cta",
			"bottom-cta",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	confirmation: {
		archetype: "confirmation",
		strategy: "confirmation",
		requiredBlocks: ["navigation", "result-state", "next-action"],
		optionalBlocks: ["primary-facts", "support-action"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"form-entry": {
		archetype: "form-entry",
		strategy: "form-entry",
		requiredBlocks: ["navigation", "form-fields", "validation-feedback", "primary-action"],
		optionalBlocks: ["supporting-info", "disclosure"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"generic-detail": {
		archetype: "generic-detail",
		strategy: "detail-reading",
		requiredBlocks: ["navigation", "hero-summary", "primary-facts"],
		optionalBlocks: [
			"summary-card",
			"text-list",
			"info-text-list",
			"notice-list",
			"accordion-list",
			"supporting-info",
			"disclosure",
			"primary-action",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"list-browse": {
		archetype: "list-browse",
		strategy: "comparison",
		requiredBlocks: ["navigation", "list-results"],
		optionalBlocks: [
			"summary-card",
			"search-filter",
			"tab-filter",
			"filter-chip",
			"filter-sort",
			"card-list",
			"product-list",
			"product-list-group",
			"product-list-horizontal",
			"product-list-row",
			"text-list",
			"info-text-list",
			"notice-list",
			"accordion-list",
			"supporting-info",
			"primary-action",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	support: {
		archetype: "support",
		strategy: "support",
		requiredBlocks: ["navigation", "supporting-info", "support-action"],
		optionalBlocks: [
			"primary-facts",
			"summary-card",
			"info-text-list",
			"notice-list",
			"accordion-list",
			"disclosure",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
};

export function listArchetypeCatalog(): ArchetypeScaffold[] {
	return Object.values(ARCHETYPE_SCAFFOLD_CATALOG);
}

export function lookupArchetypeScaffold(
	archetype: string,
): ArchetypeScaffold | undefined {
	return ARCHETYPE_SCAFFOLD_CATALOG[archetype as ScreenArchetype];
}
