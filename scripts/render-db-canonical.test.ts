import { describe, expect, it } from "vitest";
import { canonicalizeRenderProjection, type RenderProjection } from "./render-db-canonical";

describe("render DB canonicalization", () => {
	it("deduplicates component and area rows by structural signatures", () => {
		const result = canonicalizeRenderProjection(projectionFixture);

		expect(result.report.componentDuplicateGroups).toHaveLength(1);
		expect(result.report.componentDuplicateGroups[0]).toMatchObject({
			count: 2,
			ids: ["appbar-a", "appbar-b"],
		});
		expect(result.report.areaDuplicateGroups).toHaveLength(1);
		expect(result.report.areaDuplicateGroups[0]).toMatchObject({
			count: 2,
			ids: ["area-a", "area-b"],
		});

		const canonicalComponentId = result.report.componentDuplicateGroups[0]?.canonicalId;
		const canonicalAreaId = result.report.areaDuplicateGroups[0]?.canonicalId;
		expect(canonicalComponentId).toMatch(/^component\.app-bar\.[a-f0-9]{12}$/);
		expect(canonicalAreaId).toMatch(/^area\.area-app-bar\.[a-f0-9]{12}$/);

		expect(result.projection.components.map((row) => row.id)).toContain(canonicalComponentId);
		expect(result.projection.areas.map((row) => row.id)).toContain(canonicalAreaId);
		expect(result.projection.areaChildren).toEqual([
			{
				area_id: canonicalAreaId,
				component_id: canonicalComponentId,
				order_index: 0,
			},
		]);
		expect(result.projection.screenRegionChildren).toEqual([
			{
				area_id: canonicalAreaId,
				order_index: 0,
				screen_region_id: "screen-a.header",
			},
			{
				area_id: canonicalAreaId,
				order_index: 0,
				screen_region_id: "screen-b.header",
			},
		]);
	});
});

const projectionFixture = {
	areaChildren: [
		{
			area_id: "area-a",
			component_id: "appbar-a",
			order_index: 0,
		},
		{
			area_id: "area-b",
			component_id: "appbar-b",
			order_index: 0,
		},
	],
	areas: [
		{
			id: "area-a",
			layout_id: "layout.area.areaAppBar",
			name: "상단 앱 바 영역",
			props: { name: "상단 앱 바 영역" },
			type: "area_static",
			version: "1.0.0",
		},
		{
			id: "area-b",
			layout_id: "layout.area.areaAppBar",
			name: "다른 화면 상단 앱 바 영역",
			props: { name: "상단 앱 바 영역" },
			type: "area_static",
			version: "1.0.0",
		},
	],
	componentChildren: [
		{
			catalog_component_type: "AppBar",
			component_id: "appbar-a",
			order_index: 0,
			props: { showBack: true, showLogo: false, title: "본인인증" },
			variant: null,
		},
		{
			catalog_component_type: "AppBar",
			component_id: "appbar-b",
			order_index: 0,
			props: { showBack: true, showLogo: false, title: "본인인증" },
			variant: null,
		},
	],
	components: [
		{
			id: "appbar-a",
			layout_id: "layout.composite.componentAppBar",
			name: "본인인증 상단 앱 바",
			type: "AppBar",
			version: "1.0.0",
		},
		{
			id: "appbar-b",
			layout_id: "layout.composite.componentAppBar",
			name: "본인인증 상단 앱 바",
			type: "AppBar",
			version: "1.0.0",
		},
	],
	rowCounts: {},
	screenRegionChildren: [
		{
			area_id: "area-a",
			order_index: 0,
			screen_region_id: "screen-a.header",
		},
		{
			area_id: "area-b",
			order_index: 0,
			screen_region_id: "screen-b.header",
		},
	],
	screenRegions: [],
	screenRoutes: [],
	screenVariants: [],
	screens: [],
} satisfies RenderProjection;
