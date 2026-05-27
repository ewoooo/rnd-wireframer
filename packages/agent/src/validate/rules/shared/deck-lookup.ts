import { componentCatalog } from "@cx/components/catalog";
import { loadPatternStore } from "@cx/pattern-store";
import type {
	CatalogDeck,
	ComponentPatternCard,
	DesignDeck,
	DesignDocumentCard,
	LayoutPatternCard,
	LayoutPatternNodeKind,
	LayoutPatternStoreDeck,
	PrimitiveCard,
} from "@cx/types/ai-deck";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPropContract,
} from "@cx/types/component-catalog";
import type { DesignDocumentId } from "@cx/types/composition-output";
import type { PatternStorePattern } from "@cx/types/pattern-store";
import type { TokenRole } from "@cx/types/tokens";
import type { ValidatorContext, ValidatorDeps } from "../../types";

/**
 * Validator lookup helper.
 *
 * 기본 validation 기준은 deck snapshot이 아니라 SSOT다:
 * - @cx/components/catalog
 * - @cx/pattern-store
 * - @cx/types DesignDocumentId
 *
 * deck index 함수는 LLM context snapshot 호환/테스트용으로만 남긴다.
 */

export interface CatalogIndex {
	primitives: ReadonlyMap<string, PrimitiveCard>;
	componentPatterns: ReadonlyMap<string, ComponentPatternCard>;
	registeredComponentPatternIds: ReadonlySet<string>;
}

export function indexCatalogDeck(deck: CatalogDeck): CatalogIndex {
	const primitives = new Map(deck.primitives.map((p) => [p.id, p]));
	const componentPatterns = new Map<string, ComponentPatternCard>();
	const registered = new Set<string>();
	for (const card of deck.componentPatterns.registered) {
		componentPatterns.set(card.id, card);
		registered.add(card.id);
	}
	for (const card of deck.componentPatterns.proposed) {
		componentPatterns.set(card.id, card);
	}
	return {
		primitives,
		componentPatterns,
		registeredComponentPatternIds: registered,
	};
}

export function indexComponentCatalog(catalog: ComponentCatalog = componentCatalog): CatalogIndex {
	return {
		primitives: new Map(
			Object.entries(catalog).map(([type, entry]) => [type, toPrimitiveCard(type, entry)]),
		),
		componentPatterns: new Map(),
		registeredComponentPatternIds: new Set(),
	};
}

export interface LayoutPatternIndex {
	patterns: ReadonlyMap<string, LayoutPatternCard>;
	byNodeKind: ReadonlyMap<string, LayoutPatternCard[]>;
}

export function indexLayoutPatternStoreDeck(deck: LayoutPatternStoreDeck): LayoutPatternIndex {
	return indexLayoutPatternCards(deck.patterns);
}

export function indexPatternStore(patterns = loadPatternStore().patterns): LayoutPatternIndex {
	return indexLayoutPatternCards(patterns.map(toLayoutPatternCard));
}

function indexLayoutPatternCards(cards: LayoutPatternCard[]): LayoutPatternIndex {
	const byNodeKind = new Map<string, LayoutPatternCard[]>();
	for (const pattern of cards) {
		for (const nodeKind of pattern.appliesTo) {
			const list = byNodeKind.get(nodeKind);
			if (list) list.push(pattern);
			else byNodeKind.set(nodeKind, [pattern]);
		}
	}
	return {
		patterns: new Map(cards.map((p) => [p.id, p])),
		byNodeKind,
	};
}

export interface DesignIndex {
	documents: ReadonlyMap<DesignDocumentId, DesignDocumentCard>;
}

export function indexDesignDeck(deck: DesignDeck): DesignIndex {
	return {
		documents: new Map(deck.documents.map((d) => [d.id, d])),
	};
}

export const DESIGN_DOCUMENT_IDS = [
	"COMPOSITION_LAYERS.md",
	"DESIGN_FOUNDATION.md",
	"LAYOUT_SPACING_CONTRACT.md",
	"SECTION_PATTERNS.md",
	"SCREEN_PATTERN_SUMMARY.md",
	"COMPONENT_INVENTORY.md",
	"INTERACTION_PATTERNS.md",
	"VISUAL_FOUNDATION_OBSERVATIONS.md",
] as const satisfies readonly DesignDocumentId[];

export function indexDesignDocuments(
	ids: readonly DesignDocumentId[] = DESIGN_DOCUMENT_IDS,
): DesignIndex {
	return {
		documents: new Map(
			ids.map((id) => [
				id,
				{
					id,
					title: id,
					responsibility: "",
					rules: [],
				} satisfies DesignDocumentCard,
			]),
		),
	};
}

export function getValidatorContext(deps: ValidatorDeps): ValidatorContext {
	return deps.validationContext ?? buildDefaultValidatorContext();
}

export function buildDefaultValidatorContext(): ValidatorContext {
	return {
		catalog: indexComponentCatalog(),
		design: indexDesignDocuments(),
		layoutPatterns: indexPatternStore(),
	};
}

export function buildSnapshotValidatorContext(args: {
	catalogDeck: CatalogDeck;
	designDeck: DesignDeck;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
}): ValidatorContext {
	return {
		catalog: indexCatalogDeck(args.catalogDeck),
		design: indexDesignDeck(args.designDeck),
		layoutPatterns: indexLayoutPatternStoreDeck(args.layoutPatternStoreDeck),
	};
}

export function primitiveHasVariant(card: PrimitiveCard, variant: string | undefined): boolean {
	if (!variant) return true;
	return card.variants.includes(variant);
}

export function layoutPatternHasVariant(
	card: LayoutPatternCard,
	variant: string | undefined,
): boolean {
	if (!variant) return true;
	return card.variants.includes(variant);
}

export interface LayoutPatternSuggestion {
	id: string;
	variants: string[];
	appliesTo: string[];
	reason: string;
}

export function suggestLayoutPatterns(
	index: LayoutPatternIndex,
	args: {
		nodeKind: "screen" | "area" | "group";
		requestedId: string;
		selectedPattern?: LayoutPatternCard;
		limit?: number;
	},
): LayoutPatternSuggestion[] {
	const candidates = index.byNodeKind.get(args.nodeKind) ?? [];
	const searchText = [
		args.requestedId,
		args.selectedPattern?.id,
		args.selectedPattern?.name,
		args.selectedPattern?.description,
	]
		.filter((value): value is string => Boolean(value))
		.join(" ");
	const searchTokens = tokenize(searchText);
	const ranked = candidates
		.map((candidate) => ({
			candidate,
			score: scoreLayoutPattern(candidate, searchTokens),
		}))
		.sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
	return ranked.slice(0, args.limit ?? 3).map(({ candidate, score }) => ({
		id: candidate.id,
		variants: candidate.variants,
		appliesTo: candidate.appliesTo,
		reason:
			score > 0
				? `same ${args.nodeKind} layer and similar wording`
				: `valid ${args.nodeKind} layoutPattern candidate`,
	}));
}

function scoreLayoutPattern(
	candidate: LayoutPatternCard,
	searchTokens: ReadonlySet<string>,
): number {
	if (searchTokens.size === 0) return 0;
	const candidateTokens = tokenize([candidate.id, candidate.name, candidate.description].join(" "));
	let score = 0;
	for (const token of searchTokens) {
		if (candidateTokens.has(token)) score += 2;
	}
	if (candidate.id.includes("app-bar") && (searchTokens.has("app") || searchTokens.has("bar"))) {
		score += 4;
	}
	return score;
}

function tokenize(value: string): Set<string> {
	return new Set(
		value
			.toLowerCase()
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.split(/[^a-z0-9가-힣]+/)
			.filter((token) => token.length >= 2),
	);
}

function toPrimitiveCard(type: string, entry: ComponentCatalogEntry): PrimitiveCard {
	const propsList: Array<{ name: string; contract: ComponentPropContract }> = [];
	const tokenRoles = new Set<TokenRole>();
	let variants: string[] = [];

	for (const [name, contract] of Object.entries(entry.props)) {
		propsList.push({ name, contract });
		if (contract.tokenRole) tokenRoles.add(contract.tokenRole);
		if (contract.role === "styleVariant" && contract.values && variants.length === 0) {
			variants = [...contract.values];
		}
	}

	return {
		id: type,
		name: type,
		description: entry.description ?? "",
		props: propsList,
		variants,
		tokensExpected: [...tokenRoles],
		tokenSlots: entry.tokens,
		exampleUsage: "",
	};
}

function toLayoutPatternCard(pattern: PatternStorePattern): LayoutPatternCard {
	return {
		id: pattern.id,
		name: pattern.name,
		description: pattern.description ?? "",
		variants: Object.keys(pattern.variants),
		appliesTo: [mapPatternTarget(pattern.target)],
	};
}

function mapPatternTarget(target: PatternStorePattern["target"]): LayoutPatternNodeKind {
	return target;
}
