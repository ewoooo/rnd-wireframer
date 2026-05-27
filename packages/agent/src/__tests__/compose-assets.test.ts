import { describe, expect, it } from "vitest";

import { composeAssetContents } from "../compose/compose-assets";
import { registerAssets } from "../register/register-assets";
import type { GeneratedNodeTree } from "../types";

function makeInput(components: GeneratedNodeTree["components"]): GeneratedNodeTree {
	return {
		routes: [
			{
				id: "r1",
				variants: [{ id: "v1", screens: [{ id: "s1" }] }],
			},
		],
		components,
	};
}

function composeGenerated(input: GeneratedNodeTree) {
	return composeAssetContents(registerAssets(input));
}

describe("composeAssetContents", () => {
	it("leaves missing text-field label absent for AI Composer", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "text-field-user-id",
					type: "text-field",
					raw: { description: "아이디 입력" },
				},
			]),
		);

		expect(result.composed.components?.[0]).toMatchObject({
			description: "아이디 입력",
			props: {},
		});
		expect(result.filledComponentIds).toEqual([]);
	});

	it("leaves missing list-cell title absent", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "list-cell-term-required",
					type: "list-cell",
					raw: { description: "필수 약관 항목" },
				},
			]),
		);

		expect(result.composed.components?.[0]).toMatchObject({
			description: "필수 약관 항목",
			props: {},
		});
	});

	it("keeps concrete variant without adding pending message", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "section-message-input-error",
					type: "section-message",
					raw: { description: "입력 오류 안내", variant: "negative" },
				},
			]),
		);

		expect(result.composed.components?.[0].props).toEqual({ variant: "negative" });
	});

	it("extracts maxLength from raw.note without adding pending label", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "text-field-user-id",
					type: "text-field",
					raw: {
						description: "아이디 입력",
						note: "[정책:POL-MBR-INFO-002-04] 아이디 길이 -> max: 20",
					},
				},
			]),
		);

		expect(result.composed.components?.[0].props).toEqual({ maxLength: 20 });
	});

	it("ignores variant '-' as missing", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "list-cell-term-required",
					type: "list-cell",
					raw: { description: "필수 약관 항목", variant: "-" },
				},
			]),
		);

		expect(result.composed.components?.[0].props).toEqual({});
	});

	it("does not overwrite existing props", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "x",
					type: "text-field",
					props: { label: "preset" },
					raw: { description: "should be ignored" },
				},
			]),
		);

		expect(result.composed.components?.[0].props).toEqual({ label: "preset" });
		expect(result.filledComponentIds).toEqual([]);
	});

	it("skips components without raw", () => {
		const result = composeGenerated(makeInput([{ id: "x", type: "text-field" }]));

		expect(result.skipped).toEqual([{ componentId: "x", reason: "no raw" }]);
	});

	it("skips unknown types without a label key", () => {
		const result = composeGenerated(
			makeInput([{ id: "x", type: "mystery-widget", raw: { description: "안내" } }]),
		);

		expect(result.composed.components?.[0].props).toEqual({});
		expect(result.skipped).toEqual([{ componentId: "x", reason: "raw insufficient" }]);
	});

	it("normalizes content action-area components to button without pending label", () => {
		const result = composeGenerated(
			makeInput([
				{
					id: "action-area-next",
					type: "action-area",
					raw: { description: "다음 버튼 영역", variant: "strong" },
				},
			]),
		);

		expect(result.composed.components?.[0]).toMatchObject({
			id: "action-area-next",
			type: "button",
			props: { variant: "strong" },
		});
	});

	it("preserves area and component relationships in composed node tree", () => {
		const input: GeneratedNodeTree = {
			routes: [{ id: "r1", variants: [{ id: "v1", screens: [{ id: "s1" }] }] }],
			areas: [{ id: "o1", children: [{ componentId: "x" }] }],
			components: [{ id: "x", type: "text-field", raw: { description: "test" } }],
		};

		const result = composeGenerated(input);

		expect(result.composed.areas?.[0].children).toEqual([{ componentId: "x", order: 1 }]);
		expect(result.composed.components?.[0]).not.toHaveProperty("raw");
		expect(result.strippedComponentRawIds).toEqual(["x"]);
	});
});

describe("composeAssetContents - edge screen inheritance", () => {
	it("copies main screen areas to edge screens with empty areas", () => {
		const result = composeGenerated({
			routes: [
				{
					id: "r1",
					variants: [
						{
							id: "v1",
							screens: [
								{
									id: "FP-001-0",
									areas: [{ areaId: "ogn-term-list" }, { areaId: "ogn-term-agree" }],
								},
								{ id: "FP-001-E1" },
								{ id: "FP-001-E2", areas: [] },
							],
						},
					],
				},
			],
		});

		const firstEdge = result.composed.screens.find((screen) => screen.id === "FP-001-E1");
		const secondEdge = result.composed.screens.find((screen) => screen.id === "FP-001-E2");

		expect(firstEdge?.children.contents).toEqual([
			{ areaId: "ogn-term-list", order: 1 },
			{ areaId: "ogn-term-agree", order: 2 },
		]);
		expect(secondEdge?.children.contents).toEqual([
			{ areaId: "ogn-term-list", order: 1 },
			{ areaId: "ogn-term-agree", order: 2 },
		]);
		expect(result.inheritedEdgeScreenIds).toEqual(["FP-001-E1", "FP-001-E2"]);
	});

	it("does not overwrite edge screens that already declare areas", () => {
		const result = composeGenerated({
			routes: [
				{
					id: "r1",
					variants: [
						{
							id: "v1",
							screens: [
								{ id: "M-0", areas: [{ areaId: "ogn-a" }] },
								{ id: "M-E1", areas: [{ areaId: "ogn-custom" }] },
							],
						},
					],
				},
			],
		});

		const edge = result.composed.screens.find((screen) => screen.id === "M-E1");

		expect(edge?.children.contents).toEqual([{ areaId: "ogn-custom", order: 1 }]);
		expect(result.inheritedEdgeScreenIds).toEqual([]);
	});

	it("does nothing when main screen also has no areas", () => {
		const result = composeGenerated({
			routes: [
				{
					id: "r1",
					variants: [{ id: "v1", screens: [{ id: "M-0" }, { id: "M-E1" }] }],
				},
			],
		});

		const edge = result.composed.screens.find((screen) => screen.id === "M-E1");

		expect(edge?.children.contents).toEqual([]);
		expect(result.inheritedEdgeScreenIds).toEqual([]);
	});

	it("flattens routes, variants, and screens into node arrays with child references", () => {
		const result = composeGenerated({
			routes: [
				{
					id: "r1",
					variants: [
						{
							id: "v1",
							screens: [{ id: "s1" }],
						},
					],
				},
			],
		});

		expect(result.composed.routes[0].children).toEqual([{ variantId: "v1", order: 1 }]);
		expect(result.composed.variants[0]).toMatchObject({
			id: "v1",
			routeId: "r1",
			children: [{ screenId: "s1", order: 1 }],
		});
		expect(result.composed.screens[0]).toMatchObject({
			id: "s1",
			variantId: "v1",
			children: { contents: [] },
		});
	});
});
