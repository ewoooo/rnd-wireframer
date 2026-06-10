import { describe, expect, it } from "vitest";
import { externalCatalog } from "../catalog.generated";
import { catalogAlias } from "../catalog.alias";
import { canonicalizeNodeType, canonicalizeRenderTree } from "../canonicalize-catalog";

describe("@cx/external canonicalize-catalog", () => {
	it("모든 alias 값은 실제 catalog 키(canonical)다", () => {
		for (const canonical of Object.values(catalogAlias)) {
			expect(externalCatalog[canonical], `alias→${canonical} 미존재`).toBeDefined();
		}
	});

	it("canonicalizeNodeType은 alias를 canonical로, 미등록은 그대로 반환", () => {
		const [alias, canonical] = Object.entries(catalogAlias)[0];
		expect(canonicalizeNodeType(alias)).toBe(canonical);
		expect(canonicalizeNodeType("kiki.AppBar")).toBe("kiki.AppBar");
		expect(canonicalizeNodeType("unknown.Thing")).toBe("unknown.Thing");
	});

	it("canonicalizeRenderTree는 트리 전체 node.type을 canonical로 치환한다", () => {
		const [alias, canonical] = Object.entries(catalogAlias)[0];
		const tree = { type: "Screen", children: [{ type: alias, children: [] }] };
		const result = canonicalizeRenderTree(tree);
		expect(result.children[0].type).toBe(canonical);
		expect(result.type).toBe("Screen");
	});

	it("canonicalizeRenderTree는 type 외 필드(props/metadata)를 보존하고 입력을 변형하지 않는다", () => {
		const [alias, canonical] = Object.entries(catalogAlias)[0];
		const input = {
			type: "Screen",
			metadata: { id: "root-1", title: "Root" },
			props: { a: 1 },
			children: [{ type: alias, metadata: { id: "child-1" }, props: { b: 2 }, children: [] }],
		};
		const out = canonicalizeRenderTree(input);
		// type 치환
		expect(out.children[0].type).toBe(canonical);
		// 필드 보존 (root + child)
		expect(out.metadata).toEqual({ id: "root-1", title: "Root" });
		expect(out.props).toEqual({ a: 1 });
		expect(out.children[0].metadata).toEqual({ id: "child-1" });
		expect(out.children[0].props).toEqual({ b: 2 });
		// 입력 비변형
		expect(out).not.toBe(input);
		expect(input.children[0].type).toBe(alias);
	});
});
