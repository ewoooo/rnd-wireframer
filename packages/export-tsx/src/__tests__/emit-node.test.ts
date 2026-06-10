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
	it("emits the canonical registry component without unwrapping and preserves props", () => {
		const { ctx, imports } = createContext();
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
				'<ListStackArea props={{ divider: "contents" }}>',
				'\t<ListText title="약관 1" />',
				"</ListStackArea>",
			].join("\n"),
		);
		expect(imports.get("@cx/layout/registry")).toEqual(new Set(["ListStackArea"]));
	});

	it("preserves className on layout wrappers", () => {
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

		expect(code).toContain('<ListStackArea className="custom-class">');
	});

	it("wraps a leaf component render when the layout node has no children", () => {
		const { ctx } = createContext();
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
			[
				'<CompositeGap0 props={{ showBack: true, title: "약관 동의" }}>',
				'\t<AppBar showBack title="약관 동의" />',
				"</CompositeGap0>",
			].join("\n"),
		);
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
