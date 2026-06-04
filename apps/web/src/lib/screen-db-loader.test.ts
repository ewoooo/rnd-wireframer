import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listPuckCatalogItems } from "./puck-catalog-loader";
import {
	listScreenRoutes,
	listScreens,
	loadScreenRows,
	loadScreenTree,
} from "./screen-db-loader";

const originalEnv = process.env;

describe("screen-db-loader", () => {
	beforeEach(() => {
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
		};
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		process.env = originalEnv;
	});

	it("lists screen routes and screen summaries from the screen DB", async () => {
		stubFetch(screenDbResponses);

		await expect(listScreenRoutes()).resolves.toEqual([
			{
				id: "route-1",
				moduleId: "mbr",
				name: "회원",
				order: 1,
				processId: "process-1",
			},
		]);

		await expect(listScreens()).resolves.toMatchObject([
			{
				id: "screen-1",
				route: "회원",
				screenRouteId: "route-1",
				screenVariantId: "variant-1",
				status: "screen-db",
				title: "약관 동의",
			},
		]);
	});

	it("loads a complete row bundle and materializes a screen tree", async () => {
		stubFetch(screenDbResponses);

		const rows = await loadScreenRows("screen-1");
		expect(rows.screens).toHaveLength(1);
		expect(rows.screenRegions).toHaveLength(3);
		expect(rows.areas).toHaveLength(1);
		expect(rows.components).toHaveLength(1);
		expect(rows.screenRegionChildren[0]?.id).toBe("screen-region-child-1");
		expect(rows.areaChildren[0]?.id).toBe("area-child-1");
		expect(rows.componentChildren[0]?.id).toBe("component-child-1");

		const result = await loadScreenTree("screen-1");
		expect(result.diagnostics).toEqual([]);
		expect(result.node).toMatchObject({
			type: "Screen",
			metadata: { id: "screen-1", title: "약관 동의" },
			children: [
				{ type: "Screen.Header" },
				{
					type: "Screen.Contents",
					children: [
						{
							type: "area.static",
							children: [{ type: "TextField", props: { label: "이름" } }],
						},
					],
				},
				{ type: "Screen.Bottom" },
			],
		});
	});

	it("does not fetch child tables when no parent ids are returned", async () => {
		const requests: string[] = [];
		stubFetch(
			{
				"/rest/v1/render_screens": [],
				"/rest/v1/render_screen_regions": [],
			},
			requests,
		);

		const rows = await loadScreenRows("missing-screen");
		expect(rows).toMatchObject({
			areaChildren: [],
			areas: [],
			componentChildren: [],
			components: [],
			screenRegionChildren: [],
			screenRegions: [],
			screens: [],
		});
		expect(requests.map((request) => new URL(request).pathname)).toEqual([
			"/rest/v1/render_screens",
			"/rest/v1/render_screen_regions",
		]);
	});

	it("lists Puck catalog items from DB area and component rows", async () => {
		stubFetch(screenDbResponses);

		await expect(listPuckCatalogItems("screen-region")).resolves.toEqual([
			{
				componentVersion: "1.0.0",
				defaultChildren: [
					{
						componentVersion: "1.0.0",
						layout: "layout.composite.componentTextField",
						metadata: { id: "component-1", title: "이름 입력" },
						props: { label: "이름" },
						type: "TextField",
					},
				],
				defaultProps: { divider: true },
				nodeId: "area-1",
				nodeType: "area.static",
				puckType: "catalog:area:area-1",
				title: "입력 영역",
			},
		]);

		await expect(listPuckCatalogItems("area")).resolves.toEqual([
			{
				componentVersion: "1.0.0",
				defaultProps: { label: "이름" },
				nodeId: "component-1",
				nodeType: "TextField",
				puckType: "catalog:component:component-1",
				title: "이름 입력",
			},
		]);
	});
});

type ResponseMap = Record<string, unknown[]>;

const screenDbResponses: ResponseMap = {
	"/rest/v1/render_area_children": [
		{
			area_id: "area-1",
			component_id: "component-1",
			id: "area-child-1",
			order_index: 0,
		},
	],
	"/rest/v1/render_areas": [
		{
			id: "area-1",
			layout_id: "layout.area.fieldStack",
			name: "입력 영역",
			props: { divider: true },
			type: "area_static",
			version: "1.0.0",
		},
	],
	"/rest/v1/render_component_children": [
		{
			catalog_component_type: "TextField",
			component_id: "component-1",
			id: "component-child-1",
			order_index: 0,
			props: { label: "이름" },
		},
	],
	"/rest/v1/render_components": [
		{
			id: "component-1",
			layout_id: "layout.composite.componentTextField",
			name: "이름 입력",
			type: "TextField",
			version: "1.0.0",
		},
	],
	"/rest/v1/render_screen_region_children": [
		{
			area_id: "area-1",
			id: "screen-region-child-1",
			order_index: 0,
			screen_region_id: "screen-1.contents",
		},
	],
	"/rest/v1/render_screen_regions": [
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
	"/rest/v1/render_screen_routes": [
		{
			id: "route-1",
			module_id: "mbr",
			name: "회원",
			order_index: 1,
			process_id: "process-1",
		},
	],
	"/rest/v1/render_screen_variants": [
		{
			id: "variant-1",
			name: "약관 동의",
			order_index: 1,
			screen_route_id: "route-1",
			type: "base",
		},
	],
	"/rest/v1/render_screens": [
		{
			id: "screen-1",
			layout_id: "layout.screen.screenShell",
			name: "약관 동의",
			order_index: 0,
			screen_variant_id: "variant-1",
			type: "page",
			version: "1.0.0",
		},
	],
};

function stubFetch(responses: ResponseMap, requests: string[] = []) {
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: string | URL) => {
			const url = new URL(String(input));
			requests.push(url.toString());
			const body = responses[url.pathname];
			if (!body) {
				return new Response(JSON.stringify({ error: `Unexpected request: ${url.pathname}` }), {
					status: 404,
				});
			}
			return Response.json(body);
		}),
	);
}
