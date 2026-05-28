import type { RenderTreeScreenNode } from "@cx/renderer";
import { describe, expect, it } from "vitest";
import { materializeTableScreen, materializeTableScreens, type TableScreenData } from "../index";

describe("@cx/table-materializer", () => {
	it("materializes table records into a renderer-compatible screen node", () => {
		const node = materializeTableScreen({ screenId: "screen-1", tables: tableFixture });
		const renderable: RenderTreeScreenNode | undefined = node;

		expect(renderable?.type).toBe("Screen");
		expect(renderable?.layout).toBe("layout.screen.screenShell");
		expect(renderable?.children[0]).toMatchObject({
			type: "Screen.Header",
			layout: "layout.region.plainStack",
		});
		expect(renderable?.children[1].children[0]).toMatchObject({
			type: "area.static",
			layout: "layout.area.fieldStack",
		});
		expect(renderable?.children[1].children[0]?.children?.[0]).toMatchObject({
			type: "TextField",
			layout: "layout.composite.componentTextField",
			props: { label: "이름" },
		});
	});

	it("materializes every screen without file IO", () => {
		expect(materializeTableScreens(tableFixture)).toHaveLength(1);
	});
});

const tableFixture = {
	screens: {
		screens: [
			{
				id: "screen-1",
				version: "1.0.0",
				layout: "layout.screen.screenShell",
				metadata: { title: "테이블 화면" },
				screen: {
					regions: {
						header: {
							type: "Screen.Header",
							layout: "layout.region.plainStack",
							metadata: { title: "Header" },
							children: [],
						},
						contents: {
							type: "Screen.Contents",
							layout: "layout.region.plainStack",
							metadata: { title: "Contents" },
							children: [{ kind: "area", id: "field-area" }],
						},
						bottom: {
							type: "Screen.Bottom",
							layout: "layout.region.plainStack",
							metadata: { title: "Bottom" },
							children: [],
						},
					},
				},
			},
		],
	},
	areas: {
		areas: [
			{
				id: "field-area",
				type: "area.static",
				version: "1.0.0",
				layout: "layout.area.fieldStack",
				metadata: { title: "Field area" },
				children: [{ kind: "component", id: "name-field" }],
			},
		],
	},
	components: {
		components: [
			{
				id: "name-field",
				type: "TextField",
				version: "1.0.0",
				layout: "layout.composite.componentTextField",
				metadata: { title: "Name field" },
				children: [
					{
						component: { type: "TextField" },
						props: { label: "이름" },
					},
				],
			},
		],
	},
} satisfies TableScreenData;
