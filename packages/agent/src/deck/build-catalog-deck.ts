import type {
	CatalogDeck,
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPatternCard,
	ComponentPropContract,
	PrimitiveCard,
	TokenRole,
} from "@cx/types";
import { componentCatalog } from "@cx/components/catalog";

import { readJsonDirSafe } from "./fs-utils";

export interface BuildCatalogDeckOptions {
	/** registered/proposed componentPattern JSON 파일이 들어 있는 디렉토리. 부재 시 빈 배열. */
	componentPatternsRoot?: string;
	version: string;
	builtAt?: string;
}

/**
 * SPEC §6 — catalog-deck.json 생성.
 *
 * primitives ← packages/component/src/catalog.ts
 * componentPatterns ← database/component-patterns/{registered,proposed}/*.json (부재 시 빈 배열)
 */
export async function buildCatalogDeck(options: BuildCatalogDeckOptions): Promise<CatalogDeck> {
	const primitives = buildPrimitiveCards(componentCatalog);

	const registered = options.componentPatternsRoot
		? await readJsonDirSafe<ComponentPatternCard>(`${options.componentPatternsRoot}/registered`)
		: [];
	const proposed = options.componentPatternsRoot
		? await readJsonDirSafe<ComponentPatternCard>(`${options.componentPatternsRoot}/proposed`)
		: [];

	return {
		builtAt: options.builtAt ?? new Date().toISOString(),
		version: options.version,
		primitives,
		componentPatterns: { registered, proposed },
	};
}

function buildPrimitiveCards(catalog: ComponentCatalog): PrimitiveCard[] {
	return Object.entries(catalog).map(([type, entry]) => toPrimitiveCard(type, entry));
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
