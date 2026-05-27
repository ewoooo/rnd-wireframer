import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import { describe, expect, it, vi } from "vitest";

import {
	type ComposeScreenInput,
	composeScreen,
	type LlmQueryFn,
} from "../compose-screen/compose-screen";
import { parseCompositionOutput } from "../compose-screen/parse-output";
import { buildArchetypeScaffold } from "../compose-screen/scaffold";
import type { RunClaudeQueryResult } from "../llm/claude-session";
import { buildSnapshotValidatorContext } from "../validate/rules/shared/deck-lookup";

function makeDecks(): Omit<ComposeScreenInput, "prddScreenRecord"> {
	const catalogDeck: CatalogDeck = {
		builtAt: "t",
		version: "1.0.0",
		primitives: [
			{
				id: "Badge",
				name: "Badge",
				description: "",
				props: [{ name: "label", contract: { type: "string", required: true, role: "label" } }],
				variants: ["default"],
				tokensExpected: [],
				exampleUsage: "",
			},
		],
		componentPatterns: { registered: [], proposed: [] },
	};
	const designDeck: DesignDeck = {
		builtAt: "t",
		version: "1.0.0",
		documents: [{ id: "COMPOSITION_LAYERS.md", title: "", responsibility: "", rules: [] }],
	};
	const layoutPatternStoreDeck: LayoutPatternStoreDeck = {
		builtAt: "t",
		version: "1.0.0",
		patterns: [
			{
				id: "screen-route",
				name: "",
				description: "",
				variants: ["default"],
				appliesTo: ["screen"],
			},
			{
				id: "area-vertical-list",
				name: "",
				description: "",
				variants: ["default"],
				appliesTo: ["area"],
			},
		],
	};
	return {
		catalogDeck,
		designDeck,
		layoutPatternStoreDeck,
		validationContext: buildSnapshotValidatorContext({
			catalogDeck,
			designDeck,
			layoutPatternStoreDeck,
		}),
	};
}

function makePrdd(): PrddScreenRecord {
	return {
		level: "screen",
		id: "SCR-1",
		name: "test",
		order: 1,
		screenType: "screen.page",
		description: "",
		importJobId: "job-1",
		states: [],
		flow: [],
		policyGroups: [],
		useCases: [],
		features: [],
		areas: [
			{
				areaId: "a1",
				order: 1,
				slot: "contents",
				area: {
					level: "area",
					id: "a1",
					name: "",
					description: "",
					layout: "vertical",
					visibilityRuleRaw: "always",
					serverControls: [],
					notes: [],
					children: [
						{
							primitiveId: "Badge",
							semanticName: "StatusBadge",
							rawComponentId: "Badge",
							variantHint: null,
							displayTextTemplate: "label: active",
							bindings: [],
							events: [],
							notes: [],
							policyIds: [],
							order: 1,
						},
					],
				},
			},
		],
	};
}

function makeValidOutput(): CompositionOutput {
	return {
		kind: "composition-output",
		schemaVersion: "1.0.0",
		source: {
			screenId: "SCR-1",
			registeredSchemaVersion: "job-1",
			catalogDeckVersion: "1.0.0",
			designDeckVersion: "1.0.0",
			layoutPatternStoreDeckVersion: "1.0.0",
		},
		screen: {
			screenId: "SCR-1",
			intent: "",
			primaryUserGoal: "",
			strategy: "detail-reading",
			archetype: "generic-detail",
			completeness: {
				requiredBlocks: ["navigation", "hero-summary", "primary-facts"],
				presentBlocks: ["hero-summary", "primary-facts"],
				syntheticBlocks: [],
				missingBlocks: [],
				omittedBlocks: [{ blockId: "navigation", reason: "not present in test fixture" }],
			},
			stateRefs: [],
			flowRefs: [],
			policyRefs: [],
			designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "" }],
			layoutPatternDraft: {
				layoutPatternId: "screen-route",
				variant: "default",
				reasons: ["default"],
				confidence: "high",
			},
		},
		areas: [
			{
				areaId: "a1",
				sourceAreaRef: "a1",
				sourceRefs: [{ screenId: "SCR-1", areaId: "a1", reason: "preserve" }],
				compositionAction: "preserve-source-area",
				slot: "contents",
				role: "summary",
				intent: "",
				visualIntent: "primary",
				order: 1,
				decisionIds: ["dec-1"],
				layoutPatternDraft: {
					layoutPatternId: "area-vertical-list",
					variant: "default",
					reasons: ["vertical"],
					confidence: "high",
				},
				designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "" }],
			},
		],
		decisions: [
			{
				id: "dec-1",
				mode: "reuse-primitive",
				sourceRef: {
					screenId: "SCR-1",
					areaId: "a1",
					componentRow: 1,
					semanticName: "StatusBadge",
					rawComponentId: "Badge",
				},
				sourceRefs: [
					{
						screenId: "SCR-1",
						areaId: "a1",
						componentRow: 1,
						semanticName: "StatusBadge",
						rawComponentId: "Badge",
						reason: "trace",
					},
				],
				target: { areaId: "a1", order: 1 },
				intent: "show status",
				rationale: "PRDD requires status badge",
				emphasis: "medium",
				policyRefs: [],
				stateRefs: [],
				selection: { mode: "reuse-primitive", primitiveId: "Badge" },
				props: { label: "active" },
				bindings: [],
				hooks: [],
			},
		],
		proposedComponentPatterns: [],
		gapReports: [],
		warnings: [],
	};
}

function makeQueryResultFromOutput(output: CompositionOutput): RunClaudeQueryResult {
	return {
		structured: output,
		rawResult: JSON.stringify(output),
		sessionId: "test",
		numTurns: 1,
	};
}

describe("composeScreen", () => {
	it("PRDD 어휘로 commerce-detail scaffold를 deterministic하게 고른다", () => {
		const record = makePrdd();
		record.name = "상품 상세";
		record.description = "상품 가격, 판매 상태, 혜택을 확인한다.";
		const scaffold = buildArchetypeScaffold(record);
		expect(scaffold.archetype).toBe("commerce-detail");
		expect(scaffold.requiredBlocks).toContain("hero-media");
		expect(scaffold.requiredBlocks).toContain("hero-summary");
		expect(scaffold.requiredBlocks).toContain("primary-action");
		expect(scaffold.optionalBlocks).toEqual(
			expect.arrayContaining([
				"price-summary",
				"price-accordion",
				"benefit-list",
				"delivery-info",
				"rich-image-tab",
				"product-more-link",
				"option-list",
				"coupon-benefit",
				"map-store-list",
				"brand-benefit-list",
				"product-disclosure",
				"option-grid",
				"disclosure-list",
				"sticky-cta",
				"bottom-cta",
			]),
		);
		expect(scaffold.allowedSyntheticBlocks).toEqual(["section-header", "divider"]);
	});

	it("Figma 상세 subtype 어휘를 commerce-detail로 분류하고 subtype optional block을 허용한다", () => {
		const cases = [
			{ name: "Page (상세-상품)", description: "상품 상세 화면에서 가격과 혜택을 확인한다." },
			{ name: "상세_단말기", description: "단말기 상세에서 배송 정보와 옵션을 고른다." },
			{ name: "상세_구독상품", description: "구독상품 상세에서 쿠폰 혜택과 약관을 확인한다." },
			{ name: "상세_기프티콘", description: "기프티콘 상세에서 사용처와 유의사항을 확인한다." },
			{ name: "상세_혜택브랜드", description: "혜택브랜드 상세에서 매장과 브랜드 혜택을 본다." },
		];

		for (const testCase of cases) {
			const record = makePrdd();
			record.name = testCase.name;
			record.description = testCase.description;
			const scaffold = buildArchetypeScaffold(record);
			expect(scaffold.archetype).toBe("commerce-detail");
			expect(scaffold.requiredBlocks).toEqual(
				expect.arrayContaining([
					"navigation",
					"hero-media",
					"hero-summary",
					"primary-facts",
					"primary-action",
				]),
			);
			expect(scaffold.optionalBlocks).toEqual(
				expect.arrayContaining([
					"price-accordion",
					"delivery-info",
					"rich-image-tab",
					"product-more-link",
					"option-list",
					"coupon-benefit",
					"map-store-list",
					"brand-benefit-list",
					"product-disclosure",
					"bottom-cta",
				]),
			);
		}
	});

	it("상품/가격/판매/혜택 계열 PRDD에 commerce-detail required block을 부여한다", () => {
		const cases = [
			"상품 정보와 판매 상태, 가격 및 혜택을 보여준다.",
			"구독 상품의 쿠폰 할인과 결제 정보를 확인한다.",
			"장바구니 주문 배송 옵션과 선물가를 검토한다.",
		];
		for (const description of cases) {
			const record = makePrdd();
			record.description = description;
			const scaffold = buildArchetypeScaffold(record);
			expect(scaffold.archetype).toBe("commerce-detail");
			expect(scaffold.requiredBlocks).toEqual(
				expect.arrayContaining([
					"navigation",
					"hero-media",
					"hero-summary",
					"primary-facts",
					"primary-action",
				]),
			);
			expect(scaffold.optionalBlocks).toEqual(
				expect.arrayContaining(["price-summary", "benefit-list", "sticky-cta"]),
			);
		}
	});

	it("상세 단독 어휘는 commerce-detail로 오탐하지 않는다", () => {
		const record = makePrdd();
		record.name = "공지 상세";
		record.description = "공지 내용을 확인한다.";
		const scaffold = buildArchetypeScaffold(record);
		expect(scaffold.archetype).toBe("confirmation");
		expect(scaffold.rationale[0]).toContain("확인");
	});

	it("리스트-텍스트 계열 PRDD에 list-browse scaffold와 텍스트 리스트 block을 부여한다", () => {
		const cases = [
			{
				name: "리스트_공지사항",
				description: "공지사항 목록을 검색하고 공지 제목과 등록일을 확인한다.",
				expectedBlocks: ["search-filter", "notice-list", "text-list"],
			},
			{
				name: "리스트_이용안내",
				description: "이용안내 리스트에서 안내 항목을 선택하고 상세 내용을 확인한다.",
				expectedBlocks: ["info-text-list", "accordion-list", "text-list"],
			},
			{
				name: "리스트_포인트내역",
				description: "포인트 내역을 월별 탭과 필터 칩으로 조회한다.",
				expectedBlocks: ["summary-card", "tab-filter", "filter-chip", "text-list"],
			},
			{
				name: "리스트_할인내역",
				description: "할인 내역을 기간 필터로 조회하고 사용 내역 목록을 확인한다.",
				expectedBlocks: ["summary-card", "search-filter", "filter-chip", "text-list"],
			},
		] satisfies Array<{
			name: string;
			description: string;
			expectedBlocks: Array<
				| "summary-card"
				| "search-filter"
				| "tab-filter"
				| "filter-chip"
				| "card-list"
				| "product-list"
				| "product-list-group"
				| "product-list-horizontal"
				| "product-list-row"
				| "text-list"
				| "info-text-list"
				| "notice-list"
				| "accordion-list"
			>;
		}>;

		for (const testCase of cases) {
			const record = makePrdd();
			record.name = testCase.name;
			record.description = testCase.description;
			const scaffold = buildArchetypeScaffold(record);
			expect(scaffold.archetype).toBe("list-browse");
			expect(scaffold.requiredBlocks).toEqual(
				expect.arrayContaining(["navigation", "list-results"]),
			);
			expect(scaffold.optionalBlocks).toEqual(expect.arrayContaining(testCase.expectedBlocks));
		}
	});

	it("카드/상품 리스트 탐색 PRDD를 list-browse로 분류하고 card/product list scaffold block을 허용한다", () => {
		const cases = [
			{
				name: "Page (리스트-카드)",
				description:
					"AppBar와 Chip, FilterSorting으로 상품 목록을 탐색하고 ProductListGroup에 ListProductHorizontal 카드를 반복한다.",
			},
			{
				name: "요금제 리스트",
				description: "요금제 목록을 필터와 정렬 조건으로 조회한다.",
			},
			{
				name: "단말기 목록",
				description: "단말기 리스트에서 제품 카드를 비교한다.",
			},
			{
				name: "요금제 목록",
				description: "요금제 목록에서 조건에 맞는 상품을 비교한다.",
			},
			{
				name: "구독상품 목록",
				description: "구독상품 리스트를 카드 형태로 탐색한다.",
			},
			{
				name: "혜택 목록",
				description: "혜택 리스트를 필터링해 확인한다.",
			},
			{
				name: "부가서비스 목록",
				description: "부가서비스 카드 목록에서 가입할 항목을 선택한다.",
			},
			{
				name: "인터넷 목록",
				description: "인터넷 상품 리스트를 정렬하고 비교한다.",
			},
		];

		for (const testCase of cases) {
			const record = makePrdd();
			record.name = testCase.name;
			record.description = testCase.description;
			const scaffold = buildArchetypeScaffold(record);
			expect(scaffold.archetype).toBe("list-browse");
			expect(scaffold.archetype).not.toBe("commerce-detail");
			expect(scaffold.optionalBlocks).toEqual(
				expect.arrayContaining([
					"filter-chip",
					"filter-sort",
					"card-list",
					"product-list",
					"product-list-group",
					"product-list-horizontal",
					"product-list-row",
				]),
			);
		}
	});

	it("내역/안내/할인 단어만으로 commerce-detail에 끌려가지 않는다", () => {
		const cases = [
			"포인트 내역을 조회한다.",
			"할인 내역과 이용 내역을 확인한다.",
			"이용안내 목록을 제공한다.",
		];
		for (const description of cases) {
			const record = makePrdd();
			record.description = description;
			const scaffold = buildArchetypeScaffold(record);
			expect(scaffold.archetype).toBe("list-browse");
			expect(scaffold.archetype).not.toBe("commerce-detail");
		}
	});

	it("happy path: 첫 시도에서 Validator 통과", async () => {
		const queryFn: LlmQueryFn = vi
			.fn()
			.mockResolvedValueOnce(makeQueryResultFromOutput(makeValidOutput()));

		const result = await composeScreen(
			{ prddScreenRecord: makePrdd(), ...makeDecks() },
			{ queryFn },
		);

		expect(result.ok).toBe(true);
		expect(result.output?.screen.screenId).toBe("SCR-1");
		expect(result.attempts).toHaveLength(1);
		expect(queryFn).toHaveBeenCalledTimes(1);
		const firstPrompt = (queryFn as ReturnType<typeof vi.fn>).mock.calls[0][0].prompt as string;
		expect(firstPrompt).toContain("Archetype Scaffold");
		expect(firstPrompt).toContain("generic-detail");
	});

	it("Validator 실패 시 좁은 재시도 prompt 가 RetryHints 를 담는다", async () => {
		const bad = makeValidOutput();
		// mode 와 selection.mode 를 어긋나게 만들어 hard error 유발
		(bad.decisions[0] as { mode: string }).mode = "reuse-pattern";
		const good = makeValidOutput();

		const queryFn: LlmQueryFn = vi
			.fn()
			.mockResolvedValueOnce(makeQueryResultFromOutput(bad))
			.mockResolvedValueOnce(makeQueryResultFromOutput(good));

		const result = await composeScreen(
			{ prddScreenRecord: makePrdd(), ...makeDecks() },
			{ queryFn, maxRetries: 1 },
		);

		expect(result.ok).toBe(true);
		expect(result.attempts).toHaveLength(2);
		expect(result.attempts[0].retryHints?.[0].scope).toBe("decision");

		// 2회 호출 (initial + 1 retry)
		expect(queryFn).toHaveBeenCalledTimes(2);
		// 2번째 prompt 에 위반 코드가 들어있어야 함
		const retryPrompt = (queryFn as ReturnType<typeof vi.fn>).mock.calls[1][0].prompt as string;
		expect(retryPrompt).toContain("composition.mode.mismatch");
	});

	it("maxRetries 한도 도달 후에도 실패면 ok=false 와 attempts 전부 반환", async () => {
		const bad = makeValidOutput();
		(bad.decisions[0] as { mode: string }).mode = "reuse-pattern";

		const queryFn: LlmQueryFn = vi.fn().mockResolvedValue(makeQueryResultFromOutput(bad));

		const result = await composeScreen(
			{ prddScreenRecord: makePrdd(), ...makeDecks() },
			{ queryFn, maxRetries: 2 },
		);

		expect(result.ok).toBe(false);
		expect(result.attempts).toHaveLength(3); // initial + 2 retries
		expect(result.issues.some((i) => i.code === "composition.mode.mismatch")).toBe(true);
		expect(result.output).toBeDefined(); // 마지막 시도의 (실패한) 출력은 보존
	});

	it("LLM 이 JSON 모양에 안 맞는 응답을 주면 schema.invalid 로 잡힌다", async () => {
		const queryFn: LlmQueryFn = vi.fn().mockResolvedValue({
			structured: { kind: "wrong-kind" },
			rawResult: "{}",
			sessionId: "test",
			numTurns: 1,
		} satisfies RunClaudeQueryResult);

		const result = await composeScreen(
			{ prddScreenRecord: makePrdd(), ...makeDecks() },
			{ queryFn, maxRetries: 0 },
		);

		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "schema.invalid")).toBe(true);
	});
});

describe("parseCompositionOutput", () => {
	it("문자열 JSON도 파싱한다", () => {
		const result = parseCompositionOutput(JSON.stringify(makeValidOutput()));
		expect(result.ok).toBe(true);
		expect(result.output?.kind).toBe("composition-output");
	});

	it("잘못된 JSON 문자열은 schema.invalid 로 보고한다", () => {
		const result = parseCompositionOutput("not json");
		expect(result.ok).toBe(false);
		expect(result.issues[0].code).toBe("schema.invalid");
	});
});
