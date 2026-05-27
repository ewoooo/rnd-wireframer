/**
 * 단일 PRDD를 LLM 포함 runPipeline에 통과시키고 결과를 자세히 들여다본다.
 * 콘솔에는 사람이 보는 5블록 요약을, 디스크에는 단계별 raw JSON을 떨군다.
 *
 * 사용: pnpm tsx scripts/run-pipeline-one.ts [prdd-filename]
 * 산출: database/pipeline-runs/<target-stem>-<unix-ts>/{00-input,01-register,02-compose,03-decorate,04-materialized,summary}.{json,txt}
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runPipeline } from "@cx/agent/pipeline/experimental";
import { promoteDatabaseTablesCandidate } from "@cx/agent/promote-database-tables";
import { loadPatternStore } from "@cx/pattern-store";
import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionDecision } from "@cx/types/composition-output";
import { errorsOf, warningsOf } from "@cx/types/validation";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const promote = args.includes("--promote");
const target = args.find((a) => !a.startsWith("--")) ?? "NOVA-PRDD-PG-001-0.md";
const prddPath = resolve(ROOT, "database/client-imports/PRDD/screen", target);
const prddSource = readFileSync(prddPath, "utf-8");

const loadJson = <T>(p: string): T => JSON.parse(readFileSync(resolve(ROOT, p), "utf-8")) as T;
const catalogDeck = loadJson<CatalogDeck>("database/generated-decks/catalog-deck.json");
const designDeck = loadJson<DesignDeck>("database/generated-decks/design-deck.json");
const layoutPatternStoreDeck = loadJson<LayoutPatternStoreDeck>(
	"database/generated-decks/layout-pattern-store-deck.json",
);

const stem = target.replace(/\.md$/, "");
const ts = Date.now();
const outDir = resolve(ROOT, "database/pipeline-runs", `${stem}-${ts}`);
mkdirSync(outDir, { recursive: true });

const summary: string[] = [];
const log = (line = "") => {
	console.log(line);
	summary.push(line);
};

async function main() {
	const importJobId = `pipeline-smoke-${ts}`;

	log(`[run] target=${target}`);
	log(
		`[run] decks: ${catalogDeck.primitives.length} primitives, ${layoutPatternStoreDeck.patterns.length} layoutPatterns, ${designDeck.documents.length} designDocs`,
	);
	log(`[run] starting LLM pipeline (compose + decorate)...`);

	const startedAt = Date.now();
	const result = await runPipeline({
		prddSource,
		catalogDeck,
		designDeck,
		layoutPatternStoreDeck,
		importJobId,
	});
	const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

	log("");
	log(`[done] stage=${result.stage} ok=${result.ok} elapsed=${elapsed}s`);
	log(
		`[done] issues=${result.issues.length} invariantViolations=${result.invariantViolations.length}`,
	);

	// 1. Register
	if (result.prddScreenRecord) {
		const r = result.prddScreenRecord;
		log("");
		log("─── 1. REGISTER ───");
		log(`  screenId=${r.id} name="${r.name}" type=${r.screenType} importJobId=${r.importJobId}`);
		log(`  areas=${r.areas?.length ?? 0} states=${r.states?.length ?? 0}`);
		const componentCount = (r.areas ?? []).reduce(
			(sum, a) => sum + (a.area?.children?.length ?? 0),
			0,
		);
		log(`  components(total)=${componentCount}`);
	}

	// 2. Compose attempts
	if (result.compose) {
		log("");
		log(`─── 2. COMPOSE (${result.compose.attempts.length} attempts) ───`);
		for (const a of result.compose.attempts) {
			const vr = a.validatorResult;
			log(
				`  attempt #${a.attempt}: parseIssues=${a.parseIssues.length} validator=${vr ? (vr.ok ? "ok" : `fail(${vr.issues.length})`) : "n/a"} retryHints=${a.retryHints?.length ?? 0}`,
			);
			if (vr && !vr.ok) {
				for (const issue of vr.issues.slice(0, 5)) {
					log(
						`    [${issue.severity}] ${issue.code} @ ${issue.path?.join(".") ?? "-"}: ${truncate(issue.message, 100)}`,
					);
				}
				if (vr.issues.length > 5) log(`    ... +${vr.issues.length - 5} more`);
			}
			if (a.retryHints) {
				for (const hint of a.retryHints) {
					log(
						`    retry scope=${hint.scope} targets=[${hint.targetIds.join(",")}] issues=${hint.issues.length}`,
					);
				}
			}
		}
	}

	// 3. Final Composition decisions
	if (result.composition) {
		log("");
		log(`─── 3. COMPOSITION decisions (${result.composition.decisions.length}) ───`);
		for (const d of result.composition.decisions) {
			log(`  ${formatDecision(d)}`);
		}
	}

	// 4. Decorate attempts + final
	if (result.decorate) {
		log("");
		log(`─── 4. DECORATE (${result.decorate.attempts.length} attempts) ───`);
		for (const a of result.decorate.attempts) {
			const vr = a.validatorResult;
			log(
				`  attempt #${a.attempt}: parseIssues=${a.parseIssues.length} validator=${vr ? (vr.ok ? "ok" : `fail(${vr.issues.length})`) : "n/a"}`,
			);
			if (vr && !vr.ok) {
				for (const issue of vr.issues.slice(0, 5)) {
					log(
						`    [${issue.severity}] ${issue.code} @ ${issue.path?.join(".") ?? "-"}: ${truncate(issue.message, 100)}`,
					);
				}
			}
		}
	}
	if (result.decorated) {
		const d = result.decorated;
		log("");
		log(`─── 4b. DECORATED final ───`);
		log(`  screen → ${formatVerification(d.screen)}`);
		for (const [areaId, v] of Object.entries(d.areas)) {
			log(`  area[${areaId}] → ${formatVerification(v)}`);
		}
		const decisionCount = Object.keys(d.decisions ?? {}).length;
		if (decisionCount > 0) log(`  decisions=${decisionCount} verified`);
	}

	// 5. Materialized rows
	if (result.materialized) {
		const m = result.materialized;
		log("");
		log(`─── 5. MATERIALIZED ───`);
		log(
			`  screens=${m.screens.length} areas=${m.areas.length} components=${m.components.length} warnings=${m.warnings.length}`,
		);
		for (const s of m.screens) {
			const regions = Object.entries(s.screen.regions)
				.map(([k, v]) => `${k}(${v.children.length})`)
				.join(" ");
			log(`    screen ${s.id} variant=${s.screenVariantId} regions: ${regions}`);
		}
		for (const a of m.areas) {
			log(
				`    area ${a.id} type=${a.type} pattern=${a.pattern?.id ?? "-"} children=${a.children.length}`,
			);
		}
		for (const c of m.components) {
			log(`    comp ${c.id} type=${c.type}`);
		}
	}

	if (result.issues.length > 0) {
		log("");
		log(`─── ISSUES (${result.issues.length}) ───`);
		for (const issue of result.issues.slice(0, 10)) {
			log(`  [${issue.severity}] ${issue.code}: ${truncate(issue.message, 120)}`);
		}
	}

	// 디스크 산출물
	writeJson(`${outDir}/00-input.json`, {
		target,
		importJobId,
		deckVersions: {
			catalog: catalogDeck.version,
			design: designDeck.version,
			layout: layoutPatternStoreDeck.version,
		},
		elapsedSeconds: Number(elapsed),
		stage: result.stage,
		ok: result.ok,
	});
	writeJson(`${outDir}/01-register.json`, result.register ?? null);
	writeJson(`${outDir}/02-compose.json`, result.compose ?? null);
	writeJson(`${outDir}/03-decorate.json`, result.decorate ?? null);
	writeJson(`${outDir}/04-materialized.json`, result.materialized ?? null);
	writeFileSync(`${outDir}/summary.txt`, `${summary.join("\n")}\n`);

	log("");
	log(`[out] ${outDir}`);

	// Promote: materialized → ai-imports candidate → database/tables/*.json
	if (promote && result.materialized) {
		log("");
		log("─── PROMOTE → database/tables/ ───");

		const candidatePath = resolve(
			ROOT,
			"database/ai-imports",
			`${stem.toLowerCase()}.materialized.json`,
		);
		mkdirSync(resolve(ROOT, "database/ai-imports"), { recursive: true });
		writeFileSync(candidatePath, JSON.stringify(result.materialized, null, 2));
		log(`  candidate: ${candidatePath}`);

		const promoteResult = promoteDatabaseTablesCandidate(result.materialized, {
			patternStore: loadPatternStore(),
		});
		const promoteErrors = errorsOf(promoteResult);
		const promoteWarnings = warningsOf(promoteResult);

		if (!promoteResult.ok || !promoteResult.data) {
			log(`  promote FAILED: ${promoteErrors.length} errors`);
			for (const issue of promoteErrors.slice(0, 10)) {
				log(`    [${issue.code}] ${issue.message}`);
			}
			return;
		}

		const tablesDir = resolve(ROOT, "database/tables");
		mkdirSync(tablesDir, { recursive: true });
		for (const [filename, payload] of Object.entries(promoteResult.data)) {
			writeFileSync(`${tablesDir}/${filename}`, `${JSON.stringify(payload, null, "\t")}\n`);
		}
		log(`  wrote ${Object.keys(promoteResult.data).length} files to ${tablesDir}`);
		log(`  warnings=${promoteWarnings.length} errors=${promoteErrors.length}`);
		for (const issue of promoteWarnings.slice(0, 5)) {
			log(`    [warn ${issue.code}] ${issue.message}`);
		}

		log("");
		log("─── 미리보기 ───");
		log("  pnpm dev    # apps/web 띄우고 http://localhost:3000 에서 확인");
		log("  git diff --stat database/tables/   # LLM 출력 vs 베이스라인 비교");
		log("  git restore database/tables/       # 원복");
	}
}

function writeJson(path: string, data: unknown) {
	writeFileSync(path, JSON.stringify(data, null, 2));
}

function truncate(s: string | undefined, n: number): string {
	if (!s) return "";
	return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function formatDecision(d: CompositionDecision): string {
	const sel = d.selection;
	let ref: string;
	switch (sel.mode) {
		case "reuse-primitive":
			ref = `prim:${sel.primitiveId}${sel.variant ? `/${sel.variant}` : ""}`;
			break;
		case "reuse-pattern":
			ref = `pat:${sel.componentPatternId}${sel.variant ? `/${sel.variant}` : ""}`;
			break;
		case "propose-pattern":
			ref = `propose:${sel.proposedComponentPatternId}`;
			break;
		case "report-gap":
			ref = `gap:${sel.gapReportId}`;
			break;
	}
	return `${d.id} [${d.mode}] ${ref} → ${truncate(d.intent, 50)}`;
}

function formatVerification(v: {
	verdict: string;
	finalDraft?: { layoutPatternId: string; variant?: string };
	originalDraft?: { layoutPatternId: string; variant?: string };
}): string {
	const final = v.finalDraft;
	const fid = final ? `${final.layoutPatternId}${final.variant ? `/${final.variant}` : ""}` : "-";
	if (v.verdict !== "accepted" && v.originalDraft) {
		const od = v.originalDraft;
		return `[${v.verdict}] ${fid} (was ${od.layoutPatternId}${od.variant ? `/${od.variant}` : ""})`;
	}
	return `[${v.verdict}] ${fid}`;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
