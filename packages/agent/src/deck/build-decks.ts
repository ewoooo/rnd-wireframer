import { resolve } from "node:path";

import { buildCatalogDeck } from "./build-catalog-deck";
import { buildDesignDeck } from "./build-design-deck";
import { buildLayoutPatternStoreDeck } from "./build-layout-pattern-store-deck";
import { writeJson } from "./fs-utils";

export interface BuildAllDecksOptions {
	/** 저장소 루트 (기본: process.cwd()) */
	repoRoot?: string;
	version: string;
	builtAt?: string;
}

export interface BuildAllDecksResult {
	catalogDeckPath: string;
	designDeckPath: string;
	layoutPatternStoreDeckPath: string;
}

/**
 * 세 deck 을 한 번에 빌드해 database/generated-decks/ 에 출력.
 * SPEC §6 참조.
 */
export async function buildAllDecks(options: BuildAllDecksOptions): Promise<BuildAllDecksResult> {
	const root = options.repoRoot ?? process.cwd();
	const outDir = resolve(root, "database", "generated-decks");

	const catalogPromise = buildCatalogDeck({
		version: options.version,
		builtAt: options.builtAt,
	});
	const designPromise = buildDesignDeck({
		docsRoot: resolve(root, "docs", "design"),
		version: options.version,
		builtAt: options.builtAt,
	});
	const layoutPromise = buildLayoutPatternStoreDeck({
		patternStoreRoot: resolve(root, "packages", "pattern-store", "src", "catalog"),
		version: options.version,
		builtAt: options.builtAt,
	});

	const [catalog, design, layout] = await Promise.all([
		catalogPromise,
		designPromise,
		layoutPromise,
	]);

	const catalogDeckPath = resolve(outDir, "catalog-deck.json");
	const designDeckPath = resolve(outDir, "design-deck.json");
	const layoutPatternStoreDeckPath = resolve(outDir, "layout-pattern-store-deck.json");

	await Promise.all([
		writeJson(catalogDeckPath, catalog),
		writeJson(designDeckPath, design),
		writeJson(layoutPatternStoreDeckPath, layout),
	]);

	return { catalogDeckPath, designDeckPath, layoutPatternStoreDeckPath };
}

/** CLI 엔트리. `pnpm tsx packages/agent/src/deck/build-decks.ts` 등으로 호출. */
async function main(): Promise<void> {
	const version = process.env.DECK_VERSION ?? "0.1.0";
	const result = await buildAllDecks({ version });
	console.log("[build-decks] OK");
	console.log(`  ${result.catalogDeckPath}`);
	console.log(`  ${result.designDeckPath}`);
	console.log(`  ${result.layoutPatternStoreDeckPath}`);
}

const invokedAsScript =
	typeof process !== "undefined" && import.meta.url === `file://${process.argv[1]}`;

if (invokedAsScript) {
	main().catch((err) => {
		console.error("[build-decks] FAILED");
		console.error(err);
		process.exitCode = 1;
	});
}
