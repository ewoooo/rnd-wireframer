import {
	isFlexLayoutProps,
	isGridLayoutProps,
	isScreenNode,
	isScreenRegionNode,
} from "@cx/layout/contract";
import type { ScreenNode } from "@cx/layout/types";
import { describe, expect, it } from "vitest";

describe("@cx/layout contract", () => {
	it("guards flex and grid layout props", () => {
		expect(isFlexLayoutProps({ direction: "row", gap: 8, align: "center" })).toBe(true);
		expect(isFlexLayoutProps({ direction: "inline", gap: 8 })).toBe(false);
		expect(isFlexLayoutProps({ direction: "row", gap: "8" })).toBe(false);

		expect(isGridLayoutProps({ columns: "1fr 1fr", gap: 12, justify: "stretch" })).toBe(true);
		expect(isGridLayoutProps({ columns: 2, gap: 12 })).toBe(false);
		expect(isGridLayoutProps({ columns: "1fr", justify: "between" })).toBe(false);
	});

	it("guards screen node shape", () => {
		expect(isScreenNode(screenNode)).toBe(true);
		expect(isScreenRegionNode(screenNode.children[0])).toBe(true);
		expect(isScreenNode({ ...screenNode, children: screenNode.children.slice(0, 2) })).toBe(false);
		expect(
			isScreenNode({
				...screenNode,
				children: [
					{
						...screenNode.children[0],
						props: { ...screenNode.children[0].props, position: "absolute" },
					},
					screenNode.children[1],
					screenNode.children[2],
				],
			}),
		).toBe(false);
	});
});

const screenNode: ScreenNode = {
	type: "Screen",
	componentVersion: "1.0.0",
	metadata: { id: "screen-root", title: "테스트 화면" },
	children: [
		{
			type: "Screen.Header",
			componentVersion: "1.0.0",
			metadata: { id: "header", title: "헤더" },
			props: {
				position: "fixed",
				height: 56,
				layout: { direction: "column", gap: 0 },
			},
		},
		{
			type: "Screen.Contents",
			componentVersion: "1.0.0",
			metadata: { id: "contents", title: "본문" },
			props: {
				scroll: true,
				layout: { direction: "column", gap: 12, paddingX: 16 },
			},
			children: [],
		},
		{
			type: "Screen.Bottom",
			componentVersion: "1.0.0",
			metadata: { id: "bottom", title: "하단" },
			props: {
				position: "fixed",
				height: 88,
				layout: { direction: "column", gap: 0 },
			},
		},
	],
};
