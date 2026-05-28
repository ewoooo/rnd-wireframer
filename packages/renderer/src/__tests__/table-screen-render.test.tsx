import { TableScreenView } from "@cx/renderer";
import { materializeTableScreen, type TableScreenData } from "@cx/renderer/table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("@cx/renderer table screen rendering", () => {
	it("materializes table records into a RenderTree screen", () => {
		const node = materializeTableScreen({ screenId: "screen-1", tables: tableFixture });

		expect(node?.type).toBe("Screen");
		expect(node?.layout).toBe("layout.screen.screenShell");
		expect(node?.children[0].type).toBe("Screen.Header");
		expect(node?.children[0].layout).toBe("layout.region.plainStack");
		expect(node?.children[0].children?.[0]).toMatchObject({
			type: "area.static",
			layout: "layout.area.areaAppBar",
		});
		expect(node?.children[0].children?.[0]?.children?.[0]).toMatchObject({
			type: "AppBar",
			layout: "layout.composite.componentAppBar",
		});
	});

	it("renders table records through layout pattern wrappers and leaf components", () => {
		render(<TableScreenView screenId="screen-1" tables={tableFixture} />);

		const title = screen.getByText("테이블 화면");
		const appbarLayout = title.closest("[data-node-id='appbar']");
		const contentsArea = screen.getByText("약관 항목").closest("[data-node-id='contents-area']");

		expect(appbarLayout).toBeInTheDocument();
		expect(screen.getByText("약관 항목")).toBeInTheDocument();
		expect(contentsArea).toHaveAttribute("data-node-type", "PageStack");
		expect(contentsArea).toHaveStyle({ paddingBlock: "28px", paddingInline: "12px" });
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
							children: [{ kind: "area", id: "header-area" }],
						},
						contents: {
							type: "Screen.Contents",
							layout: "layout.region.plainStack",
							metadata: { title: "Contents" },
							children: [{ kind: "area", id: "contents-area" }],
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
				id: "header-area",
				type: "area.static",
				version: "1.0.0",
				layout: "layout.area.areaAppBar",
				metadata: { title: "Header area" },
				props: { hideTitle: true },
				children: [{ kind: "component", id: "appbar" }],
			},
			{
				id: "contents-area",
				type: "area.static",
				version: "1.0.0",
				layout: "layout.area.accordionList",
				metadata: { title: "Contents area" },
				props: { hideTitle: true },
				children: [{ kind: "component", id: "list-cell" }],
			},
		],
	},
	components: {
		components: [
			{
				id: "appbar",
				type: "AppBar",
				version: "1.0.0",
				layout: "layout.composite.componentAppBar",
				metadata: { title: "App bar" },
				children: [
					{
						component: { type: "AppBar" },
						props: { title: "테이블 화면", showBack: true },
					},
				],
			},
			{
				id: "list-cell",
				type: "list-cell",
				version: "1.0.0",
				layout: "layout.composite.componentListCell",
				metadata: { title: "List cell" },
				children: [
					{
						component: { type: "list-cell" },
						props: { title: "약관 항목", description: "설명" },
					},
				],
			},
		],
	},
} satisfies TableScreenData;
