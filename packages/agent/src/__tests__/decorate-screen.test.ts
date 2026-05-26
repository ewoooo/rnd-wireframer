import type {
	CatalogDeck,
	CompositionOutput,
	DecoratedOutput,
	DesignDeck,
	LayoutPatternStoreDeck,
	PrddScreenRecord,
} from "@cx/types";
import { describe, expect, it, vi } from "vitest";

import {
	type DecorateScreenInput,
	decorateScreen,
	type LlmQueryFn,
} from "../decorate-screen/decorate-screen";
import type { RunClaudeQueryResult } from "../llm/claude-session";

function makeInput(): DecorateScreenInput {
	const catalogDeck: CatalogDeck = {
		builtAt: "t",
		version: "1",
		primitives: [],
		componentPatterns: { registered: [], proposed: [] },
	};
	const designDeck: DesignDeck = {
		builtAt: "t",
		version: "1",
		documents: [
			{ id: "COMPOSITION_LAYERS.md", title: "", responsibility: "", rules: [] },
			{ id: "LAYOUT_SPACING_CONTRACT.md", title: "", responsibility: "", rules: [] },
		],
	};
	const layoutPatternStoreDeck: LayoutPatternStoreDeck = {
		builtAt: "t",
		version: "1",
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
			{ id: "area-grid", name: "", description: "", variants: ["default"], appliesTo: ["area"] },
		],
	};
	const prddScreenRecord: PrddScreenRecord = {
		level: "screen",
		id: "SCR",
		name: "",
		order: 1,
		screenType: "screen.page",
		description: "",
		importJobId: "j",
		states: [],
		flow: [],
		policyGroups: [],
		useCases: [],
		features: [],
		areas: [],
	};
	const composition: CompositionOutput = {
		kind: "composition-output",
		schemaVersion: "1",
		source: {
			screenId: "SCR",
			registeredSchemaVersion: "j",
			catalogDeckVersion: "1",
			designDeckVersion: "1",
			layoutPatternStoreDeckVersion: "1",
		},
		screen: {
			screenId: "SCR",
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
				sourceRefs: [{ screenId: "SCR", areaId: "a1", reason: "" }],
				compositionAction: "preserve-source-area",
				slot: "contents",
				role: "summary",
				intent: "",
				visualIntent: "primary",
				order: 1,
				decisionIds: [],
				layoutPatternDraft: {
					layoutPatternId: "area-vertical-list",
					variant: "default",
					reasons: ["vertical"],
					confidence: "high",
				},
				designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "" }],
			},
		],
		decisions: [],
		proposedComponentPatterns: [],
		gapReports: [],
		warnings: [],
	};
	return { composition, catalogDeck, designDeck, layoutPatternStoreDeck, prddScreenRecord };
}

function makeAcceptedDecorated(): DecoratedOutput {
	return {
		kind: "decorated-output",
		schemaVersion: "1",
		source: { composedScreenId: "SCR", composedSchemaVersion: "1", decorateModel: "test" },
		screen: {
			verdict: "accepted",
			finalLayoutPattern: { layoutPatternId: "screen-route", variant: "default" },
			reasons: ["fits source draft"],
		},
		areas: {
			a1: {
				verdict: "accepted",
				finalLayoutPattern: { layoutPatternId: "area-vertical-list", variant: "default" },
				reasons: ["fits source draft"],
			},
		},
		decisions: {},
	};
}

function makeBadDecorated(): DecoratedOutput {
	// area-1 verdict는 accepted 인데 finalLayoutPattern을 변경 → 모순
	return {
		...makeAcceptedDecorated(),
		areas: {
			a1: {
				verdict: "accepted",
				finalLayoutPattern: { layoutPatternId: "area-grid", variant: "default" },
				reasons: ["different from source"],
			},
		},
	};
}

function makeQueryResultFromOutput(output: DecoratedOutput): RunClaudeQueryResult {
	return {
		structured: output,
		rawResult: JSON.stringify(output),
		sessionId: "test",
		numTurns: 1,
	};
}

describe("decorateScreen", () => {
	it("happy path: 첫 시도에서 Validator 통과", async () => {
		const queryFn: LlmQueryFn = vi
			.fn()
			.mockResolvedValueOnce(makeQueryResultFromOutput(makeAcceptedDecorated()));

		const result = await decorateScreen(makeInput(), { queryFn });
		expect(result.ok).toBe(true);
		expect(result.output?.kind).toBe("decorated-output");
		expect(result.attempts).toHaveLength(1);
	});

	it("Validator 실패 시 재시도, 좋은 출력으로 회복", async () => {
		const queryFn: LlmQueryFn = vi
			.fn()
			.mockResolvedValueOnce(makeQueryResultFromOutput(makeBadDecorated()))
			.mockResolvedValueOnce(makeQueryResultFromOutput(makeAcceptedDecorated()));

		const result = await decorateScreen(makeInput(), { queryFn, maxRetries: 1 });
		expect(result.ok).toBe(true);
		expect(result.attempts).toHaveLength(2);
		expect(result.attempts[0].retryHints?.length).toBeGreaterThan(0);

		const retryPrompt = (queryFn as ReturnType<typeof vi.fn>).mock.calls[1][0].prompt as string;
		expect(retryPrompt).toContain("layout-pattern.verification.change-unjustified");
		expect(retryPrompt).toContain("Compose 원본 layoutPatternDraft");
		expect(retryPrompt).toContain("Layout Pattern Store");
		expect(retryPrompt).toContain("originalDraft");
	});

	it("maxRetries 후에도 실패면 ok=false", async () => {
		const queryFn: LlmQueryFn = vi
			.fn()
			.mockResolvedValue(makeQueryResultFromOutput(makeBadDecorated()));

		const result = await decorateScreen(makeInput(), { queryFn, maxRetries: 1 });
		expect(result.ok).toBe(false);
		expect(result.attempts).toHaveLength(2);
		expect(result.output).toBeDefined();
	});

	it("schema 위반 (kind 다름) 은 parse 단계에서 schema.invalid", async () => {
		const queryFn: LlmQueryFn = vi.fn().mockResolvedValue({
			structured: { kind: "wrong" },
			rawResult: "{}",
			sessionId: "test",
			numTurns: 1,
		} satisfies RunClaudeQueryResult);

		const result = await decorateScreen(makeInput(), { queryFn, maxRetries: 0 });
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "schema.invalid")).toBe(true);
	});
});
