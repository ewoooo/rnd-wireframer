import { describe, expect, it } from "vitest";
import { canonicalizeRenderTree } from "@cx/external/canonicalize";

describe("apply write-back: render-tree 캐논화", () => {
	it("alias node.type을 가진 트리가 canonical로 치환된다", () => {
		const tree = { type: "Screen", children: [{ type: "app-bar", children: [] }] };
		const canonical = canonicalizeRenderTree(tree);
		expect(canonical.children[0].type).toBe("kiki.AppBar");
	});
});
