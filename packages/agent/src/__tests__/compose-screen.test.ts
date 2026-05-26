import type {
	CatalogDeck,
	CompositionOutput,
	DesignDeck,
	LayoutPatternStoreDeck,
	PrddScreenRecord,
} from "@cx/types";
import { describe, expect, it, vi } from "vitest";

import {
	type ComposeScreenInput,
	composeScreen,
	type LlmQueryFn,
} from "../compose-screen/compose-screen";
import { parseCompositionOutput } from "../compose-screen/parse-output";
import { buildArchetypeScaffold } from "../compose-screen/scaffold";
import type { RunClaudeQueryResult } from "../llm/claude-session";

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
	return { catalogDeck, designDeck, layoutPatternStoreDeck };
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
		expect(scaffold.requiredBlocks).toContain("hero-summary");
		expect(scaffold.requiredBlocks).toContain("primary-action");
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
