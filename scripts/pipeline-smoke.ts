/**
 * End-to-end pipeline 스모크.
 * PRDD .md → Register → Compose → Decorate → Materialize.
 * 사용: pnpm tsx scripts/pipeline-smoke.ts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline } from "@cx/agent/pipeline";
import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function loadJson<T>(p: string): Promise<T> {
	return JSON.parse(await readFile(p, "utf8")) as T;
}

async function main(): Promise<void> {
	const prddPath = resolve(ROOT, "database/client-imports/PRDD/screen/NOVA-PRDD-PG-001-0.md");
	const prddSource = await readFile(prddPath, "utf8");

	const [catalogDeck, designDeck, layoutPatternStoreDeck] = await Promise.all([
		loadJson<CatalogDeck>(resolve(ROOT, "database/generated-decks/catalog-deck.json")),
		loadJson<DesignDeck>(resolve(ROOT, "database/generated-decks/design-deck.json")),
		loadJson<LayoutPatternStoreDeck>(
			resolve(ROOT, "database/generated-decks/layout-pattern-store-deck.json"),
		),
	]);

	console.log("[pipeline] starting", "NOVA-PRDD-PG-001-0");
	const startedAt = Date.now();
	const result = await runPipeline(
		{
			prddSource,
			catalogDeck,
			designDeck,
			layoutPatternStoreDeck,
			importJobId: "pipeline-smoke-001",
		},
		{ composeMaxRetries: 2, decorateMaxRetries: 2 },
	);
	const elapsedMs = Date.now() - startedAt;

	console.log(`[pipeline] done in ${elapsedMs}ms, ok=${result.ok}, stage=${result.stage}`);
	if (result.invariantViolations.length > 0) {
		console.log("[pipeline] invariantViolations:");
		for (const v of result.invariantViolations) console.log(`  - ${v.code}: ${v.message}`);
	}
	if (result.issues.length > 0) {
		console.log(`[pipeline] issues (${result.issues.length}):`);
		for (const i of result.issues.slice(0, 8)) console.log(`  - ${i.code}: ${i.message}`);
	}
	if (result.materialized) {
		const m = result.materialized;
		console.log(
			`[pipeline] materialized: screens=${m.screens.length}, areas=${m.areas.length}, components=${m.components.length}, warnings=${m.warnings.length}`,
		);
		for (const c of m.components) {
			console.log(`    component ${c.id} :: type=${c.type}, pattern=${c.pattern.id}`);
		}
	}

	const outPath = resolve(ROOT, "database/ai-imports/pipeline-smoke-output.json");
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(outPath, JSON.stringify({ result, elapsedMs }, null, 2));
	console.log(`[pipeline] written to ${outPath}`);
	if (!result.ok) process.exitCode = 1;
}

main().catch((err) => {
	console.error("[pipeline] FAILED");
	console.error(err);
	process.exitCode = 1;
});
