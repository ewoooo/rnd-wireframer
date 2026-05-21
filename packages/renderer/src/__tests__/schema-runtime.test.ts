import { describe, expect, it } from "vitest";

import {
	ComponentRegistry,
	findDuplicateNodeIds,
	resolveDisplayWhen,
	resolveProps,
	validateScreenRegionContract,
	validateWireframeSchemaFull,
} from "../index";
import type { WireframeSchema } from "../schema";

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

	it("checks registered composite types", () => {
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
});
