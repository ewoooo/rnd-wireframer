import { describe, expect, it } from "vitest";

import { composeAssetContents } from "../compose/compose-assets";
import { decorateRegisteredAssets } from "../decorate/decorate-assets";
import { createPatternResolver } from "../pattern/pattern-resolver";
import { registerAssets } from "../register/register-assets";
import { registerAssetsToTables } from "../register/register-assets-to-tables";
import { createCxTextAgent, DEFAULT_CX_AGENT_MODEL } from "../runtime/agent-sdk-runtime";

describe("@cx/agent asset pipeline", () => {
	it("creates an OpenAI Agent SDK text agent with the project default model", () => {
		const agent = createCxTextAgent({
			name: "Codex Review Agent",
			instructions: "Review generated wireframe JSON and report contract issues.",
		});

		expect(agent.instructions).toBe("Review generated wireframe JSON and report contract issues.");
		expect(agent.name).toBe("Codex Review Agent");
		expect(agent.model).toBe(DEFAULT_CX_AGENT_MODEL);
		expect(agent.tools).toEqual([]);
	});

	it("registers routes, variants, screens, areas, and components by order only", () => {
		const input = {
			routes: [
				{
					id: "mbr-join",
					name: "회원가입",
					variants: [
						{
							id: "mbr-join-base",
							name: "기본",
							screens: [
								{
									id: "NOVA-MBR-FP-001-0",
									name: "약관 동의",
									order: 2,
									areas: [
										{ areaId: "ogn-mbr-term-agree", order: 2 },
										{ areaId: "ogn-mbr-term-list", order: 1 },
									],
								},
								{
									id: "NOVA-MBR-FP-000-0",
									name: "진입",
									order: 1,
									areas: [],
								},
							],
						},
					],
				},
			],
			areas: [
				{
					id: "ogn-mbr-term-agree",
					name: "약관 동의",
					order: 2,
					layout: "vertical",
					children: [{ componentId: "button-next", order: 2 }],
				},
				{
					id: "ogn-mbr-term-list",
					name: "약관 목록 조회",
					order: 1,
					layout: "vertical",
					children: [
						{ componentId: "accordion-term-detail", order: 2 },
						{ componentId: "list-cell-term-required", order: 1 },
					],
				},
			],
			components: [
				{
					id: "button-next",
					name: "다음 버튼",
					order: 3,
					type: "button",
				},
				{
					id: "accordion-term-detail",
					name: "약관 전문 펼치기",
					order: 2,
					type: "accordion",
				},
				{
					id: "list-cell-term-required",
					name: "필수 약관 항목",
					order: 1,
					type: "list-cell",
				},
			],
		};

		const registry = registerAssets(input);
		const screen = registry.routes[0].variants[0].screens[1];
		const area = registry.areas[0];

		expect(registry.warnings).toEqual([]);
		expect(registry.components.map((component) => component.id)).toEqual([
			"list-cell-term-required",
			"accordion-term-detail",
			"button-next",
		]);
		expect(registry.areas.map((item) => item.id)).toEqual([
			"ogn-mbr-term-list",
			"ogn-mbr-term-agree",
		]);
		expect(registry.routes[0].variants[0].screens.map((item) => item.id)).toEqual([
			"NOVA-MBR-FP-000-0",
			"NOVA-MBR-FP-001-0",
		]);
		expect(screen.areas.map((ref) => ref.areaId)).toEqual([
			"ogn-mbr-term-list",
			"ogn-mbr-term-agree",
		]);
		expect(area.children.map((ref) => ref.componentId)).toEqual([
			"list-cell-term-required",
			"accordion-term-detail",
		]);
		expect(input.routes[0].variants[0].screens[0].areas[0].areaId).toBe(
			"ogn-mbr-term-agree",
		);
	});

	it("decorates registered assets without changing registration order", () => {
		const registry = registerAssets({
			routes: [
				{
					id: "mbr-join",
					variants: [
						{
							id: "base",
							screens: [
								{
									id: "NOVA-MBR-FP-001-0",
									surface: "page",
									areas: [{ areaId: "ogn-mbr-term-list" }],
								},
							],
						},
					],
				},
			],
			areas: [
				{
					id: "ogn-mbr-term-list",
					layout: "vertical",
					children: [{ componentId: "accordion-term-detail" }],
				},
			],
			components: [
				{
					id: "accordion-term-detail",
					type: "accordion",
				},
			],
		});

		const composed = composeAssetContents(registry).composed;
		const decorated = decorateRegisteredAssets(composed);
		const route = decorated.routes[0];
		const variant = decorated.variants[0];
		const screen = decorated.screens[0];
		const area = decorated.areas.find((o) => o.id === "ogn-mbr-term-list");
		const component = decorated.components.find((c) => c.id === "accordion-term-detail");

		expect(route.pattern.id).toBe("screen-route");
		expect(variant.pattern.id).toBe("screen-variant");
		expect(screen.pattern.id).toBe("screen-shell");
		expect(area?.pattern.id).toBe("area-vertical");
		expect(component?.pattern.id).toBe("component-accordion");
		expect(screen.children.contents?.map((ref) => ref.areaId)).toEqual([
			"ogn-mbr-term-list",
		]);
	});

	it("lets callers provide a custom pattern resolver", () => {
		const registry = registerAssets({
			routes: [
				{
					id: "mbr-join",
					variants: [{ id: "base", screens: [{ id: "NOVA-MBR-FP-001-0" }] }],
				},
			],
		});

		const composed = composeAssetContents(registry).composed;
		const decorated = decorateRegisteredAssets(composed, {
			resolvePattern: ({ level }) => {
				if (level !== "screen") return undefined;
				return {
					id: "screen-terms",
					variant: "default",
					reasons: ["custom resolver"],
				};
			},
		});

		expect(decorated.screens[0].pattern).toEqual({
			id: "screen-terms",
			variant: "default",
			reasons: ["custom resolver"],
		});
	});

	it("resolves area layout presets from child component types", () => {
		const registry = registerAssets({
			routes: [
				{
					id: "mbr-join",
					variants: [
						{
							id: "base",
							screens: [
								{
									id: "NOVA-MBR-FP-001-0",
									areas: [{ areaId: "ogn-mbr-term-list" }],
								},
							],
						},
					],
				},
			],
			areas: [
				{
					id: "ogn-mbr-term-list",
					children: [{ componentId: "list-cell-term-required" }],
				},
			],
			components: [
				{
					id: "list-cell-term-required",
					type: "list-cell",
				},
			],
		});

		const composed = composeAssetContents(registry).composed;
		const decorated = decorateRegisteredAssets(composed, {
			resolvePattern: createPatternResolver(),
		});

		expect(decorated.areas[0].pattern.id).toBe("list-stack");
		expect(decorated.areas[0].pattern.reasons).toContain(
			"composite types allOf matched (list-cell)",
		);
	});

	it("converts an AI asset bundle into table rows", () => {
		const tables = registerAssetsToTables(
			{
				routes: [
					{
						id: "mbr-join",
						name: "회원 가입",
						variants: [
							{
								id: "mbr-join-base",
								name: "기본",
								screens: [
									{
										id: "NOVA-MBR-FP-001-0",
										name: "약관 동의",
										surface: "page",
										areas: [{ areaId: "ogn-mbr-term-list" }],
									},
								],
							},
						],
					},
				],
				areas: [
					{
						id: "ogn-mbr-term-list",
						name: "약관 목록 조회",
						children: [{ componentId: "list-cell-term-required" }],
					},
				],
				components: [
					{
						id: "list-cell-term-required",
						name: "필수 약관 항목",
						type: "list-cell",
					},
				],
			},
			{
				screenMockData: [
					{
						screenId: "NOVA-MBR-FP-001-0",
						data: {
							termList: {
								requiredTerm: {
									title: "[필수] 서비스 이용약관",
								},
							},
						},
						generatedBy: "ai",
					},
				],
			},
		);

		expect(tables.screenRoutes).toEqual([{ code: "mbr-join", name: "회원 가입", order: 1 }]);
		expect(tables.screenVariants).toEqual([
			{ code: "mbr-join-base", screenRouteCode: "mbr-join", name: "기본", order: 1 },
		]);
		expect(tables.screens[0]).toMatchObject({
			id: "NOVA-MBR-FP-001-0",
			screenVariantId: "mbr-join-base",
			surface: "page",
			areas: [{ areaId: "ogn-mbr-term-list", order: 1 }],
		});
		expect(tables.areas[0]).toMatchObject({
			id: "ogn-mbr-term-list",
			children: [{ componentId: "list-cell-term-required", order: 1 }],
		});
		expect(tables.components[0]).toMatchObject({
			id: "list-cell-term-required",
			type: "list-cell",
		});
		expect(tables.screenMockData).toEqual([
			{
				screenId: "NOVA-MBR-FP-001-0",
				scenario: "default",
				generatedBy: "ai",
				data: {
					termList: {
						requiredTerm: {
							title: "[필수] 서비스 이용약관",
						},
					},
				},
			},
		]);
		expect(tables.warnings).toEqual([]);
	});
});
