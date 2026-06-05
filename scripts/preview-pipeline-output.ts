/**
 * pipeline-smoke 출력을 database/tables/preview/ 로 떼서 apps/web 가 볼 수 있게 한다.
 * 운영 tables 는 건드리지 않는다.
 *
 * 사용: pnpm tsx scripts/preview-pipeline-output.ts
 *      그다음 apps/web 의 loader 를 preview 디렉터리로 가리키거나, 임시로 운영 tables 를 덮어쓴다.
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { materializeComposition } from "@cx/agent/materialize-composition";
import type {
	CompositionOutput,
	DecoratedOutput,
	MaterializedNodeTree,
	PrddScreenRecord,
	PropValue,
} from "@cx/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

interface PipelinePreviewResult {
	composition?: CompositionOutput;
	decorated?: DecoratedOutput;
	materialized?: MaterializedNodeTree;
	prddScreenRecord?: PrddScreenRecord;
}

async function main(): Promise<void> {
	const overwriteTables = process.argv.includes("--overwrite");
	const src = resolve(ROOT, "database/ai-imports/pipeline-smoke-output.json");
	const data = JSON.parse(await readFile(src, "utf8"));
	const m = toPreviewMaterialized(data?.result);
	if (!m) {
		console.error("[preview] no materialized output");
		process.exit(1);
	}
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

function toPreviewMaterialized(result: PipelinePreviewResult | undefined) {
	if (result?.prddScreenRecord && result?.composition && result?.decorated) {
		return materializeComposition({
			prddScreenRecord: result.prddScreenRecord,
			composition: result.composition,
			decorated: result.decorated,
		});
	}
	return result?.materialized;
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
