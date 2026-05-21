import { describe, expect, it } from "vitest";

import {
	ComponentRegistry,
	composeWireframeFromSpec,
	findDuplicateNodeIds,
	resolveDisplayWhen,
	resolveProps,
	validateScreenRegionContract,
	validateWireframeSchemaFull,
} from "../index";
import type { WireframeSchema } from "../types";

const metadata = (id: string, title: string) => ({
	id,
	title,
	author: "test-author",
	createdAt: "2026-05-21T00:00:00Z",
	updatedAt: "2026-05-21T00:00:00Z",
});

const getHeroNode = () => {
	const heroNode = validSchema.children[0]?.children?.[1]?.children?.[0];
	if (!heroNode) throw new Error("HeroSection test node is missing");
	return heroNode;
};

const validSchema: WireframeSchema = {
	version: "1.0.0",
	metadata: metadata("roaming-sample", "T로밍 샘플"),
	data: {
		user: {
			name: "홍길동",
		},
		items: [{ title: "첫 번째" }],
		visible: true,
	},
	children: [
		{
			type: "Screen",
			componentVersion: "1.0.0",
			metadata: metadata("screen-root", "T로밍 화면"),
			children: [
				{
					type: "Screen.Header",
					componentVersion: "1.0.0",
					metadata: metadata("screen-header", "상단 영역"),
					props: {
						position: "fixed",
						layout: {
							direction: "column",
							gap: 0,
						},
					},
					children: [],
				},
				{
					type: "Screen.Contents",
					componentVersion: "1.0.0",
					metadata: metadata("screen-contents", "콘텐츠 영역"),
					props: {
						layout: {
							direction: "column",
							gap: 4,
						},
						scroll: true,
					},
					children: [
						{
							type: "HeroSection",
							componentVersion: "1.0.0",
							metadata: metadata("hero", "히어로"),
							props: {
								title: "{{user.name}}님",
								firstItem: { bind: "items[0].title", default: "없음" },
								missing: { bind: "items[1].title", default: "기본값" },
							},
							display: {
								when: { bind: "visible", default: false },
							},
						},
					],
				},
				{
					type: "Screen.Bottom",
					componentVersion: "1.0.0",
					metadata: metadata("screen-bottom", "하단 영역"),
					props: {
						position: "fixed",
						layout: {
							direction: "column",
							gap: 0,
						},
						safeArea: true,
					},
					children: [],
				},
			],
		},
	],
};

describe("wireframe", () => {
	it("validates a renderable wireframe schema", () => {
		const result = validateWireframeSchemaFull(validSchema);

		expect(result.success).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("resolves template and bind props", () => {
		const node = getHeroNode();
		const props = resolveProps(node.props, validSchema.data ?? {});

		expect(props.title).toBe("홍길동님");
		expect(props.firstItem).toBe("첫 번째");
		expect(props.missing).toBe("기본값");
	});

	it("resolves conditional display values", () => {
		const node = getHeroNode();

		expect(resolveDisplayWhen(node.display?.when, validSchema.data ?? {})).toBe(true);
		expect(
			resolveDisplayWhen({ bind: "missing.flag", default: false }, validSchema.data ?? {}),
		).toBe(false);
	});

	it("finds duplicate node ids", () => {
		const schemaWithDuplicates = {
			...validSchema,
			children: [
				...validSchema.children,
				{
					type: "Text",
					componentVersion: "1.0.0",
					metadata: metadata("hero", "중복 히어로"),
				},
			],
		};

		expect(findDuplicateNodeIds(schemaWithDuplicates)).toEqual(["hero"]);
		expect(validateWireframeSchemaFull(schemaWithDuplicates).success).toBe(false);
	});

	it("requires Screen to include Header, Contents, and Bottom regions", () => {
		const invalidSchema: WireframeSchema = {
			...validSchema,
			children: [
				{
					type: "Screen",
					componentVersion: "1.0.0",
					metadata: metadata("screen-root", "영역 누락 화면"),
					children: [
						{
							type: "Screen.Contents",
							componentVersion: "1.0.0",
							metadata: metadata("screen-contents", "콘텐츠 영역"),
							props: {
								layout: {
									direction: "column",
								},
								scroll: true,
							},
							children: [],
						},
					],
				},
			],
		};

		const result = validateWireframeSchemaFull(invalidSchema);

		expect(result.success).toBe(false);
		expect(result.errors).toContain("Screen(screen-root) must include Screen.Header");
		expect(result.errors).toContain("Screen(screen-root) must include Screen.Bottom");
	});

	it("rejects direct non-region children under Screen", () => {
		const invalidSchema: WireframeSchema = {
			...validSchema,
			children: [
				{
					...validSchema.children[0],
					children: [
						...(validSchema.children[0].children ?? []),
						{
							type: "HeroSection",
							componentVersion: "1.0.0",
							metadata: metadata("hero-direct", "잘못된 직계 히어로"),
						},
					],
				},
			],
		};

		const errors = validateScreenRegionContract(invalidSchema);

		expect(errors.some((error) => error.includes("direct children must be"))).toBe(true);
	});

	it("checks registered component types", () => {
		const registry = new ComponentRegistry();
		registry.register("HeroSection", {
			component: {},
			version: "1.0.0",
		});

		const result = validateWireframeSchemaFull(validSchema, {
			registry,
			checkRegisteredComponents: true,
		});

		expect(result.success).toBe(true);
	});

	it("composes spec inputs into a valid wireframe schema", () => {
		const result = composeWireframeFromSpec({
			now: "2026-05-21T00:00:00Z",
			author: "test-author",
			screenSource: {
				module: "mbr",
				screenVariantId: "mbr-join-base",
				metadata: {
					code: "NOVA-MBR-FP-001-0",
					name: "약관 동의",
					description: "회원 가입에 필요한 약관을 확인하고 동의한다.",
					surface: "page",
				},
				organisms: [
					{
						order: 1,
						organismCode: "ogn-mbr-term-list",
					},
				],
			},
			organisms: [
				{
					metadata: {
						module: "mbr",
						code: "ogn-mbr-term-list",
						name: "약관 목록 조회",
						type: "organism",
						usage: "section",
					},
					layout: {
						flow: "vertical",
					},
					states: {
						default: {
							visible: ["requiredTerm", "termDetail"],
						},
						error: {
							visible: ["errorMessage"],
						},
					},
					children: [
						{
							id: "requiredTerm",
							componentCode: "list-cell-term-required",
							slot: "terms",
							policyCode: "POL-MBR-TERM-001-01",
							events: {
								onChange: {
									action: "setState",
									target: "checkedTerms",
								},
							},
						},
						{
							id: "termDetail",
							componentCode: "accordion-term-detail",
							slot: "detail",
						},
						{
							id: "errorMessage",
							componentCode: "section-message-term-error",
							slot: "feedback",
						},
					],
				},
			],
			components: [
				{
					code: "list-cell-term-required",
					componentType: "list-cell",
					property: {
						name: "필수 약관 항목",
						description: "필수 약관 항목",
					},
				},
				{
					code: "accordion-term-detail",
					componentType: "accordion",
					property: {
						name: "약관 전문 펼치기",
						description: "약관 전문 펼치기",
					},
				},
				{
					code: "section-message-term-error",
					componentType: "section-message",
					property: {
						name: "약관 조회 오류 안내",
						description: "약관 조회 오류 안내",
						variant: "negative",
					},
				},
			],
		});

		expect(result.warnings).toEqual([]);
		expect(validateWireframeSchemaFull(result.schema).success).toBe(true);

		const screen = result.schema.children[0];
		expect(screen.type).toBe("Screen");
		expect(screen.children?.map((node) => node.type)).toEqual([
			"Screen.Header",
			"Screen.Contents",
			"Screen.Bottom",
		]);

		const contents = screen.children?.[1];
		const organism = contents?.children?.[0];
		expect(organism?.type).toBe("Organism.Section");
		expect(organism?.props?.organismCode).toBe("ogn-mbr-term-list");
		expect(organism?.children?.map((node) => node.type)).toEqual(["ListCell", "Accordion"]);
	});
});
