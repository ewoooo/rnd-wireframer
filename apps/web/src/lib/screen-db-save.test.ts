import type { RenderReadModelRows } from "@cx/adapters/table";
import type { RenderTreeScreenNodeContract } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { projectScreenTreeOrder } from "./screen-db-save";

describe("screen-db-save", () => {
	it("projects a RenderTree candidate into reorder-only screen DB child rows", () => {
		const result = projectScreenTreeOrder({
			node: {
				...screenNode,
				children: [
					screenNode.children[0],
					{
						...screenNode.children[1],
						children: [
							areaB,
							{
								...areaA,
								children: [{ ...componentB, props: { label: "수정된 버튼" } }, componentA],
							},
						],
					},
					screenNode.children[2],
				],
			},
			rows,
			screenId: "screen-1",
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.screenRegionChildren).toEqual([
			{
				area_id: "area-b",
				order_index: 0,
				screen_region_id: "screen-1.contents",
			},
			{
				area_id: "area-a",
				order_index: 1,
				screen_region_id: "screen-1.contents",
			},
		]);
		expect(result.areaChildren).toEqual([
			{
				area_id: "area-b",
				component_id: "component-c",
				order_index: 0,
			},
			{
				area_id: "area-a",
				component_id: "component-b",
				order_index: 0,
			},
			{
				area_id: "area-a",
				component_id: "component-a",
				order_index: 1,
			},
		]);
		expect(result.componentChildren).toEqual([
			{
				catalog_component_type: "ListCell",
				component_id: "component-c",
				order_index: 0,
				props: null,
				variant: "default",
			},
			{
				catalog_component_type: "Button",
				component_id: "component-b",
				order_index: 0,
				props: { label: "수정된 버튼" },
				variant: "primary",
			},
			{
				catalog_component_type: "TextField",
				component_id: "component-a",
				order_index: 0,
				props: null,
				variant: null,
			},
		]);
	});

	it("reports errors before writing rows when candidate nodes are unknown", () => {
		const result = projectScreenTreeOrder({
			node: {
				...screenNode,
				children: [
					screenNode.children[0],
					{
						...screenNode.children[1],
						children: [
							{
								...areaA,
								children: [
									{
										componentVersion: "1.0.0",
										metadata: { id: "missing-component", title: "Missing" },
										type: "TextField",
									},
								],
							},
						],
					},
					screenNode.children[2],
				],
			},
			rows,
			screenId: "screen-1",
		});

		expect(result.diagnostics).toContainEqual({
			code: "missing_component",
			id: "missing-component",
			parentId: "area-a",
			severity: "error",
		});
	});
});

const componentA = {
	componentVersion: "1.0.0",
	metadata: { id: "component-a", title: "Component A" },
	type: "TextField",
};

const componentB = {
	componentVersion: "1.0.0",
	metadata: { id: "component-b", title: "Component B" },
	type: "Button",
};

const componentC = {
	componentVersion: "1.0.0",
	metadata: { id: "component-c", title: "Component C" },
	type: "ListCell",
};

const areaA = {
	children: [componentA, componentB],
	componentVersion: "1.0.0",
	metadata: { id: "area-a", title: "Area A" },
	type: "area.static",
};

const areaB = {
	children: [componentC],
	componentVersion: "1.0.0",
	metadata: { id: "area-b", title: "Area B" },
	type: "area.static",
};

const screenNode = {
	children: [
		{
			children: [],
			componentVersion: "0.1.0",
			metadata: { id: "screen-1.header", title: "Header" },
			type: "Screen.Header",
		},
		{
			children: [areaA, areaB],
			componentVersion: "0.1.0",
			metadata: { id: "screen-1.contents", title: "Contents" },
			type: "Screen.Contents",
		},
		{
			children: [],
			componentVersion: "0.1.0",
			metadata: { id: "screen-1.bottom", title: "Bottom" },
			type: "Screen.Bottom",
		},
	],
	componentVersion: "1.0.0",
	metadata: { id: "screen-1", title: "Screen" },
	type: "Screen",
} satisfies RenderTreeScreenNodeContract;

const rows = {
	areaChildren: [
		{ area_id: "area-a", component_id: "component-a", order_index: 0 },
		{ area_id: "area-a", component_id: "component-b", order_index: 1 },
		{ area_id: "area-b", component_id: "component-c", order_index: 0 },
	],
	areas: [
		{
			id: "area-a",
			layout_id: "layout.area.stack",
			name: "Area A",
			type: "area_static",
		},
		{
			id: "area-b",
			layout_id: "layout.area.stack",
			name: "Area B",
			type: "area_static",
		},
	],
	componentChildren: [
		{
			catalog_component_type: "TextField",
			component_id: "component-a",
			order_index: 0,
			props: { label: "이름" },
		},
		{
			catalog_component_type: "Button",
			component_id: "component-b",
			order_index: 0,
			props: { label: "확인" },
			variant: "primary",
		},
		{
			catalog_component_type: "ListCell",
			component_id: "component-c",
			order_index: 0,
			variant: "default",
		},
	],
	components: [
		{
			id: "component-a",
			layout_id: "layout.composite.textField",
			name: "Component A",
			type: "TextField",
		},
		{
			id: "component-b",
			layout_id: "layout.composite.button",
			name: "Component B",
			type: "Button",
		},
		{
			id: "component-c",
			layout_id: "layout.composite.listCell",
			name: "Component C",
			type: "ListCell",
		},
	],
	screenRegionChildren: [
		{ area_id: "area-a", order_index: 0, screen_region_id: "screen-1.contents" },
		{ area_id: "area-b", order_index: 1, screen_region_id: "screen-1.contents" },
	],
	screenRegions: [
		{
			id: "screen-1.header",
			layout_id: "layout.region.header",
			screen_id: "screen-1",
			type: "header",
		},
		{
			id: "screen-1.contents",
			layout_id: "layout.region.contents",
			screen_id: "screen-1",
			type: "contents",
		},
		{
			id: "screen-1.bottom",
			layout_id: "layout.region.bottom",
			screen_id: "screen-1",
			type: "bottom",
		},
	],
	screens: [
		{
			id: "screen-1",
			layout_id: "layout.screen.shell",
			name: "Screen",
			screen_variant_id: "variant-1",
			type: "page",
		},
	],
} satisfies RenderReadModelRows;
