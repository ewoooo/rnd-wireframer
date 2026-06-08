import { createHash } from "node:crypto";

import { loadComponentPatternStore } from "@cx/component-pattern-store";
import { componentCatalog } from "@cx/components/catalog";
import { externalCatalog } from "@cx/external/catalog";
import type { CatalogDeck, ComponentPatternCard, PrimitiveCard } from "@cx/types/ai-deck";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPropContract,
} from "@cx/types/component-catalog";
import type { ComponentPattern } from "@cx/types/component-pattern";
import type { TokenRole } from "@cx/types/tokens";
import { readJsonDirSafe } from "./fs-utils";

export interface BuildCatalogDeckOptions {
	/** Legacy/test override. registered/proposed ComponentPatternCard JSON 파일이 들어 있는 디렉토리. */
	componentPatternsRoot?: string;
	version: string;
	builtAt?: string;
}

/**
 * SPEC §6 — catalog-deck.json 생성.
 *
 * primitives ← packages/component/src/catalog.ts
 * componentPatterns ← @cx/component-pattern-store
 */
export async function buildCatalogDeck(options: BuildCatalogDeckOptions): Promise<CatalogDeck> {
	// 우선순위: 우리 독자(낮음) → kiki-draft → kiki-barrel(높음)
	const mergedCatalog = { ...componentCatalog, ...externalCatalog };
	const primitives = buildPrimitiveCards(mergedCatalog);

	const componentPatterns = options.componentPatternsRoot
		? {
				registered: await readJsonDirSafe<ComponentPatternCard>(
					`${options.componentPatternsRoot}/registered`,
				),
				proposed: await readJsonDirSafe<ComponentPatternCard>(
					`${options.componentPatternsRoot}/proposed`,
				),
			}
		: buildComponentPatternCards();

	return {
		builtAt: options.builtAt ?? new Date().toISOString(),
		version: options.version,
		primitives,
		componentPatterns,
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

function buildComponentPatternCards(): CatalogDeck["componentPatterns"] {
	const store = loadComponentPatternStore();
	return {
		registered: store.registered.map(toComponentPatternCard),
		proposed: store.proposed.map(toComponentPatternCard),
	};
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
	return createHash("sha256").update(stableStringify(composition)).digest("hex").slice(0, 16);
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
