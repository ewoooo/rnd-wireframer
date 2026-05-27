import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { DecoratedOutput } from "@cx/types/decorated-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import { describe, expect, it } from "vitest";

import { buildSnapshotValidatorContext } from "../validate/rules/shared/deck-lookup";
import { type ValidateDecoratedDeps, validateDecorated } from "../validate/validate-decorated";

function makeBase(): {
	composition: CompositionOutput;
	decorated: DecoratedOutput;
	deps: ValidateDecoratedDeps;
} {
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
			{
				id: "COMPOSITION_LAYERS.md",
				title: "",
				responsibility: "",
				rules: [],
			},
			{
				id: "LAYOUT_SPACING_CONTRACT.md",
				title: "",
				responsibility: "",
				rules: [],
			},
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
				variants: ["default", "scrollable"],
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
			{
				id: "area-app-bar",
				name: "앱바 헤더",
				description: "화면 상단 navigation AppBar 를 담는 area 레이아웃",
				variants: ["default", "with-back"],
				appliesTo: ["area"],
			},
			{
				id: "component-app-bar",
				name: "AppBar",
				description: "AppBar component composite",
				variants: ["default"],
				appliesTo: ["composite"],
			},
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
			registeredSchemaVersion: "1",
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

	const decorated: DecoratedOutput = {
		kind: "decorated-output",
		schemaVersion: "1",
		source: { composedScreenId: "SCR", composedSchemaVersion: "1", decorateModel: "test" },
		screen: {
			verdict: "accepted",
			finalLayoutPattern: { layoutPatternId: "screen-route", variant: "default" },
			reasons: ["verified default route"],
		},
		areas: {
			a1: {
				verdict: "accepted",
				finalLayoutPattern: { layoutPatternId: "area-vertical-list", variant: "default" },
				reasons: ["verified vertical"],
			},
		},
		decisions: {},
	};

	return {
		composition,
		decorated,
		deps: {
			catalogDeck,
			designDeck,
			layoutPatternStoreDeck,
			validationContext: buildSnapshotValidatorContext({
				catalogDeck,
				designDeck,
				layoutPatternStoreDeck,
			}),
			prddScreenRecord,
			composition,
		},
	};
}

describe("validateDecorated", () => {
	it("happy path: 모든 verification accepted, 통과", () => {
		const { decorated, deps } = makeBase();
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it("unknown layoutPatternId는 hard error", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.a1.finalLayoutPattern.layoutPatternId = "top-app-bar";
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		const issue = result.issues.find((i) => i.code === "layout-pattern.draft.unknown");
		expect(issue).toBeDefined();
		expect(issue?.data?.suggestions).toEqual(
			expect.arrayContaining([expect.objectContaining({ id: "area-app-bar" })]),
		);
	});

	it("node-kind 불호환 (screen 자리에 area 패턴)", () => {
		const { decorated, deps } = makeBase();
		decorated.screen.finalLayoutPattern.layoutPatternId = "area-vertical-list";
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "layout-pattern.node-kind.incompatible")).toBe(
			true,
		);
	});

	it("node-kind 불호환이면 같은 의미권의 올바른 layer 후보를 제안", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.a1.finalLayoutPattern.layoutPatternId = "component-app-bar";
		const result = validateDecorated(decorated, deps);
		const issue = result.issues.find((i) => i.code === "layout-pattern.node-kind.incompatible");
		expect(issue).toBeDefined();
		expect(issue?.data?.suggestions).toEqual(
			expect.arrayContaining([expect.objectContaining({ id: "area-app-bar" })]),
		);
		expect(result.retryHints?.[0]?.promptFragment).toContain("area-app-bar");
	});

	it("reasons 누락은 hard error", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.a1.reasons = [];
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		expect(
			result.issues.some((i) => i.code === "layout-pattern.verification.reasons-missing"),
		).toBe(true);
	});

	it("accepted인데 finalLayoutPattern이 draft와 다르면 모순", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.a1.finalLayoutPattern.layoutPatternId = "area-grid";
		// verdict는 여전히 "accepted"
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		expect(
			result.issues.some((i) => i.code === "layout-pattern.verification.change-unjustified"),
		).toBe(true);
	});

	it("overridden인데 3종 세트(originalDraft/reasons/designRefs) 누락은 위반", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.a1 = {
			verdict: "overridden",
			finalLayoutPattern: { layoutPatternId: "area-grid", variant: "default" },
			reasons: ["grid better"],
			// originalDraft, designRefs 누락
		};
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		const issue = result.issues.find(
			(i) => i.code === "layout-pattern.verification.change-unjustified",
		);
		expect(issue).toBeDefined();
		expect(issue?.data?.missing).toEqual(expect.arrayContaining(["originalDraft", "designRefs"]));
	});

	it("overridden + 3종 세트 모두 있으면 통과", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.a1 = {
			verdict: "overridden",
			finalLayoutPattern: { layoutPatternId: "area-grid", variant: "default" },
			originalDraft: {
				layoutPatternId: "area-vertical-list",
				variant: "default",
				reasons: ["vertical"],
				confidence: "high",
			},
			reasons: ["grid was a better fit due to 5+ items"],
			designRefs: [{ document: "LAYOUT_SPACING_CONTRACT.md", reason: "see section 3" }],
		};
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(true);
	});

	it("composed.area에 대응하는 decorated verification 누락은 hard error", () => {
		const { decorated, deps } = makeBase();
		delete (decorated.areas as Record<string, unknown>).a1;
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		expect(result.issues.some((i) => i.code === "layout-pattern.draft.missing")).toBe(true);
	});

	it("decorated.areas에 composed에 없는 areaId는 hard error", () => {
		const { decorated, deps } = makeBase();
		decorated.areas.ghost = {
			verdict: "accepted",
			finalLayoutPattern: { layoutPatternId: "area-vertical-list", variant: "default" },
			reasons: ["x"],
		};
		const result = validateDecorated(decorated, deps);
		expect(result.ok).toBe(false);
		expect(
			result.issues.some((i) => i.code === "layout-pattern.verification.change-unjustified"),
		).toBe(true);
	});
});
