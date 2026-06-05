import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadComponentPatternStore } from "@cx/component-pattern-store";
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
import type { ComponentPattern } from "@cx/types/component-pattern";
import type { DesignDocumentId } from "@cx/types/composition-output";
import type { PatternStorePattern } from "@cx/types/pattern-store";
import type { TokenRole } from "@cx/types/tokens";
import { parseDesignDocument } from "../../../design/design-parser";
import type { ValidatorContext, ValidatorDeps } from "../../types";

/**
 * Validator lookup helper.
 *
 * 기본 validation 기준은 deck snapshot이 아니라 SSOT다:
 * - @cx/components/catalog
 * - @cx/component-pattern-store
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
	const componentPatternStore = loadComponentPatternStore();
	const registered = componentPatternStore.registered.map(toComponentPatternCard);
	const proposed = componentPatternStore.proposed.map(toComponentPatternCard);

	return {
		primitives: new Map(
			Object.entries(catalog).map(([type, entry]) => [type, toPrimitiveCard(type, entry)]),
		),
		componentPatterns: new Map([...registered, ...proposed].map((card) => [card.id, card])),
		registeredComponentPatternIds: new Set(registered.map((card) => card.id)),
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

/**
 * 디자인 문서가 위치한 docs/design 경로. 모듈 위치 기준으로 해석해
 * cwd에 의존하지 않는다(packages/agent/src/validate/rules/shared → repo root).
 */
const DEFAULT_DOCS_ROOT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../../../../../docs/design",
);

let cachedDesignIndex: DesignIndex | undefined;
let cachedDocsRoot: string | undefined;

export function indexDesignDocuments(
	ids: readonly DesignDocumentId[] = DESIGN_DOCUMENT_IDS,
	docsRoot: string = DEFAULT_DOCS_ROOT,
): DesignIndex {
	if (cachedDesignIndex && cachedDocsRoot === docsRoot && ids === DESIGN_DOCUMENT_IDS) {
		return cachedDesignIndex;
	}

	const documents = new Map<DesignDocumentId, DesignDocumentCard>();
	for (const id of ids) {
		const filePath = resolve(docsRoot, id);
		let card: DesignDocumentCard;
		try {
			const content = readFileSync(filePath, "utf-8");
			card = parseDesignDocument(id, content);
		} catch {
			card = { id, title: id, responsibility: "", rules: [] };
		}
		documents.set(id, card);
	}

	const index: DesignIndex = { documents };
	if (ids === DESIGN_DOCUMENT_IDS) {
		cachedDesignIndex = index;
		cachedDocsRoot = docsRoot;
	}
	return index;
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

function toComponentPatternCard(pattern: ComponentPattern): ComponentPatternCard {
	return {
		id: pattern.id,
		name: pattern.name,
		status: pattern.status,
		intent: pattern.intent,
		rationale: pattern.rationale,
		props: pattern.props,
		slots: pattern.slots,
		variants: pattern.variants,
		compositionDigest: digestComposition(pattern.composition),
	};
}

function digestComposition(composition: ComponentPattern["composition"]): string {
	return stableHash(stableStringify(composition));
}

function stableStringify(value: unknown): string {
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(",")}]`;
	}
	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, entryValue]) => entryValue !== undefined)
			.sort(([a], [b]) => a.localeCompare(b));
		return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
	}
	return JSON.stringify(value);
}

function stableHash(value: string): string {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i += 1) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}
