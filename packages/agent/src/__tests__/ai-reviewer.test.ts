import { describe, expect, it } from "vitest";
import { aiReviewDesignTree, type AiReviewRunner } from "../design-review/ai-reviewer";
import { applyDesignReview } from "../design-review/apply-design-review";
import type { DecoratedNodeTree } from "../types";

/**
 * NOVA-MBR-FP-001-0(약관 동의) 회귀 픽스처.
 *
 * 두 가지 결손을 가진 client-import 화면을 흉내낸다:
 *  1) header region이 비어 있어 AppBar가 없음
 *  2) "다음" CTA(action-area-next)가 약관 동의 organism(area)에 묻혀 있음
 *
 * AI runner를 mock으로 주입해 createComponent + moveComponent operations를 반환하게
 * 하고, `applyDesignReview`까지 거친 reviewed 트리가 의도대로 슬롯팅되는지 검증.
 */

function makeNovaTerm001Tree(): DecoratedNodeTree {
	return {
		routes: [{ id: "r1", children: [{ variantId: "v1" }], pattern: { id: "route", variant: "default" } }],
		variants: [
			{
				id: "v1",
				routeId: "r1",
				children: [{ screenId: "NOVA-MBR-FP-001-0" }],
				pattern: { id: "variant", variant: "default" },
			},
		],
		screens: [
			{
				id: "NOVA-MBR-FP-001-0",
				name: "약관 동의",
				order: 1,
				variantId: "v1",
				children: {
					header: [],
					contents: [{ areaId: "ogn-mbr-term-agree", order: 1 }],
					bottom: [],
				},
				pattern: { id: "screen-shell", variant: "default" },
			},
		],
		areas: [
			{
				level: "area",
				id: "ogn-mbr-term-agree",
				name: "약관 동의",
				order: 1,
				children: [
					{ componentId: "checkbox-all-agree", order: 1 },
					{ componentId: "checkbox-term-required", order: 2 },
					{ componentId: "action-area-next", order: 3 },
				],
				pattern: { id: "checkbox-stack", variant: "default" },
			},
		],
		components: [
			{
				id: "checkbox-all-agree",
				name: "전체 동의",
				order: 1,
				type: "checkbox",
				props: { label: "전체 동의" },
				pattern: { id: "checkbox", variant: "default" },
			},
			{
				id: "checkbox-term-required",
				name: "필수 약관",
				order: 2,
				type: "checkbox",
				props: { label: "필수 약관" },
				pattern: { id: "checkbox", variant: "default" },
			},
			{
				id: "action-area-next",
				name: "다음 버튼",
				order: 3,
				type: "action-area",
				props: { primaryLabel: "다음" },
				hooks: [{ trigger: "onClick", action: "navigate", target: "NOVA-MBR-FP-002-0" }],
				pattern: { id: "action-area", variant: "default" },
			},
		],
		warnings: [],
	};
}

function makeRunnerWithOperations(operations: unknown[]): AiReviewRunner {
	return async () => ({
		structured: { operations },
		rawResult: JSON.stringify({ operations }),
		sessionId: "test-session",
		numTurns: 1,
	});
}

describe("aiReviewDesignTree (NOVA-MBR-FP-001-0 fixture)", () => {
	it("relays createComponent + moveComponent operations through the schema parser", async () => {
		const runner = makeRunnerWithOperations([
			{
				operation: "createComponent",
				id: "op-create-appbar",
				priority: "P1",
				rationale: "Header region is empty; synthesize app-bar for page surface.",
				designReferences: [
					{
						path: "docs/design/COMPOSITION_LAYERS.md",
						rationale: "Page screens must expose chrome region.",
					},
				],
				component: {
					id: "appbar-nova-mbr-fp-001-0",
					name: "약관 동의 AppBar",
					type: "AppBar",
					props: { title: "약관 동의", showBack: true },
					pattern: { id: "screen-header-chrome", variant: "default" },
				},
				insertInto: {
					screenId: "NOVA-MBR-FP-001-0",
					screenRegion: "header",
					placement: "last",
				},
				source: "tree-context",
			},
			{
				operation: "moveComponent",
				id: "op-move-cta",
				priority: "P0",
				rationale: "action-area-next is a screen CTA; relocate to bottom region.",
				designReferences: [
					{
						path: "docs/design/INTERACTION_PATTERNS.md",
						section: "CTA",
						rationale: "Primary actions belong to the screen bottom slot.",
					},
				],
				componentId: "action-area-next",
				from: { areaId: "ogn-mbr-term-agree", componentId: "action-area-next" },
				to: {
					screenId: "NOVA-MBR-FP-001-0",
					screenRegion: "bottom",
					placement: "last",
				},
			},
		]);

		const result = await aiReviewDesignTree(makeNovaTerm001Tree(), { runner });
		expect(result.skippedOperations).toEqual([]);
		expect(result.designReview.operations.map((op) => op.operation)).toEqual([
			"createComponent",
			"moveComponent",
		]);
	});

	it("after applyDesignReview, AppBar lands in header and CTA lands in bottom", async () => {
		const runner = makeRunnerWithOperations([
			{
				operation: "createComponent",
				id: "op-create-appbar",
				priority: "P1",
				rationale: "Header empty.",
				designReferences: [
					{
						path: "docs/design/COMPOSITION_LAYERS.md",
						rationale: "Page screens need chrome.",
					},
				],
				component: {
					id: "appbar-nova-mbr-fp-001-0",
					name: "약관 동의 AppBar",
					type: "AppBar",
					props: { title: "약관 동의", showBack: true },
					pattern: { id: "screen-header-chrome", variant: "default" },
				},
				insertInto: {
					screenId: "NOVA-MBR-FP-001-0",
					screenRegion: "header",
					placement: "last",
				},
				source: "tree-context",
			},
			{
				operation: "moveComponent",
				id: "op-move-cta",
				priority: "P0",
				rationale: "Screen CTA.",
				designReferences: [
					{
						path: "docs/design/INTERACTION_PATTERNS.md",
						section: "CTA",
						rationale: "Primary actions go to bottom.",
					},
				],
				componentId: "action-area-next",
				from: { areaId: "ogn-mbr-term-agree", componentId: "action-area-next" },
				to: {
					screenId: "NOVA-MBR-FP-001-0",
					screenRegion: "bottom",
					placement: "last",
				},
			},
		]);

		const tree = makeNovaTerm001Tree();
		const review = await aiReviewDesignTree(tree, { runner });
		const applied = applyDesignReview(tree, review.designReview);

		const screen = applied.reviewed.screens.find((s) => s.id === "NOVA-MBR-FP-001-0");
		expect(screen).toBeDefined();

		// Diagnostic: confirm both operations applied (not skipped).
		expect(applied.skippedOperations).toEqual([]);
		expect(applied.appliedOperationIds.sort()).toEqual(["op-create-appbar", "op-move-cta"]);

		// AppBar in header
		const headerChildren = screen?.children.header ?? [];
		const appbar = applied.reviewed.components.find((c) => c.id === "appbar-nova-mbr-fp-001-0");
		expect(appbar?.type).toBe("AppBar");
		// header should reference some area that contains AppBar; the exact wrapper area
		// is up to applyDesignReview's synthetic-region contract.
		expect(headerChildren.length).toBeGreaterThan(0);

		// CTA out of organism area
		const termArea = applied.reviewed.areas.find((a) => a.id === "ogn-mbr-term-agree");
		expect(termArea?.children.map((c) => c.componentId)).not.toContain("action-area-next");

		// CTA in bottom
		const bottomChildren = screen?.children.bottom ?? [];
		expect(bottomChildren.length).toBeGreaterThan(0);
	});

	it("schema-invalid operations are skipped with reasons but valid ones still flow", async () => {
		const runner = makeRunnerWithOperations([
			{
				operation: "moveComponent",
				id: "op-bad",
				priority: "P2",
				rationale: "Missing required from/to.",
				designReferences: [
					{
						path: "docs/design/INTERACTION_PATTERNS.md",
						rationale: "—",
					},
				],
				componentId: "x",
			},
			{
				operation: "moveComponent",
				id: "op-good",
				priority: "P1",
				rationale: "Move CTA.",
				designReferences: [
					{
						path: "docs/design/INTERACTION_PATTERNS.md",
						section: "CTA",
						rationale: "Primary actions go to bottom.",
					},
				],
				componentId: "action-area-next",
				from: { areaId: "ogn-mbr-term-agree", componentId: "action-area-next" },
				to: {
					screenId: "NOVA-MBR-FP-001-0",
					screenRegion: "bottom",
					placement: "last",
				},
			},
		]);

		const review = await aiReviewDesignTree(makeNovaTerm001Tree(), { runner });
		expect(review.skippedOperations.length).toBe(1);
		expect(review.skippedOperations[0]?.index).toBe(0);
		expect(review.designReview.operations.map((op) => op.id)).toEqual(["op-good"]);
	});
});
