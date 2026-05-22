import { describe, expect, it } from "vitest";

import { composeAssetContents } from "../compose-assets";
import type { RegisterAssetsInput } from "../types";

function makeInput(components: RegisterAssetsInput["components"]): RegisterAssetsInput {
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

describe("composeAssetContents", () => {
	it("fills text-field label from raw.description", () => {
		const input = makeInput([
			{
				id: "text-field-user-id",
				type: "text-field",
				raw: { description: "아이디 입력" },
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({ label: "아이디 입력" });
		expect(result.filledComponentIds).toEqual(["text-field-user-id"]);
	});

	it("fills list-cell title from raw.description", () => {
		const input = makeInput([
			{
				id: "list-cell-term-required",
				type: "list-cell",
				raw: { description: "필수 약관 항목" },
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({ title: "필수 약관 항목" });
	});

	it("fills section-message with message + variant", () => {
		const input = makeInput([
			{
				id: "section-message-input-error",
				type: "section-message",
				raw: { description: "입력 오류 안내", variant: "negative" },
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({
			message: "입력 오류 안내",
			variant: "negative",
		});
	});

	it("extracts maxLength from raw.note", () => {
		const input = makeInput([
			{
				id: "text-field-user-id",
				type: "text-field",
				raw: {
					description: "아이디 입력",
					note: "[정책:POL-MBR-INFO-002-04] 아이디 길이 → max: 20",
				},
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({
			label: "아이디 입력",
			maxLength: 20,
		});
	});

	it("ignores variant '-' as missing", () => {
		const input = makeInput([
			{
				id: "list-cell-term-required",
				type: "list-cell",
				raw: { description: "필수 약관 항목", variant: "-" },
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({ title: "필수 약관 항목" });
	});

	it("does not overwrite existing props", () => {
		const input = makeInput([
			{
				id: "x",
				type: "text-field",
				props: { label: "preset" },
				raw: { description: "should be ignored" },
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({ label: "preset" });
		expect(result.filledComponentIds).toEqual([]);
	});

	it("skips components without raw", () => {
		const input = makeInput([{ id: "x", type: "text-field" }]);

		const result = composeAssetContents(input);

		expect(result.skipped).toEqual([{ componentId: "x", reason: "no raw" }]);
	});

	it("falls back to label for unknown types", () => {
		const input = makeInput([{ id: "x", type: "mystery-widget", raw: { description: "안내" } }]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0].props).toEqual({ label: "안내" });
	});

	it("normalizes content action-area components to button", () => {
		const input = makeInput([
			{
				id: "action-area-next",
				type: "action-area",
				raw: { description: "다음 버튼 영역", variant: "strong" },
			},
		]);

		const result = composeAssetContents(input);

		expect(result.composed.components?.[0]).toMatchObject({
			id: "action-area-next",
			type: "button",
			props: { label: "다음 버튼 영역", variant: "strong" },
		});
	});

	it("preserves untouched fields", () => {
		const input: RegisterAssetsInput = {
			routes: [{ id: "r1", variants: [{ id: "v1", screens: [{ id: "s1" }] }] }],
			organisms: [{ id: "o1", components: [{ componentId: "x" }] }],
			components: [{ id: "x", type: "text-field", raw: { description: "test" } }],
		};

		const result = composeAssetContents(input);

		expect(result.composed.organisms).toBe(input.organisms);
	});
});

describe("composeAssetContents — edge screen inheritance", () => {
	it("copies main screen organisms to edge screens with empty organisms", () => {
		const input: RegisterAssetsInput = {
			routes: [
				{
					id: "r1",
					variants: [
						{
							id: "v1",
							screens: [
								{
									id: "FP-001-0",
									organisms: [{ organismId: "ogn-term-list" }, { organismId: "ogn-term-agree" }],
								},
								{ id: "FP-001-E1" },
								{ id: "FP-001-E2", organisms: [] },
							],
						},
					],
				},
			],
		};

		const result = composeAssetContents(input);
		const variant = result.composed.routes[0].variants[0];

		expect(variant.screens[1].organisms).toEqual([
			{ organismId: "ogn-term-list" },
			{ organismId: "ogn-term-agree" },
		]);
		expect(variant.screens[2].organisms).toEqual([
			{ organismId: "ogn-term-list" },
			{ organismId: "ogn-term-agree" },
		]);
		expect(result.inheritedEdgeScreenIds).toEqual(["FP-001-E1", "FP-001-E2"]);
	});

	it("does not overwrite edge screens that already declare organisms", () => {
		const input: RegisterAssetsInput = {
			routes: [
				{
					id: "r1",
					variants: [
						{
							id: "v1",
							screens: [
								{ id: "M-0", organisms: [{ organismId: "ogn-a" }] },
								{ id: "M-E1", organisms: [{ organismId: "ogn-custom" }] },
							],
						},
					],
				},
			],
		};

		const result = composeAssetContents(input);

		expect(result.composed.routes[0].variants[0].screens[1].organisms).toEqual([
			{ organismId: "ogn-custom" },
		]);
		expect(result.inheritedEdgeScreenIds).toEqual([]);
	});

	it("does nothing when main screen also has no organisms", () => {
		const input: RegisterAssetsInput = {
			routes: [
				{
					id: "r1",
					variants: [{ id: "v1", screens: [{ id: "M-0" }, { id: "M-E1" }] }],
				},
			],
		};

		const result = composeAssetContents(input);

		expect(result.composed.routes[0].variants[0].screens[1].organisms).toBeUndefined();
		expect(result.inheritedEdgeScreenIds).toEqual([]);
	});
});
