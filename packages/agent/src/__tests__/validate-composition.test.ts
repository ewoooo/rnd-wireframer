import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { DecoratedOutput } from "@cx/types/decorated-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import { describe, expect, it } from "vitest";
import type { ValidatorDeps } from "../validate/types";
import { buildSnapshotValidatorContext } from "../validate/rules/shared/deck-lookup";
import { validateComposition } from "../validate/validate-composition";
import { validateDecorated } from "../validate/validate-decorated";

function makeDeps(): ValidatorDeps {
	const catalogDeck: CatalogDeck = {
		builtAt: "2026-01-01T00:00:00Z",
		version: "1.0.0",
		primitives: [
			{
				id: "Badge",
				name: "Badge",
				description: "small label",
				props: [
					{ name: "label", contract: { type: "string", required: true, role: "label" } },
					{
						name: "color",
						contract: { type: "string", role: "styleVariant", tokenRole: "color.text" },
					},
				],
				variants: ["default", "blue"],
				tokensExpected: ["color.text"],
				exampleUsage: "",
			},
		],
		componentPatterns: { registered: [], proposed: [] },
	};
	const designDeck: DesignDeck = {
		builtAt: "2026-01-01T00:00:00Z",
		version: "1.0.0",
		documents: [
			{
				id: "COMPOSITION_LAYERS.md",
				title: "Composition Layers",
				responsibility: "screen/area composition",
				rules: [],
			},
		],
	};
	const layoutPatternStoreDeck: LayoutPatternStoreDeck = {
		builtAt: "2026-01-01T00:00:00Z",
		version: "1.0.0",
		patterns: [
			{
				id: "screen-route",
				name: "screen-route",
				description: "default screen route",
				variants: ["default"],
				appliesTo: ["screen"],
			},
			{
				id: "area-vertical-list",
				name: "area-vertical-list",
				description: "vertical area",
				variants: ["default"],
				appliesTo: ["area"],
			},
		],
	};
	const prddScreenRecord: PrddScreenRecord = {
		level: "screen",
		id: "NOVA-TEST-001-0",
		name: "test",
		order: 1,
		screenType: "screen.page",
		description: "test screen",
		importJobId: "job-1",
		states: [],
		flow: [],
		policyGroups: [],
		useCases: [],
		features: [],
		areas: [
			{
				areaId: "area-1",
				order: 1,
				slot: "contents",
				area: {
					level: "area",
					id: "area-1",
					name: "area 1",
					description: "",
					layout: "vertical",
					visibilityRuleRaw: "항상",
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
	return {
		catalogDeck,
		designDeck,
		layoutPatternStoreDeck,
		validationContext: buildSnapshotValidatorContext({
			catalogDeck,
			designDeck,
			layoutPatternStoreDeck,
		}),
		prddScreenRecord,
	};
}

function makeOutput(overrides: Partial<CompositionOutput> = {}): CompositionOutput {
	const base: CompositionOutput = {
		kind: "composition-output",
		schemaVersion: "1.0.0",
		source: {
			screenId: "NOVA-TEST-001-0",
			registeredSchemaVersion: "1.0.0",
			catalogDeckVersion: "1.0.0",
			designDeckVersion: "1.0.0",
			layoutPatternStoreDeckVersion: "1.0.0",
		},
		screen: {
			screenId: "NOVA-TEST-001-0",
			intent: "test screen",
			primaryUserGoal: "verify validator",
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
			designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "test" }],
			layoutPatternDraft: {
				layoutPatternId: "screen-route",
				variant: "default",
				reasons: ["default route"],
				confidence: "high",
			},
		},
		areas: [
			{
				areaId: "area-1",
				sourceAreaRef: "area-1",
				sourceRefs: [{ screenId: "NOVA-TEST-001-0", areaId: "area-1", reason: "preserve" }],
				compositionAction: "preserve-source-area",
				slot: "contents",
				role: "summary",
				intent: "summary area",
				visualIntent: "primary",
				order: 1,
				decisionIds: ["dec-1"],
				layoutPatternDraft: {
					layoutPatternId: "area-vertical-list",
					variant: "default",
					reasons: ["vertical layout"],
					confidence: "high",
				},
				designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "test" }],
			},
		],
		decisions: [
			{
				id: "dec-1",
				mode: "reuse-primitive",
				sourceRef: { screenId: "NOVA-TEST-001-0", areaId: "area-1" },
				sourceRefs: [{ screenId: "NOVA-TEST-001-0", areaId: "area-1", reason: "trace" }],
				target: { areaId: "area-1", order: 1 },
				intent: "show status",
				rationale: "PRDD requires status badge",
				emphasis: "medium",
				policyRefs: [],
				stateRefs: [],
				selection: { mode: "reuse-primitive", primitiveId: "Badge", variant: "blue" },
				props: { label: "active", color: "color.text.brand" },
				bindings: [],
				hooks: [],
			},
		],
		proposedComponentPatterns: [],
		gapReports: [],
		warnings: [],
	};
	return { ...base, ...overrides };
}

function makeDecorated(overrides: Partial<DecoratedOutput> = {}): DecoratedOutput {
	const base: DecoratedOutput = {
		kind: "decorated-output",
		schemaVersion: "1.0.0",
		source: {
			composedScreenId: "NOVA-TEST-001-0",
			composedSchemaVersion: "1.0.0",
			decorateModel: "test",
		},
		screen: {
			verdict: "accepted",
			finalLayoutPattern: { layoutPatternId: "screen-route", variant: "default" },
			reasons: ["fits source draft"],
		},
		areas: {
			"area-1": {
				verdict: "accepted",
				finalLayoutPattern: { layoutPatternId: "area-vertical-list", variant: "default" },
				reasons: ["fits source draft"],
			},
		},
		decisions: {},
	};
	return { ...base, ...overrides };
}

describe("validateComposition", () => {
	it("happy path: 모든 룰을 통과한 출력은 ok=true", () => {
		const result = validateComposition(makeOutput(), makeDeps());
		expect(result.ok).toBe(true);
		expect(result.issues).toEqual([]);
		expect(result.retryHints).toBeUndefined();
	});

	it("mode mismatch는 hard error이고 decision-scope retryHint를 만든다", () => {
		const output = makeOutput();
		// 의도적으로 mode를 어긋나게 설정
		(output.decisions[0] as { mode: string }).mode = "reuse-pattern";
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "composition.mode.mismatch")).toBe(true);
		expect(result.retryHints?.[0].scope).toBe("decision");
		expect(result.retryHints?.[0].targetIds).toEqual(["dec-1"]);
	});

	it("unknown primitive는 hard error", () => {
		const output = makeOutput();
		output.decisions[0].selection = { mode: "reuse-primitive", primitiveId: "DoesNotExist" };
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "composition.primitive.unknown")).toBe(true);
	});

	it("screen.designRefs 비면 hard error, area.designRefs 비면 hard error", () => {
		const output = makeOutput();
		output.screen.designRefs = [];
		output.areas[0].designRefs = [];
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		const missing = result.issues.filter((i) => i.code === "composition.design-refs.missing");
		expect(missing.length).toBeGreaterThanOrEqual(2);
	});

	it("archetype scaffold required block이 설명되지 않으면 hard error", () => {
		const output = makeOutput();
		output.screen.completeness.omittedBlocks = [];
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "composition.completeness.missing-block")).toBe(
			true,
		);
	});

	it("decision.designRefs는 optional — 검사하지 않음", () => {
		const output = makeOutput();
		output.decisions[0].designRefs = undefined;
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(true);
	});

	it("layoutPatternDraft 누락은 hard error", () => {
		const output = makeOutput();
		output.areas[0].layoutPatternDraft = undefined as never;
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "layout-pattern.draft.missing")).toBe(true);
	});

	it("raw color hex를 tokenRole prop에 넣으면 token-role.violation", () => {
		const output = makeOutput();
		output.decisions[0].props = { label: "active", color: "#1A73E8" };
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "composition.token-role.violation")).toBe(true);
	});

	it("sourceRefs 내부 component 참조가 PRDD component와 매칭되지 않으면 hard error", () => {
		const output = makeOutput();
		output.decisions[0].sourceRefs = [
			{
				screenId: "NOVA-TEST-001-0",
				areaId: "area-1",
				componentRow: 99,
				reason: "bad component row",
			},
		];
		const result = validateComposition(output, makeDeps());
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "composition.source-ref.unknown-component")).toBe(
			true,
		);
	});

	it("Decorate가 draft를 변경할 때 originalDraft가 원 draft와 다르면 hard error", () => {
		const composition = makeOutput();
		const decorated = makeDecorated({
			areas: {
				"area-1": {
					verdict: "variant-adjusted",
					finalLayoutPattern: { layoutPatternId: "area-vertical-list" },
					originalDraft: {
						layoutPatternId: "area-vertical-list",
						variant: "other",
						reasons: ["different draft"],
						confidence: "low",
					},
					reasons: ["variant better matches design"],
					designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "test" }],
				},
			},
		});
		const result = validateDecorated(decorated, { ...makeDeps(), composition });
		expect(result.ok).toBe(false);
		expect(
			result.issues.some((i) => i.code === "layout-pattern.verification.change-unjustified"),
		).toBe(true);
		expect(
			result.issues.some(
				(i) => Array.isArray(i.data?.missing) && i.data.missing.includes("originalDraft-match"),
			),
		).toBe(true);
	});

	it("Decorate 변경 designRefs가 designDeck에 없으면 hard error", () => {
		const composition = makeOutput();
		const decorated = makeDecorated({
			areas: {
				"area-1": {
					verdict: "variant-adjusted",
					finalLayoutPattern: { layoutPatternId: "area-vertical-list" },
					originalDraft: composition.areas[0].layoutPatternDraft,
					reasons: ["variant better matches design"],
					designRefs: [{ document: "SECTION_PATTERNS.md", reason: "not in test deck" }],
				},
			},
		});
		const result = validateDecorated(decorated, { ...makeDeps(), composition });
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "composition.design-refs.missing")).toBe(true);
	});
});
