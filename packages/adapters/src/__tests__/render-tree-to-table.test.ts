import { renderTreeToTableGenerationResult } from "@cx/adapters/table";
import type { RenderTreeContract, RenderTreeNodeContract } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("@cx/adapters/table render-tree-to-table", () => {
	it("decomposes final RenderTree into table-shaped comparison rows", () => {
		const renderTree: RenderTreeContract = {
			children: [
				{
					children: [
						{
							children: [
								{
									children: [
										{
											componentVersion: "0.1.0",
											layout: "layout.composite.componentAppBar",
											metadata: { id: "component-appbar", title: "AppBar" },
											props: { title: "약관 동의" },
											type: "AppBar",
										},
									],
									componentVersion: "0.1.0",
									layout: "layout.area.areaAppBar",
									metadata: { id: "area-header", title: "Header area" },
									type: "area.static",
								},
							],
							componentVersion: "0.1.0",
							layout: "layout.region.header",
							metadata: { id: "screen.header", title: "Header" },
							type: "Screen.Header",
						},
						{
							children: [],
							componentVersion: "0.1.0",
							layout: "layout.region.contents",
							metadata: { id: "screen.contents", title: "Contents" },
							type: "Screen.Contents",
						},
						{
							children: [],
							componentVersion: "0.1.0",
							layout: "layout.region.bottom",
							metadata: { id: "screen.bottom", title: "Bottom" },
							type: "Screen.Bottom",
						},
					],
					componentVersion: "0.1.0",
					layout: "layout.screen.commerceDetailScreen",
					metadata: { id: "screen", title: "Screen" },
					type: "Screen",
				},
			],
			metadata: { id: "screen" },
			version: "render-tree.v0.1",
		};

		const result = renderTreeToTableGenerationResult(renderTree);

		expect(result.tableGenerationResult.screen.screen.regions.header.children).toEqual([
			{ id: "area-header", kind: "area" },
		]);
		expect(result.tableGenerationResult.areas).toHaveLength(1);
		expect(result.tableGenerationResult.components).toContainEqual(
			expect.objectContaining({
				children: [{ component: { type: "AppBar" }, props: { title: "약관 동의" } }],
				id: "component-appbar",
				layout: "layout.composite.componentAppBar",
				type: "AppBar",
			}),
		);
	});

	it("drops non-base state nodes from default table projection", () => {
		const renderTree: RenderTreeContract = {
			children: [
				{
					children: [
						screenRegionNode("Screen.Header", "layout.region.header", []),
						screenRegionNode("Screen.Contents", "layout.region.contents", [
							{
								children: [
									{
										componentVersion: "0.1.0",
										display: { stateRole: "base" },
										layout: "layout.composite.componentListText",
										metadata: { id: "list-base", title: "Base row" },
										props: { subText: "Base row", table: "dot" },
										type: "ListText",
									},
									{
										componentVersion: "0.1.0",
										display: {
											stateRole: "loading",
											when: { bind: "terms.loading", default: false },
										},
										layout: "layout.composite.componentListText",
										metadata: { id: "list-loading", title: "Loading row" },
										props: { subText: "Loading row", table: "dot" },
										type: "ListText",
									},
								],
								componentVersion: "0.1.0",
								layout: "layout.area.listStack",
								metadata: { id: "terms-list", title: "약관 목록 조회" },
								type: "area.dynamic",
							},
						]),
						screenRegionNode("Screen.Bottom", "layout.region.bottom", [
							{
								children: [
									{
										componentVersion: "0.1.0",
										display: { stateRole: "disabled" },
										layout: "layout.composite.componentActionButton",
										metadata: { id: "cta-disabled", title: "Disabled CTA" },
										props: { label: "다음" },
										type: "ActionButton",
									},
								],
								componentVersion: "0.1.0",
								layout: "layout.area.bottomActionArea",
								metadata: { id: "bottom-area", title: "하단 액션" },
								type: "area.dynamic",
							},
						]),
					],
					componentVersion: "0.1.0",
					layout: "layout.screen.commerceDetailScreen",
					metadata: { id: "screen", title: "Screen" },
					type: "Screen",
				},
			],
			metadata: { id: "screen" },
			version: "render-tree.v0.1",
		};

		const result = renderTreeToTableGenerationResult(renderTree);

		expect(result.tableGenerationResult.components.map((component) => component.id)).toEqual([
			"list-base",
		]);
		expect(
			result.tableGenerationResult.areas.find((area) => area.id === "bottom-area")?.children,
		).toEqual([]);
		expect(result.warnings).toContain(
			"Dropped non-base state node from default table projection: list-loading",
		);
		expect(result.warnings).toContain(
			"Dropped non-base state node from default table projection: cta-disabled",
		);
	});
});

function screenRegionNode(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	layout: string,
	children: RenderTreeNodeContract[],
) {
	return {
		children,
		componentVersion: "0.1.0",
		layout,
		metadata: { id: type, title: type },
		type,
	};
}
