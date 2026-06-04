/**
 * Decorate LLM #2 통합 스모크.
 *
 * 이전 compose-screen 스모크의 output 을 입력으로 사용.
 * 사용: pnpm tsx scripts/decorate-screen-smoke.ts
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
	CatalogDeck,
	CompositionOutput,
	DesignDeck,
	LayoutPatternStoreDeck,
	PrddScreenRecord,
} from "@cx/types";

import { decorateScreen } from "@cx/agent/decorate-screen";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

async function loadJson<T>(path: string): Promise<T> {
	const raw = await readFile(path, "utf8");
	return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
	const composeOut = await loadJson<{
		input: PrddScreenRecord;
		result: { output?: CompositionOutput };
	}>(resolve(ROOT, "database/ai-imports/compose-screen-smoke-output.json"));

	const composition = composeOut.result.output;
	if (!composition) {
		console.error("[smoke] no composition output found");
		process.exit(1);
	}
	const prddScreenRecord = composeOut.input;

	const catalogDeck = await loadJson<CatalogDeck>(
		resolve(ROOT, "database/generated-decks/catalog-deck.json"),
	);
	const designDeck = await loadJson<DesignDeck>(
		resolve(ROOT, "database/generated-decks/design-deck.json"),
	);
	const layoutPatternStoreDeck = await loadJson<LayoutPatternStoreDeck>(
		resolve(ROOT, "database/generated-decks/layout-pattern-store-deck.json"),
	);

	console.log("[smoke] decorating screen", composition.screen.screenId);
	console.log(
		`[smoke] composed: ${composition.areas.length} areas, ${composition.decisions.length} decisions, layoutPatternStore: ${layoutPatternStoreDeck.patterns.length} patterns`,
	);

	const startedAt = Date.now();
	const result = await decorateScreen(
		{ composition, catalogDeck, designDeck, layoutPatternStoreDeck, prddScreenRecord },
		{ maxRetries: 2, claudeOptions: { debug: true } },
	);
	const elapsedMs = Date.now() - startedAt;

	console.log(`[smoke] done in ${elapsedMs}ms, ok=${result.ok}, attempts=${result.attempts.length}`);
	if (!result.ok) {
		console.log(`[smoke] issues (${result.issues.length}):`);
		for (const issue of result.issues.slice(0, 10)) {
			console.log(`  - ${issue.code}: ${issue.message}`);
		}
		if (result.issues.length > 10) {
			console.log(`  ... and ${result.issues.length - 10} more`);
		}
	} else if (result.output) {
		const verdicts = {
			screen: result.output.screen.verdict,
			areas: Object.fromEntries(
				Object.entries(result.output.areas).map(([k, v]) => [k, v.verdict]),
			),
			decisions: Object.fromEntries(
				Object.entries(result.output.decisions).map(([k, v]) => [k, v.verdict]),
			),
		};
		console.log("[smoke] verdicts:", JSON.stringify(verdicts, null, 2));
	}

	const outPath = resolve(ROOT, "database/ai-imports/decorate-screen-smoke-output.json");
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(
		outPath,
		JSON.stringify({ result, elapsedMs }, null, 2),
	);
	console.log(`[smoke] full output written to ${outPath}`);

	if (!result.ok) process.exitCode = 1;
}

main().catch((err) => {
	console.error("[smoke] FAILED");
	console.error(err);
	process.exitCode = 1;
});
