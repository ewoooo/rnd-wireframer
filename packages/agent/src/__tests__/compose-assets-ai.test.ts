import { describe, expect, it, vi } from "vitest";

import {
	type ComposeAIRunner,
	composeAssetContentsWithAI,
	identifyGaps,
	identifyPlacementCandidates,
	mergeProposals,
} from "../compose/compose-assets-ai";
import type { ComposedNodeTree } from "../types";

function makeInput(overrides: Partial<ComposedNodeTree> = {}): ComposedNodeTree {
	return {
		routes: [{ id: "r1", children: [{ variantId: "v1" }] }],
		variants: [{ id: "v1", routeId: "r1", children: [{ screenId: "s1" }] }],
		screens: [{ id: "s1", variantId: "v1", children: { contents: [] } }],
		areas: [
			{
				level: "area",
				id: "ogn-mbr-member-input",
				order: 1,
				name: "회원 정보 입력",
				description: "가입에 필요한 기본 개인정보 입력 및 형식·중복 검증",
				layout: "vertical",
				children: [{ componentId: "text-field-user-id", order: 1 }],
			},
		],
		components: [
			{
				id: "text-field-user-id",
				type: "text-field",
				props: { label: "아이디 입력" },
				description: "아이디 입력",
			},
		],
		...overrides,
	};
}

describe("identifyGaps", () => {
	it("flags text-field missing placeholder and helperText as gap", () => {
		const gaps = identifyGaps(makeInput());
		expect(gaps).toEqual([
			{
				componentId: "text-field-user-id",
				type: "text-field",
				missing: ["placeholder", "helperText"],
			},
		]);
	});

	it("flags component with empty props as needing all keys", () => {
		const gaps = identifyGaps(
			makeInput({
				components: [{ id: "x", type: "text-field" }],
			}),
		);
		expect(gaps[0].missing).toEqual(["label", "placeholder", "helperText"]);
	});

	it("does not flag components when all required and optional keys are present", () => {
		const gaps = identifyGaps(
			makeInput({
				components: [
					{
						id: "text-field-user-id",
						type: "text-field",
						props: {
							label: "아이디",
							placeholder: "아이디를 입력하세요",
							helperText: "20자 이내",
						},
					},
				],
			}),
		);
		expect(gaps).toEqual([]);
	});

	it("uses fallback for unknown types", () => {
		const gaps = identifyGaps(
			makeInput({
				components: [{ id: "x", type: "mystery", props: { label: "ok" } }],
			}),
		);
		expect(gaps).toEqual([]);
	});

	it("returns empty when no components", () => {
		const gaps = identifyGaps({
			routes: [{ id: "r1", children: [] }],
			variants: [],
			screens: [],
		});
		expect(gaps).toEqual([]);
	});
});

describe("identifyPlacementCandidates", () => {
	it("flags non-system bottom areas for AI placement review", () => {
		const candidates = identifyPlacementCandidates(
			makeInput({
				screens: [
					{
						id: "s1",
						variantId: "v1",
						children: {
							contents: [{ areaId: "ogn-mbr-member-input", order: 1 }],
							bottom: [
								{ areaId: "ogn-mbr-guardian-result", order: 1 },
								{ areaId: "synth-bottom-s1", order: 2 },
								{ areaId: "s1-bottom-actions", order: 3 },
							],
						},
					},
				],
				areas: [
					{
						level: "area",
						id: "ogn-mbr-member-input",
						order: 1,
						name: "회원 정보 입력",
						children: [],
					},
					{
						level: "area",
						id: "ogn-mbr-guardian-result",
						order: 2,
						name: "법정대리인 동의 결과 확인",
						description: "법정대리인 동의 완료 여부 확인 및 결과 안내",
						children: [],
					},
				],
			}),
		);

		expect(candidates.map((candidate) => candidate.areaId)).toEqual(["ogn-mbr-guardian-result"]);
	});
});

describe("mergeProposals", () => {
	it("adds only novel keys, never overwrites existing props", () => {
		const result = mergeProposals(makeInput(), [
			{
				componentId: "text-field-user-id",
				props: {
					label: "OVERWRITE ATTEMPT",
					placeholder: "아이디를 입력하세요",
					helperText: "20자 이내",
				},
			},
		]);
		expect(result.composed.components?.[0].props).toEqual({
			label: "아이디 입력",
			placeholder: "아이디를 입력하세요",
			helperText: "20자 이내",
		});
		expect(result.mergedComponentIds).toEqual(["text-field-user-id"]);
	});

	it("skips proposals with no novel keys", () => {
		const result = mergeProposals(makeInput(), [
			{ componentId: "text-field-user-id", props: { label: "OVERWRITE" } },
		]);
		expect(result.mergedComponentIds).toEqual([]);
		expect(result.skipped).toEqual([
			{ componentId: "text-field-user-id", reason: "no novel keys" },
		]);
	});

	it("ignores empty-string and null proposal values", () => {
		const result = mergeProposals(makeInput(), [
			{
				componentId: "text-field-user-id",
				props: { placeholder: "", helperText: null as unknown as string },
			},
		]);
		expect(result.mergedComponentIds).toEqual([]);
	});

	it("warns when proposal targets unknown component", () => {
		const result = mergeProposals(makeInput(), [{ componentId: "ghost", props: { label: "x" } }]);
		expect(result.warnings).toEqual(["Proposal for unknown component: ghost"]);
	});

	it("moves misplaced bottom result areas back to contents from placement proposals", () => {
		const input = makeInput({
			screens: [
				{
					id: "s1",
					variantId: "v1",
					children: {
						contents: [{ areaId: "ogn-mbr-member-input", order: 1 }],
						bottom: [{ areaId: "ogn-mbr-guardian-result", order: 1 }],
					},
				},
			],
			areas: [
				...(makeInput().areas ?? []),
				{
					level: "area",
					id: "ogn-mbr-guardian-result",
					order: 2,
					name: "법정대리인 동의 결과 확인",
					description: "법정대리인 동의 완료 여부 확인 및 결과 안내",
					children: [],
				},
			],
		});

		const result = mergeProposals(
			input,
			[],
			[
				{
					screenId: "s1",
					areaId: "ogn-mbr-guardian-result",
					region: "contents",
					rationale: "결과 확인 영역은 bottom CTA가 아니라 본문 상태 안내다.",
				},
			],
		);

		expect(result.movedAreaIds).toEqual(["ogn-mbr-guardian-result"]);
		expect(result.composed.screens[0]?.children.bottom).toBeUndefined();
		expect(result.composed.screens[0]?.children.contents?.map((ref) => ref.areaId)).toEqual([
			"ogn-mbr-member-input",
			"ogn-mbr-guardian-result",
		]);
	});
});

describe("composeAssetContentsWithAI", () => {
	it("short-circuits without calling runner when no gaps", async () => {
		const runner = vi.fn() as unknown as ComposeAIRunner;
		const input = makeInput({
			components: [
				{
					id: "x",
					type: "text-field",
					props: {
						label: "a",
						placeholder: "b",
						helperText: "c",
					},
				},
			],
		});

		const result = await composeAssetContentsWithAI(input, { runner });

		expect(runner).not.toHaveBeenCalled();
		expect(result.gaps).toEqual([]);
		expect(result.composed).toBe(input);
	});

	it("calls runner with prompt including area context, then merges", async () => {
		const runner = vi.fn().mockResolvedValue({
			proposals: [
				{
					componentId: "text-field-user-id",
					props: {
						placeholder: "아이디를 입력하세요",
						helperText: "20자 이내",
					},
				},
			],
		});

		const result = await composeAssetContentsWithAI(makeInput(), { runner });

		expect(runner).toHaveBeenCalledTimes(1);
		const prompt = (runner.mock.calls[0]?.[0] as { prompt: string }).prompt;
		expect(prompt).toContain("text-field-user-id");
		expect(prompt).toContain("ogn-mbr-member-input");
		expect(prompt).toContain("placeholder, helperText");

		expect(result.composed.components?.[0].props).toEqual({
			label: "아이디 입력",
			placeholder: "아이디를 입력하세요",
			helperText: "20자 이내",
		});
		expect(result.mergedComponentIds).toEqual(["text-field-user-id"]);
	});

	it("calls runner for placement review even when prop gaps are absent", async () => {
		const runner = vi.fn().mockResolvedValue({
			proposals: [],
			placements: [
				{
					screenId: "s1",
					areaId: "ogn-mbr-guardian-result",
					region: "contents",
					rationale: "결과 확인 영역은 본문 상태 안내다.",
				},
			],
		});
		const input = makeInput({
			screens: [
				{
					id: "s1",
					variantId: "v1",
					children: {
						contents: [],
						bottom: [{ areaId: "ogn-mbr-guardian-result", order: 1 }],
					},
				},
			],
			areas: [
				{
					level: "area",
					id: "ogn-mbr-guardian-result",
					order: 1,
					name: "법정대리인 동의 결과 확인",
					description: "법정대리인 동의 완료 여부 확인 및 결과 안내",
					children: [{ componentId: "section-message-guardian-wait", order: 1 }],
				},
			],
			components: [
				{
					id: "section-message-guardian-wait",
					type: "section-message",
					props: {
						title: "동의 대기 중",
						description: "법정대리인 동의가 완료되면 다음 단계로 진행됩니다.",
						tone: "info",
					},
				},
			],
		});

		const result = await composeAssetContentsWithAI(input, { runner });

		expect(runner).toHaveBeenCalledTimes(1);
		const prompt = (runner.mock.calls[0]?.[0] as { prompt: string }).prompt;
		expect(prompt).toContain("placement_candidates");
		expect(prompt).toContain("법정대리인 동의 결과 확인");
		expect(result.movedAreaIds).toEqual(["ogn-mbr-guardian-result"]);
		expect(result.composed.screens[0]?.children.contents?.[0]?.areaId).toBe(
			"ogn-mbr-guardian-result",
		);
	});
});
