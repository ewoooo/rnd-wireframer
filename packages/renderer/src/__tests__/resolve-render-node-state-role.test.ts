import { describe, expect, test } from "vitest";
import { resolveRenderNode } from "../tree/runtime";
import type { RenderTreeNode } from "../tree/types";

function node(overrides: Partial<RenderTreeNode>): RenderTreeNode {
	return {
		type: "kiki.ActionButton",
		componentVersion: "0.0.0",
		metadata: { id: "n", title: "t" },
		...overrides,
	};
}

describe("resolveRenderNode — stateRole 의미론", () => {
	test("base(가시성): when=false면 노드를 제거한다", () => {
		const result = resolveRenderNode(
			node({ display: { stateRole: "base", when: { bind: "x", default: false } } }),
			{},
		);
		expect(result).toBeUndefined();
	});

	test("base(가시성): when=true면 노드를 유지한다", () => {
		const result = resolveRenderNode(
			node({ display: { stateRole: "base", when: { bind: "x", default: true } } }),
			{},
		);
		expect(result).toBeDefined();
	});

	test("disabled(상태): when=false여도 노드를 제거하지 않고 disabled=true를 주입한다", () => {
		const result = resolveRenderNode(
			node({
				display: { stateRole: "disabled", when: { bind: "form.ok", default: false } },
				props: { text: "다음" },
			}),
			{},
		);
		expect(result).toBeDefined();
		expect(result?.props.disabled).toBe(true);
		expect(result?.props.text).toBe("다음");
	});

	test("disabled(상태): when=true면 disabled=false (활성)", () => {
		const result = resolveRenderNode(
			node({ display: { stateRole: "disabled", when: { bind: "form.ok", default: false } } }),
			{ form: { ok: true } },
		);
		expect(result).toBeDefined();
		expect(result?.props.disabled).toBe(false);
	});

	test("loading(상태): when=false면 loading=true를 주입한다", () => {
		const result = resolveRenderNode(
			node({ display: { stateRole: "loading", when: { bind: "loaded", default: false } } }),
			{},
		);
		expect(result?.props.loading).toBe(true);
	});

	test("stateRole 미지정: 기본은 가시성(base)으로 동작한다", () => {
		const removed = resolveRenderNode(node({ display: { when: false } }), {});
		expect(removed).toBeUndefined();

		const kept = resolveRenderNode(node({ props: { text: "다음" } }), {});
		expect(kept).toBeDefined();
		expect(kept?.props.text).toBe("다음");
		expect(kept?.props.disabled).toBeUndefined();
	});
});
