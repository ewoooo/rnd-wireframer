import type {
	CatalogDeck,
	ComponentPatternCard,
	DesignDeck,
	DesignDocumentCard,
	DesignDocumentId,
	LayoutPatternCard,
	LayoutPatternStoreDeck,
	PrimitiveCard,
} from "@cx/types";

/**
 * Validator가 deck을 빠르게 조회하기 위한 lookup 헬퍼.
 * 룰 파일들은 반드시 이 모듈을 통해 deck에 접근한다 (raw deck traversal 금지).
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

export interface LayoutPatternIndex {
	patterns: ReadonlyMap<string, LayoutPatternCard>;
	byNodeKind: ReadonlyMap<string, LayoutPatternCard[]>;
}

export function indexLayoutPatternStoreDeck(deck: LayoutPatternStoreDeck): LayoutPatternIndex {
	const byNodeKind = new Map<string, LayoutPatternCard[]>();
	for (const pattern of deck.patterns) {
		for (const nodeKind of pattern.appliesTo) {
			const list = byNodeKind.get(nodeKind);
			if (list) {
				list.push(pattern);
			} else {
				byNodeKind.set(nodeKind, [pattern]);
			}
		}
	}
	return {
		patterns: new Map(deck.patterns.map((p) => [p.id, p])),
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
