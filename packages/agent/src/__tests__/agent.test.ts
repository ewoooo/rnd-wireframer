import { describe, expect, it } from "vitest";

import { createCxTextAgent, DEFAULT_CX_AGENT_MODEL } from "../agent-sdk-runtime";
import { decorateRegisteredAssets } from "../decorate-assets";
import { registerAssets } from "../register-assets";
import { registerAssetsToTables } from "../register-assets-to-tables";

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

	it("registers routes, variants, screens, organisms, and components by order only", () => {
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
									organisms: [
										{ organismId: "ogn-mbr-term-agree", order: 2 },
										{ organismId: "ogn-mbr-term-list", order: 1 },
									],
								},
								{
									id: "NOVA-MBR-FP-000-0",
									name: "진입",
									order: 1,
									organisms: [],
								},
							],
						},
					],
				},
			],
			organisms: [
				{
					id: "ogn-mbr-term-agree",
					name: "약관 동의",
					order: 2,
					layout: "vertical",
					components: [{ componentId: "button-next", order: 2 }],
				},
				{
					id: "ogn-mbr-term-list",
					name: "약관 목록 조회",
					order: 1,
					layout: "vertical",
					components: [
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
		const organism = registry.organisms[0];

		expect(registry.warnings).toEqual([]);
		expect(registry.components.map((component) => component.id)).toEqual([
			"list-cell-term-required",
			"accordion-term-detail",
			"button-next",
		]);
		expect(registry.organisms.map((item) => item.id)).toEqual([
			"ogn-mbr-term-list",
			"ogn-mbr-term-agree",
		]);
		expect(registry.routes[0].variants[0].screens.map((item) => item.id)).toEqual([
			"NOVA-MBR-FP-000-0",
			"NOVA-MBR-FP-001-0",
		]);
		expect(screen.organisms.map((ref) => ref.organismId)).toEqual([
			"ogn-mbr-term-list",
			"ogn-mbr-term-agree",
		]);
		expect(organism.components.map((ref) => ref.componentId)).toEqual([
			"list-cell-term-required",
			"accordion-term-detail",
		]);
		expect(input.routes[0].variants[0].screens[0].organisms[0].organismId).toBe(
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
									organisms: [{ organismId: "ogn-mbr-term-list" }],
								},
							],
						},
					],
				},
			],
			organisms: [
				{
					id: "ogn-mbr-term-list",
					layout: "vertical",
					components: [{ componentId: "accordion-term-detail" }],
				},
			],
			components: [
				{
					id: "accordion-term-detail",
					type: "accordion",
				},
			],
		});

		const decorated = decorateRegisteredAssets(registry);
		const route = decorated.routes[0];
		const variant = route.asset.variants[0];
		const screen = variant.asset.screens[0];
		const organism = screen.asset.organisms[0].organism;
		const component = organism?.asset.components[0].component;

		expect(route.decoration.patternId).toBe("screen-route");
		expect(variant.decoration.patternId).toBe("screen-variant");
		expect(screen.decoration.patternId).toBe("screen-page");
		expect(organism?.decoration.patternId).toBe("organism-vertical");
		expect(component?.decoration.patternId).toBe("component-accordion");
		expect(screen.asset.organisms.map((ref) => ref.organismId)).toEqual(["ogn-mbr-term-list"]);
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

		const decorated = decorateRegisteredAssets(registry, {
			resolvePattern: ({ level }) => {
				if (level !== "screen") return undefined;
				return {
					patternId: "screen-terms",
					reasons: ["custom resolver"],
				};
			},
		});

		expect(decorated.routes[0].asset.variants[0].asset.screens[0].decoration).toEqual({
			patternId: "screen-terms",
			reasons: ["custom resolver"],
		});
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
										organisms: [{ organismId: "ogn-mbr-term-list" }],
									},
								],
							},
						],
					},
				],
				organisms: [
					{
						id: "ogn-mbr-term-list",
						name: "약관 목록 조회",
						components: [{ componentId: "list-cell-term-required" }],
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
			organisms: [{ organismId: "ogn-mbr-term-list", order: 1 }],
		});
		expect(tables.organisms[0]).toMatchObject({
			id: "ogn-mbr-term-list",
			components: [{ componentId: "list-cell-term-required", order: 1 }],
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
