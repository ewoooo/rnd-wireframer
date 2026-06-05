import { materializeRenderScreenFromRows, type RenderReadModelRows } from "@cx/adapters/table";
import type { RenderTreeScreenNodeContract } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("@cx/adapters/table", () => {
	it("materializes screen DB rows into a renderer-compatible screen node", () => {
		const result = materializeRenderScreenFromRows({
			rows: renderRowsFixture,
			screenId: "screen-1",
		});
		const renderable: RenderTreeScreenNodeContract | undefined = result.node;

		expect(result.diagnostics).toEqual([]);
		expect(renderable?.type).toBe("Screen");
		expect(renderable?.layout).toBe("layout.screen.screenShell");
		expect(renderable?.children.map((child) => child.type)).toEqual([
			"Screen.Header",
			"Screen.Contents",
			"Screen.Bottom",
		]);
		expect(renderable?.children[1].children[0]).toMatchObject({
			type: "area.static",
			layout: "layout.area.fieldStack",
			props: { divider: true },
		});
		const componentWrapper = renderable?.children[1].children[0]?.children?.[0];
		expect(componentWrapper).toMatchObject({
			type: "TextField",
			layout: "layout.composite.componentTextField",
		});
		expect(componentWrapper?.children?.map((child) => child.type)).toEqual(["TextField", "Button"]);
		expect(componentWrapper?.children?.[1]?.props).toEqual({
			label: "확인",
			variant: "secondary",
		});
	});

	it("materializes child variant into props when props does not already define variant", () => {
		const result = materializeRenderScreenFromRows({
			rows: {
				...renderRowsFixture,
				areaChildren: [{ area_id: "field-area", component_id: "badge", order_index: 0 }],
				componentChildren: [
					{
						catalog_component_type: "Badge",
						component_id: "badge",
						order_index: 0,
						props: { children: "가입가능" },
						variant: "blue",
					},
				],
				components: [
					{
						id: "badge",
						layout_id: "layout.composite.componentBadge",
						name: "Badge",
						type: "Badge",
						version: "1.0.0",
					},
				],
			},
			screenId: "screen-1",
		});

		expect(result.node?.children[1].children[0]?.children?.[0]?.props).toEqual({
			children: "가입가능",
			variant: "blue",
		});
	});

	it("reports missing references instead of silently dropping children", () => {
		const result = materializeRenderScreenFromRows({
			rows: {
				...renderRowsFixture,
				areas: [],
			},
			screenId: "screen-1",
		});

		expect(result.node).toBeDefined();
		expect(result.diagnostics).toContainEqual({
			code: "missing_area",
			id: "field-area",
			parentId: "screen-1.contents",
			severity: "error",
		});
	});
});

const renderRowsFixture = {
	areaChildren: [
		{
			area_id: "field-area",
			component_id: "name-field",
			order_index: 0,
		},
	],
	areas: [
		{
			id: "field-area",
			layout_id: "layout.area.fieldStack",
			name: "Field area",
			props: { divider: true },
			type: "area_static",
			version: "1.0.0",
		},
	],
	componentChildren: [
		{
			catalog_component_type: "TextField",
			component_id: "name-field",
			order_index: 0,
			props: { label: "이름" },
		},
		{
			catalog_component_type: "Button",
			component_id: "name-field",
			order_index: 1,
			props: { label: "확인" },
			variant: "secondary",
		},
	],
	components: [
		{
			id: "name-field",
			layout_id: "layout.composite.componentTextField",
			name: "Name field",
			type: "TextField",
			version: "1.0.0",
		},
	],
	screenRegionChildren: [
		{
			area_id: "field-area",
			order_index: 0,
			screen_region_id: "screen-1.contents",
		},
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
			layout_id: "layout.screen.screenShell",
			name: "테이블 화면",
			screen_variant_id: "variant-1",
			type: "page",
			version: "1.0.0",
		},
	],
} satisfies RenderReadModelRows;
