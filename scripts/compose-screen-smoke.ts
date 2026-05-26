/**
 * Compose LLM #1 통합 스모크.
 *
 * Register 단계가 아직 없으므로 PrddScreenRecord 를 손으로 하나 만들어 본 호출만 검증한다.
 * 출력은 database/ai-imports/compose-screen-smoke-output.json 으로 떨굼.
 *
 * 사용: pnpm tsx scripts/compose-screen-smoke.ts
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
	CatalogDeck,
	DesignDeck,
	LayoutPatternStoreDeck,
	PrddScreenRecord,
} from "@cx/types";

import { composeScreen } from "@cx/agent/compose-screen";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

async function loadJson<T>(path: string): Promise<T> {
	const raw = await readFile(path, "utf8");
	return JSON.parse(raw) as T;
}

function buildSamplePrddRecord(): PrddScreenRecord {
	// NOVA-PRDD-PG-001-0 "상품 상세 핵심 요약 탐색" 의 핵심 정보만 손으로 옮긴 최소 레코드.
	// Register 가 정식으로 만들 때까지 임시.
	return {
		level: "screen",
		id: "NOVA-PRDD-PG-001-0",
		name: "상품 상세 핵심 요약 탐색",
		order: 1,
		screenType: "screen.page",
		description:
			"고객이 상품명, 유형, 대표 가격, 핵심 혜택, 대상 조건을 조회하고 가입 가능 요약을 확인해 다음 탐색 기준을 판단한다.",
		importJobId: "smoke-job-001",
		states: [
			{
				state: "default",
				trigger: "화면 진입 정상",
				changes: [
					{
						areaRef: "영역 1",
						description: "상품 요약 카드·상태 배지·상품정보 목록 표시",
					},
				],
				action: "apiCall",
			},
			{
				state: "loading",
				trigger: "API 호출",
				changes: [{ areaRef: "영역 1", description: "skeleton 표시" }],
			},
			{
				state: "error",
				trigger: "상품 기준 정보 누락 또는 노출 제한 발생",
				changes: [
					{
						areaRef: "영역 1",
						description: "Callout 보완 필요·상담 경로 안내",
					},
				],
				action: "apiCall",
			},
		],
		flow: [
			{
				kind: "transition",
				targetScreenId: "NOVA-PRDD-PG-002-0",
				targetScreenName: "미디어·스펙·후기 이해",
				condition: "핵심 요약 탐색 결과가 성공·제한·보완 필요 중 하나로 확정 시",
				payload: "상품 ID, 상품군, 판매 상태, 판단 근거",
			},
			{
				kind: "case-branch",
				targetScreenId: "NOVA-PRDD-PG-001-1",
				targetScreenName: "상품 상세 핵심 요약 탐색-상품 기준 정보 누락",
				condition: "상품 기준 정보 누락",
				postProcess: "해당 섹션 숨기지 않고 보완 필요·상담 가능 경로 안내 후 화면 유지",
			},
		],
		policyGroups: ["PG-PRDD-SUMMARY-001", "PG-PRDD-TPL-001"],
		useCases: ["US-PRDD-CUS-001"],
		features: ["FN-PRDD-DTL-001"],
		areas: [
			{
				areaId: "area-0",
				order: 0,
				slot: "header",
				area: {
					level: "area",
					id: "area-0",
					name: "화면 상단 네비게이션",
					description: "AppBar",
					layout: "vertical",
					visibilityRuleRaw: "항상",
					visibilityRuleHint: { kind: "always" },
					serverControls: [],
					notes: [],
					children: [
						{
							primitiveId: null,
							semanticName: "AppBarHeaderTopNav",
							rawComponentId: "AppBar",
							variantHint: "WithBack",
							displayTextTemplate: "title: 상품 상세 핵심 요약 탐색",
							bindings: [{ origin: "static", ref: "-", description: "(static)" }],
							events: [
								{ trigger: "onClick", action: "navigate", target: "NOVA-PRDD-PG-001-0" },
							],
							notes: [],
							policyIds: [],
							order: 1,
						},
					],
				},
			},
			{
				areaId: "area-1",
				order: 1,
				slot: "contents",
				area: {
					level: "area",
					id: "area-1",
					name: "상품 요약·핵심 속성 표시 영역",
					description: "상품 요약 카드, 상태 배지, 원장 링크, 상품정보 목록",
					layout: "vertical",
					visibilityRuleRaw: "항상",
					visibilityRuleHint: { kind: "always" },
					serverControls: ["유형(노출 여부, 텍스트 내용)"],
					countMin: 1,
					countMax: 1,
					priority: 1,
					errorHandling: "오류 항목 미노출",
					notes: [
						"[정책:PI-PRDD-SUMMARY-001-01] 핵심 요약 — 상품명·이미지·유형·가격·할인유형·핵심 혜택·가입 가능성 중 최소 5개 상단 표시",
						"[정책:PI-PRDD-TPL-001-04] 공통 모듈 — 가격·구성·고시 정보 위치·명칭 유지",
						"[정책:PI-PRDD-TPL-001-01] 표준 섹션 — 핵심 요약·이용 조건 섹션 순서 유지",
					],
					children: [
						{
							primitiveId: null,
							semanticName: "CardSummaryProductSummary",
							rawComponentId: "CardSummary",
							variantHint: "text",
							displayTextTemplate: "title: {상품명}\nsubText: {상품 유형} / {대표 가격}",
							bindings: [
								{
									origin: "api",
									ref: "FN-PRDD-DTL-001",
									description: "고객용 상품 요약",
								},
								{
									origin: "policy",
									ref: "PI-PRDD-SUMMARY-001-01",
									description: "핵심 요약 항목",
								},
							],
							events: [],
							notes: ["[정책:PI-PRDD-SUMMARY-001-01] 핵심 요약 — 최소 5개 상단 표시"],
							policyIds: ["PI-PRDD-SUMMARY-001-01"],
							order: 1,
						},
						{
							primitiveId: null,
							semanticName: "BadgeProductStatus",
							rawComponentId: "Badge",
							variantHint: "blue",
							displayTextTemplate: "badge: {판매 상태}",
							bindings: [
								{ origin: "api", ref: "FN-PRDD-DTL-001", description: "판매 상태" },
							],
							events: [],
							notes: ["[정책:PI-PRDD-SUMMARY-001-01] 가입 가능성 강조"],
							policyIds: ["PI-PRDD-SUMMARY-001-01"],
							order: 2,
						},
						{
							primitiveId: null,
							semanticName: "ButtonTextUnderlineProductOriginNav",
							rawComponentId: "ButtonTextUnderline",
							variantHint: null,
							displayTextTemplate: "label: 상품정보 자세히 보기",
							bindings: [{ origin: "static", ref: "-", description: "(static)" }],
							events: [
								{ trigger: "onClick", action: "navigate", target: "NOVA-PRDD-PG-002-0" },
							],
							notes: ["[정책:PI-PRDD-TPL-001-04] 공통 모듈 — 위치·명칭 유지"],
							policyIds: ["PI-PRDD-TPL-001-04"],
							order: 3,
						},
						{
							primitiveId: null,
							semanticName: "ListTextProductInfo",
							rawComponentId: "ListText",
							variantHint: "on",
							displayTextTemplate: "title: {상품정보 항목}\nsubText: {항목 값}",
							bindings: [
								{
									origin: "api",
									ref: "FN-PRDD-DTL-001",
									description: "상품군별 필수 정보 표시 여부",
								},
								{
									origin: "policy",
									ref: "PI-PRDD-TPL-001-01",
									description: "표준 섹션 구성",
								},
							],
							events: [],
							notes: ["[정책:PI-PRDD-TPL-001-01] 표준 섹션 — 순서 유지"],
							policyIds: ["PI-PRDD-TPL-001-01"],
							order: 4,
						},
					],
				},
			},
		],
	};
}

async function main(): Promise<void> {
	const catalogDeck = await loadJson<CatalogDeck>(
		resolve(ROOT, "database/catalog/generated/catalog-deck.json"),
	);
	const designDeck = await loadJson<DesignDeck>(
		resolve(ROOT, "database/catalog/generated/design-deck.json"),
	);
	const layoutPatternStoreDeck = await loadJson<LayoutPatternStoreDeck>(
		resolve(ROOT, "database/catalog/generated/layout-pattern-store-deck.json"),
	);

	const prddScreenRecord = buildSamplePrddRecord();

	console.log("[smoke] composing screen", prddScreenRecord.id);
	console.log(
		`[smoke] decks: primitives=${catalogDeck.primitives.length}, layoutPatterns=${layoutPatternStoreDeck.patterns.length}, designDocs=${designDeck.documents.length}`,
	);

	const startedAt = Date.now();
	const result = await composeScreen(
		{ prddScreenRecord, catalogDeck, designDeck, layoutPatternStoreDeck },
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
		console.log(
			`[smoke] composition: ${result.output.decisions.length} decisions, ${result.output.areas.length} areas, ${result.output.proposedComponentPatterns.length} proposed patterns, ${result.output.gapReports.length} gap reports`,
		);
	}

	const outPath = resolve(ROOT, "database/ai-imports/compose-screen-smoke-output.json");
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(
		outPath,
		JSON.stringify(
			{
				input: prddScreenRecord,
				result,
				elapsedMs,
			},
			null,
			2,
		),
	);
	console.log(`[smoke] full output written to ${outPath}`);

	if (!result.ok) process.exitCode = 1;
}

main().catch((err) => {
	console.error("[smoke] FAILED");
	console.error(err);
	process.exitCode = 1;
});
