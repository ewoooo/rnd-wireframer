import { ERROR_POLICY, type RenderTreeNode } from "@cx/renderer";
import type { ComponentCatalogEntry } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { collectComponentAttributes, type EmitContext, emitNode } from "../emit-node";

function createContext(data: Record<string, unknown> = {}) {
	const imports = new Map<string, Set<string>>();
	const warnings: string[] = [];
	const ctx: EmitContext = {
		addImport: (modulePath, name) => {
			const names = imports.get(modulePath) ?? new Set<string>();
			names.add(name);
			imports.set(modulePath, names);
		},
		data,
		warnings,
	};
	return { ctx, imports, warnings };
}

function node(partial: Partial<RenderTreeNode> & { type: string }): RenderTreeNode {
	return {
		componentVersion: "0.1.0",
		metadata: { id: `${partial.type}-id`, title: partial.type },
		...partial,
	} as RenderTreeNode;
}

describe("emitNode — external component", () => {
	it("emits a kiki component with sorted attributes and registers the import", () => {
		const { ctx, imports } = createContext();
		const code = emitNode(
			node({ props: { showBack: true, title: "약관 동의" }, type: "kiki.AppBar" }),
			ctx,
			"",
		);

		expect(code).toBe('<AppBar showBack title="약관 동의" />');
		expect(imports.get("@cx/external")).toEqual(new Set(["AppBar"]));
	});

	it("freezes data bindings into literals", () => {
		const { ctx } = createContext({ user: { name: "홍길동" } });
		const code = emitNode(
			node({ props: { title: { bind: "user.name", default: "기본" } }, type: "kiki.AppBar" }),
			ctx,
			"",
		);

		expect(code).toBe('<AppBar title="홍길동" />');
	});

	it("uses the binding default when data is missing", () => {
		const { ctx } = createContext();
		const code = emitNode(
			node({ props: { title: { bind: "user.name", default: "기본" } }, type: "kiki.AppBar" }),
			ctx,
			"",
		);

		expect(code).toBe('<AppBar title="기본" />');
	});

	it("omits nodes whose display.when resolves to false", () => {
		const { ctx } = createContext();
		const code = emitNode(
			node({
				display: { when: { bind: "flags.loading", default: false } },
				props: { title: "로딩" },
				type: "kiki.AppBar",
			}),
			ctx,
			"",
		);

		expect(code).toBeUndefined();
	});

	it("warns and skips unregistered component types", () => {
		const { ctx, warnings } = createContext();
		const code = emitNode(node({ type: "kiki.DoesNotExist" }), ctx, "");

		expect(code).toBeUndefined();
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("kiki.DoesNotExist");
	});

	it("moves a text children prop into JSX children", () => {
		const { ctx } = createContext();
		const code = emitNode(
			node({ props: { children: "인증 확인", variant: "primary" }, type: "kiki.Button" }),
			ctx,
			"",
		);

		expect(code).toBe('<Button variant="primary">인증 확인</Button>');
	});
});

describe("collectComponentAttributes — defaultValue 생략", () => {
	const entry = {
		label: "[test] Sample",
		props: {
			gap: { defaultValue: 12, type: "number" },
			title: { type: "string" },
			variant: { defaultValue: "primary", type: "enum", values: ["primary", "secondary"] },
		},
		source: "kiki-barrel",
		type: "kiki.Sample",
		version: "0.0.0",
	} satisfies ComponentCatalogEntry;

	it("omits props equal to the contract defaultValue", () => {
		const { attributes } = collectComponentAttributes(
			{ gap: 12, title: "제목", variant: "primary" },
			entry,
			"",
		);
		expect(attributes).toEqual(['title="제목"']);
	});

	it("keeps props that differ from the defaultValue", () => {
		const { attributes } = collectComponentAttributes({ gap: 4, variant: "secondary" }, entry, "");
		expect(attributes).toEqual(["gap={4}", 'variant="secondary"']);
	});
});

describe("emitNode — primitives", () => {
	it("emits Layout.Flex as a Flex primitive without node plumbing", () => {
		const { ctx, imports } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "자식 제목" }, type: "kiki.TitleSection" })],
				props: { direction: "column", gap: 12 },
				type: "Layout.Flex",
			}),
			ctx,
			"",
		);

		expect(code).toBe(
			[
				'<Flex layout={{ direction: "column", gap: 12 }}>',
				'\t<TitleSection title="자식 제목" />',
				"</Flex>",
			].join("\n"),
		);
		expect(imports.get("@cx/layout/primitives")).toEqual(new Set(["Flex"]));
	});

	it("emits Layout.Grid as a Grid primitive", () => {
		const { ctx, imports } = createContext();
		const code = emitNode(node({ props: { columns: "2", gap: 8 }, type: "Layout.Grid" }), ctx, "");

		expect(code).toBe('<Grid layout={{ columns: "2", gap: 8 }} />');
		expect(imports.get("@cx/layout/primitives")).toEqual(new Set(["Grid"]));
	});
});

describe("emitNode — areas", () => {
	it("emits area.static as nested VStacks mirroring titleGap/componentGap defaults", () => {
		const { ctx, imports } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "행" }, type: "kiki.TitleSection" })],
				type: "area.static",
			}),
			ctx,
			"",
		);

		expect(code).toBe(
			[
				"<VStack gap={8}>",
				"\t<VStack gap={12}>",
				'\t\t<TitleSection title="행" />',
				"\t</VStack>",
				"</VStack>",
			].join("\n"),
		);
		expect(imports.get("@cx/layout/primitives")).toEqual(new Set(["VStack"]));
	});

	it("hides a dynamic area without data when errorPolicy is HIDE_AREA", () => {
		const { ctx } = createContext({ __areaData__: { "area-x": { hasData: false } } });
		const code = emitNode(
			node({
				children: [node({ props: { title: "행" }, type: "kiki.TitleSection" })],
				metadata: { id: "area-x", title: "영역" },
				props: { errorPolicy: ERROR_POLICY.HIDE_AREA },
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		expect(code).toBeUndefined();
	});

	it("renders a dynamic area normally when hasData is true (default)", () => {
		const { ctx } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "행" }, type: "kiki.TitleSection" })],
				props: { componentGap: 4, titleGap: 2 },
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		expect(code).toContain("<VStack gap={2}>");
		expect(code).toContain("<VStack gap={4}>");
	});
});

describe("emitNode — named layout patterns", () => {
	it("unwraps a resolvable layoutId into its primitive target with merged defaults", () => {
		const { ctx, imports, warnings } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "약관 1" }, type: "kiki.ListText" })],
				layout: "layout.area.listStack",
				props: { divider: "contents" },
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		expect(code).toBe(
			[
				"<PageStack",
				"\tgap={8}",
				"\titemPaddingX={20}",
				'\titemTemplate="default-20"',
				"\tpaddingY={28}",
				"\tsectionGap={8}",
				"\tsectionPaddingX={12}",
				">",
				'\t<ListText title="약관 1" />',
				"</PageStack>",
			].join("\n"),
		);
		expect(imports.get("@cx/layout/primitives")).toEqual(new Set(["PageStack"]));
		expect(imports.get("@cx/layout/registry")).toBeUndefined();
		expect(warnings).toEqual([]);
	});

	it('divider:"contents"는 행 사이에만 Divider를 emit한다 (heading exempt)', () => {
		const { ctx, imports, warnings } = createContext();
		const code = emitNode(
			node({
				children: [
					node({ props: { title: "제목" }, type: "kiki.TitleSection" }),
					node({ props: { title: "약관 1" }, type: "kiki.ListText" }),
					node({ props: { title: "약관 2" }, type: "kiki.ListText" }),
				],
				layout: "layout.area.listStack",
				props: { divider: "contents" },
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		// TitleSection 직후에는 없고, ListText 행 사이 경계 1곳에만 삽입된다.
		expect(code).toContain(
			[
				'\t<TitleSection title="제목" />',
				'\t<ListText title="약관 1" />',
				'\t<Divider type="contents" />',
				'\t<ListText title="약관 2" />',
			].join("\n"),
		);
		expect([...(imports.get("@cx/external") ?? [])]).toContain("Divider");
		expect(warnings).toEqual([]);
	});

	it('divider:"section"은 primitive 닫는 태그 뒤 형제 section Divider로 emit한다', () => {
		const { ctx, imports, warnings } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "약관 1" }, type: "kiki.ListText" })],
				layout: "layout.area.fieldStack",
				props: { divider: "section" },
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		expect(code).toContain('</PageStack>\n<Divider type="section" />');
		expect(code).not.toContain('<Divider type="contents" />');
		expect([...(imports.get("@cx/external") ?? [])]).toContain("Divider");
		expect(warnings).toEqual([]);
	});

	it("preserves className on unwrapped primitives", () => {
		const { ctx } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "약관 1" }, type: "kiki.ListText" })],
				className: "custom-class",
				layout: "layout.area.listStack",
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		expect(code).toContain('className="custom-class"');
		expect(code).toContain("<PageStack");
	});

	it("wraps a leaf component render when the layout node has no children", () => {
		const { ctx, imports } = createContext();
		const code = emitNode(
			node({
				layout: "layout.composite.componentAppBar",
				props: { showBack: true, title: "약관 동의" },
				type: "kiki.AppBar",
			}),
			ctx,
			"",
		);

		expect(code).toBe(
			["<VStack gap={0}>", '\t<AppBar showBack title="약관 동의" />', "</VStack>"].join("\n"),
		);
		expect(imports.get("@cx/layout/primitives")).toEqual(new Set(["VStack"]));
	});

	it("falls back to the canonical registry component for bespoke layoutIds (mixed output)", () => {
		const { ctx, imports, warnings } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "카드" }, type: "kiki.ListText" })],
				layout: "layout.area.rowCardListArea",
				type: "area.dynamic",
			}),
			ctx,
			"",
		);

		expect(code).toBe(
			["<RowCardListArea>", '\t<ListText title="카드" />', "</RowCardListArea>"].join("\n"),
		);
		expect(imports.get("@cx/layout/registry")).toEqual(new Set(["RowCardListArea"]));
		expect(warnings).toEqual([]);
	});

	it("warns on unresolved layoutIds and emits content unwrapped", () => {
		const { ctx, warnings } = createContext();
		const code = emitNode(
			node({
				children: [node({ props: { title: "행" }, type: "kiki.TitleSection" })],
				layout: "layout.area.doesNotExist",
				type: "area.static",
			}),
			ctx,
			"",
		);

		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("layout.area.doesNotExist");
		expect(code).toContain("<VStack gap={8}>");
	});
});
