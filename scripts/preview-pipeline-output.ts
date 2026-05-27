/**
 * EXPERIMENTAL 2-STAGE PREVIEW RUNNER.
 *
 * 현재 코드의 experimental runPipeline(compose + decorate)을 실행한 뒤
 * database/tables/preview/ 로 떨궈 apps/web 가 볼 수 있게 한다.
 * 운영 tables 는 --overwrite 가 있을 때만 덮어쓴다.
 * 기본 active path는 run-draft-tables.ts를 사용한다.
 *
 * 사용: pnpm tsx scripts/preview-pipeline-output.ts [PRDD 경로] [--overwrite]
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline } from "@cx/agent/pipeline/experimental";
import type {
	CatalogDeck,
	DesignDeck,
	LayoutPatternStoreDeck,
	MaterializedNodeTree,
	PropValue,
} from "@cx/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PRDD_PATH = resolve(
	ROOT,
	"database/client-imports/PRDD/screen/NOVA-PRDD-PG-001-0.md",
);

async function loadJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const overwriteTables = args.includes("--overwrite");
	const prddArg = args.find((arg) => !arg.startsWith("--"));
	const prddPath = prddArg ? resolve(ROOT, prddArg) : DEFAULT_PRDD_PATH;
	const prddSource = await readFile(prddPath, "utf8");
	const importJobId = `pipeline-preview-${Date.now()}`;

	const [catalogDeck, designDeck, layoutPatternStoreDeck] = await Promise.all([
		loadJson<CatalogDeck>(resolve(ROOT, "database/generated-decks/catalog-deck.json")),
		loadJson<DesignDeck>(resolve(ROOT, "database/generated-decks/design-deck.json")),
		loadJson<LayoutPatternStoreDeck>(
			resolve(ROOT, "database/generated-decks/layout-pattern-store-deck.json"),
		),
	]);

	console.log(
		"[preview][experimental] 2-stage LLM preview runner. Active draft tables path: scripts/run-draft-tables.ts",
	);
	console.log(`[preview] running pipeline for ${prddPath}`);
	const startedAt = Date.now();
	const result = await runPipeline(
		{
			prddSource,
			catalogDeck,
			designDeck,
			layoutPatternStoreDeck,
			importJobId,
		},
		{ composeMaxRetries: 2, decorateMaxRetries: 2 },
	);
	const elapsedMs = Date.now() - startedAt;
	if (!result.ok || !result.materialized) {
		console.error(`[preview] pipeline failed at ${result.stage}`);
		for (const issue of result.issues.slice(0, 12)) {
			console.error(`  - ${issue.code}: ${issue.message}`);
		}
		for (const violation of result.invariantViolations.slice(0, 12)) {
			console.error(`  - ${violation.code}: ${violation.message}`);
		}
		process.exit(1);
	}

	const auditPath = resolve(ROOT, "database/ai-imports/pipeline-preview-output.json");
	await mkdir(dirname(auditPath), { recursive: true });
	await writeFile(auditPath, JSON.stringify({ result, elapsedMs }, null, 2));
	console.log(`[preview] pipeline done in ${elapsedMs}ms; audit written to ${auditPath}`);

	const m = result.materialized;
	applyPreviewSampleData(m);

	const previewDir = resolve(ROOT, "database/tables/preview");
	await mkdir(previewDir, { recursive: true });

	// route/variant 가 비어있으면 screen 으로부터 합성 (preview 용)
	const screens = m.screens ?? [];
	let routes = m.screenRoutes ?? [];
	let variants = m.screenVariants ?? [];
	if (screens.length > 0 && (routes.length === 0 || variants.length === 0)) {
		const s = screens[0];
		routes = [{ id: `${s.id}-route`, moduleId: "preview", name: s.id, order: 1, processId: null }];
		variants = [
			{
				id: s.screenVariantId ?? s.id,
				screenRouteId: routes[0].id,
				name: s.id,
				order: 1,
				variantType: "base",
				followUp: null,
			},
		];
		if (!s.screenVariantId) s.screenVariantId = variants[0].id;
	}

	const files: Record<string, unknown> = {
		"screen_routes.json": { screenRoutes: routes },
		"screen_variants.json": { screenVariants: variants },
		"screens.json": { screens },
		"areas.json": { areas: m.areas ?? [] },
		"components.json": { components: m.components ?? [] },
	};

	for (const [name, body] of Object.entries(files)) {
		await writeFile(resolve(previewDir, name), JSON.stringify(body, null, 2));
	}
	console.log(`[preview] written ${Object.keys(files).length} files to ${previewDir}`);

	if (overwriteTables) {
		const tablesDir = resolve(ROOT, "database/tables");
		const backupDir = resolve(ROOT, "database/tables/.backup-before-preview");
		await mkdir(backupDir, { recursive: true });
		for (const name of Object.keys(files)) {
			try {
				await copyFile(resolve(tablesDir, name), resolve(backupDir, name));
			} catch {
				/* 첫 실행 시 원본이 없을 수 있음 */
			}
			await writeFile(resolve(tablesDir, name), JSON.stringify(files[name], null, 2));
		}
		console.log(`[preview] overwrote database/tables/ (backup: ${backupDir})`);
	} else {
		console.log(
			"[preview] tip: re-run with --overwrite to put pipeline output into database/tables/",
		);
	}
}

const PREVIEW_SAMPLE_VALUES: Record<string, string> = {
	"{대표 가격}": "월 50,000원",
	"{상품 유형}": "Apple / 스마트폰",
	"{상품명}": "iPhone 16 Pro",
	"{상품정보 항목}": "혜택",
	"{항목 값}": "T 우주패스 제휴 혜택 제공",
	"{판매 상태}": "가입 가능",
};

function applyPreviewSampleData(materialized: MaterializedNodeTree): void {
	for (const component of materialized.components) {
		component.children = component.children.map((child) => ({
			...child,
			props: replaceTemplatesInRecord(child.props),
		}));
	}
}

function replaceTemplatesInRecord(record: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [key, replaceTemplateValue(value)]),
	);
}

function replaceTemplateValue(value: unknown): PropValue {
	if (typeof value === "string") {
		return Object.entries(PREVIEW_SAMPLE_VALUES).reduce(
			(text, [token, sample]) => text.replaceAll(token, sample),
			value,
		);
	}
	if (Array.isArray(value)) return value.map(replaceTemplateValue);
	if (value && typeof value === "object") {
		return replaceTemplatesInRecord(value as Record<string, unknown>) as PropValue;
	}
	return value as PropValue;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
