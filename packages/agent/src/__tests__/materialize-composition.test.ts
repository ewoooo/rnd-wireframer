import type { CompositionOutput } from "@cx/types/composition-output";
import type { DecoratedOutput } from "@cx/types/decorated-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import { describe, expect, it } from "vitest";

import { materializeComposition } from "../database/materialize-composition";

function makeRecord(): PrddScreenRecord {
	return {
		level: "screen",
		id: "SCR",
		name: "test screen",
		order: 1,
		screenType: "screen.page",
		description: "desc",
		importJobId: "job-1",
		states: [],
		flow: [],
		policyGroups: [],
		useCases: [],
		features: [],
		areas: [],
	};
}

function makeComposition(): CompositionOutput {
	return {
		kind: "composition-output",
		schemaVersion: "1",
		source: {
			screenId: "SCR",
			registeredSchemaVersion: "job-1",
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
			archetypeChoice: {
				source: "catalog",
				archetype: "generic-detail",
				rationale: "test fixture: generic detail surface",
			},
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
				reasons: [],
				confidence: "high",
			},
		},
		areas: [
			{
				areaId: "a-header",
				sourceAreaRef: "0",
				sourceRefs: [{ screenId: "SCR", areaId: "a-header", reason: "" }],
				compositionAction: "preserve-source-area",
				slot: "header",
				role: "navigation",
				intent: "AppBar",
				visualIntent: "primary",
				order: 0,
				decisionIds: ["dec-appbar"],
				layoutPatternDraft: {
					layoutPatternId: "area-app-bar",
					variant: "with-back",
					reasons: [],
					confidence: "high",
				},
				designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "" }],
			},
			{
				areaId: "a-summary",
				sourceAreaRef: "1",
				sourceRefs: [{ screenId: "SCR", areaId: "a-summary", reason: "" }],
				compositionAction: "preserve-source-area",
				slot: "contents",
				role: "summary",
				intent: "summary",
				visualIntent: "primary",
				order: 1,
				decisionIds: ["dec-1"],
				layoutPatternDraft: {
					layoutPatternId: "area-vertical-list",
					variant: "default",
					reasons: [],
					confidence: "high",
				},
				designRefs: [{ document: "COMPOSITION_LAYERS.md", reason: "" }],
			},
		],
		decisions: [
			{
				id: "dec-appbar",
				mode: "reuse-primitive",
				sourceRef: { screenId: "SCR", areaId: "a-header" },
				sourceRefs: [{ screenId: "SCR", areaId: "a-header", reason: "" }],
				target: { areaId: "a-header", order: 1 },
				intent: "",
				rationale: "",
				emphasis: "medium",
				policyRefs: [],
				stateRefs: [],
				selection: { mode: "reuse-primitive", primitiveId: "AppBar", variant: "WithBack" },
				props: {},
				bindings: [],
				hooks: [],
			},
			{
				id: "dec-1",
				mode: "reuse-primitive",
				sourceRef: { screenId: "SCR", areaId: "a-summary" },
				sourceRefs: [{ screenId: "SCR", areaId: "a-summary", reason: "" }],
				target: { areaId: "a-summary", order: 1 },
				intent: "요약 카드 표시",
				rationale: "",
				emphasis: "medium",
				policyRefs: [],
				stateRefs: [],
				selection: { mode: "reuse-primitive", primitiveId: "CardSummary" },
				props: { title: "요약" },
				bindings: [],
				hooks: [{ trigger: "onClick", action: "navigate", target: "next" }],
			},
		],
		proposedComponentPatterns: [],
		gapReports: [],
		warnings: [],
	};
}

function makeDecorated(): DecoratedOutput {
	return {
		kind: "decorated-output",
		schemaVersion: "1",
		source: { composedScreenId: "SCR", composedSchemaVersion: "1", decorateModel: "test" },
		screen: {
			verdict: "accepted",
			finalLayoutPattern: { layoutPatternId: "screen-route", variant: "default" },
			reasons: ["ok"],
		},
		areas: {
			"a-header": {
				verdict: "accepted",
				finalLayoutPattern: { layoutPatternId: "area-app-bar", variant: "with-back" },
				reasons: ["ok"],
			},
			"a-summary": {
				verdict: "accepted",
				finalLayoutPattern: { layoutPatternId: "area-vertical-list", variant: "default" },
				reasons: ["ok"],
			},
		},
		decisions: {},
	};
}

describe("materializeComposition", () => {
	it("screen 1개 + 모든 slot의 area row + component 2개 row 생성", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		expect(tree.screens).toHaveLength(1);
		expect(tree.areas).toHaveLength(2);
		expect(tree.components).toHaveLength(2);
	});

	it("screen row 가 decorated screen pattern 으로 채워진다", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		expect(tree.screens[0].pattern).toEqual({ id: "screen-route", variant: "default" });
		expect(tree.screens[0].minRendererVersion).toBe("0.1.0");
		expect(tree.screens[0].patternId).toBeUndefined();
		expect(tree.screens[0].patternVariant).toBeUndefined();
	});

	it("header 슬롯 area 도 area row 로 보존되고 region 은 area 를 참조한다", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		const header = tree.screens[0].screen.regions.header;
		expect(header.children).toEqual([{ kind: "area", id: "a-header" }]);
		const headerArea = tree.areas.find((a) => a.id === "a-header");
		expect(headerArea?.pattern).toEqual({ id: "area-app-bar", variant: "with-back" });
		expect(headerArea?.children).toEqual([{ kind: "component", id: "dec-appbar" }]);
	});

	it("area intent 를 metadata.title 이나 표시 name 으로 승격하지 않는다", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		const headerArea = tree.areas.find((a) => a.id === "a-header");

		expect(headerArea?.metadata.title).toBe("header.navigation.a-header");
		expect(headerArea?.metadata.title).not.toBe("AppBar");
		expect(headerArea?.props).toEqual({});
	});

	it("명시 displayName 이 있는 area 만 표시 name 을 가진다", () => {
		const composition = makeComposition();
		composition.areas[1].displayName = "약관 목록";

		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition,
			decorated: makeDecorated(),
		});
		const summaryArea = tree.areas.find((a) => a.id === "a-summary");

		expect(summaryArea?.metadata.title).toBe("contents.summary.a-summary");
		expect(summaryArea?.props).toEqual({ name: "약관 목록" });
	});

	it("contents region 은 area 참조, area row 는 component id 참조", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		expect(tree.screens[0].screen.regions.contents.children).toEqual([
			{ kind: "area", id: "a-summary" },
		]);
		const areaRow = tree.areas.find((a) => a.id === "a-summary");
		expect(areaRow?.children).toEqual([{ kind: "component", id: "dec-1" }]);
	});

	it("decision-level verification 부재 시 selection type 기반 component pattern을 채운다", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		const comp = tree.components.find((c) => c.id === "dec-1");
		expect(comp?.pattern).toEqual({ id: "component-card-summary", variant: "default" });
		const appBar = tree.components.find((c) => c.id === "dec-appbar");
		expect(appBar?.pattern).toEqual({ id: "component-app-bar", variant: "default" });
	});

	it("screen pattern layoutProps 의 variant 힌트로 contents region pattern을 채운다", () => {
		const composition = makeComposition();
		composition.screen.intent = "리스트_단말기 상품 목록";
		const decorated = makeDecorated();
		decorated.screen.finalLayoutPattern = {
			layoutPatternId: "card-list-screen",
			variant: "default",
		};

		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition,
			decorated,
		});

		expect(tree.screens[0].screen.regions.contents.pattern).toEqual({
			id: "product-card-flat-row-list-content",
			variant: "default",
		});
	});

	it("decision props 를 leaf component child props 로 전달한다", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		const comp = tree.components.find((c) => c.id === "dec-1");
		expect(comp?.metadata.title).toBe("요약 카드 표시");
		expect(comp?.children).toEqual([
			{
				component: { type: "CardSummary" },
				props: { title: "요약" },
			},
		]);
	});

	it("hooks 가 component row 로 전달된다", () => {
		const tree = materializeComposition({
			prddScreenRecord: makeRecord(),
			composition: makeComposition(),
			decorated: makeDecorated(),
		});
		const comp = tree.components.find((c) => c.id === "dec-1");
		expect(comp?.hooks).toEqual([{ trigger: "onClick", action: "navigate", target: "next" }]);
	});
});
