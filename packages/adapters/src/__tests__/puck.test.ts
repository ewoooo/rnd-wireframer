import {
	applyPuckAreaData,
	applyPuckComponentData,
	applyPuckScreenData,
	puckAreaDataToRenderTree,
	puckComponentDataToRenderTree,
	puckScreenDataToRenderTree,
	renderTreeToPuckAreaData,
	renderTreeToPuckComponentData,
	renderTreeToPuckScreenData,
	screenRegionSlotNames,
	screenRegionZoneIds,
} from "@cx/adapters/puck";
import type { RenderTreeNodeContract, RenderTreeScreenNodeContract } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("@cx/adapters/puck", () => {
	it("converts screen regions into stable Puck slot items", () => {
		const data = renderTreeToPuckScreenData(screenFixture);

		expect(data).toEqual({
			content: [],
			root: {
				props: {
					[screenRegionSlotNames.header]: [],
					[screenRegionSlotNames.contents]: [
						{
							type: "area-a",
							props: {
								id: "area-a",
								itemKind: "screen-region-child",
								nodeId: "area-a",
								nodePropsJson: "{}",
								title: "Area A",
							},
						},
						{
							type: "area-b",
							props: {
								id: "area-b",
								itemKind: "screen-region-child",
								nodeId: "area-b",
								nodePropsJson: "{}",
								title: "Area B",
							},
						},
					],
					[screenRegionSlotNames.bottom]: [],
				},
			},
			zones: {},
		});
	});

	it("keeps reading legacy screen region zones while applying Puck data", () => {
		const result = applyPuckScreenData({
			screen: screenFixture,
			data: {
				content: [],
				root: { props: {} },
				zones: {
					[screenRegionZoneIds.header]: [],
					[screenRegionZoneIds.contents]: [
						{
							type: "area-a",
							props: { id: "area-a", itemKind: "screen-region-child", nodeId: "area-a" },
						},
						{
							type: "area-b",
							props: { id: "area-b", itemKind: "screen-region-child", nodeId: "area-b" },
						},
					],
					[screenRegionZoneIds.bottom]: [],
				},
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children[1].children.map((child) => child.metadata.id)).toEqual([
			"area-a",
			"area-b",
		]);
	});

	it("applies Puck screen order as a full RenderTree candidate without mutating the source", () => {
		const result = applyPuckScreenData({
			screen: screenFixture,
			data: {
				...renderTreeToPuckScreenData(screenFixture),
				root: {
					props: {
						[screenRegionSlotNames.header]: [],
						[screenRegionSlotNames.contents]: [
							{
								type: "area-b",
								props: { id: "area-b", itemKind: "screen-region-child", nodeId: "area-b" },
							},
							{
								type: "area-a",
								props: { id: "area-a", itemKind: "screen-region-child", nodeId: "area-a" },
							},
						],
						[screenRegionSlotNames.bottom]: [],
					},
				},
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children[1].children.map((child) => child.metadata.id)).toEqual([
			"area-b",
			"area-a",
		]);
		expect(screenFixture.children[1].children.map((child) => child.metadata.id)).toEqual([
			"area-a",
			"area-b",
		]);
	});

	it("excludes unmentioned screen children and reports unknown or duplicate Puck items", () => {
		const result = applyPuckScreenData({
			screen: screenFixture,
			data: {
				root: {
					props: {
						[screenRegionSlotNames.header]: [],
						[screenRegionSlotNames.contents]: [
							{
								type: "missing",
								props: { id: "missing", itemKind: "screen-region-child", nodeId: "missing" },
							},
							{
								type: "area-b",
								props: { id: "area-b", itemKind: "screen-region-child", nodeId: "area-b" },
							},
							{
								type: "area-b",
								props: {
									id: "area-b-duplicate",
									itemKind: "screen-region-child",
									nodeId: "area-b",
								},
							},
						],
						[screenRegionSlotNames.bottom]: [],
					},
				},
				zones: {},
				content: [],
			},
		});

		expect(result.diagnostics).toEqual([
			{ code: "unknown_node", id: "missing", severity: "warning" },
			{ code: "duplicate_node", id: "area-b", severity: "warning" },
		]);
		expect(result.node.children[1].children.map((child) => child.metadata.id)).toEqual(["area-b"]);
	});

	it("moves screen children across header, contents, and bottom zones", () => {
		const result = applyPuckScreenData({
			screen: screenFixture,
			data: {
				...renderTreeToPuckScreenData(screenFixture),
				root: {
					props: {
						[screenRegionSlotNames.header]: [
							{
								type: "area-a",
								props: { id: "area-a", itemKind: "screen-region-child", nodeId: "area-a" },
							},
						],
						[screenRegionSlotNames.contents]: [],
						[screenRegionSlotNames.bottom]: [
							{
								type: "area-b",
								props: { id: "area-b", itemKind: "screen-region-child", nodeId: "area-b" },
							},
						],
					},
				},
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children[0].children?.map((child) => child.metadata.id)).toEqual(["area-a"]);
		expect(result.node.children[1].children.map((child) => child.metadata.id)).toEqual([]);
		expect(result.node.children[2].children?.map((child) => child.metadata.id)).toEqual(["area-b"]);
	});

	it("converts and reorders area component children", () => {
		const area = screenFixture.children[1].children[0];
		const data = renderTreeToPuckAreaData(area);

		expect(data.content.map((item) => item.props.nodeId)).toEqual(["component-a", "component-b"]);

		const result = applyPuckAreaData({
			area,
			data: {
				...data,
				content: [
					{
						type: "component-b",
						props: { id: "component-b", itemKind: "area-child", nodeId: "component-b" },
					},
					{
						type: "component-a",
						props: { id: "component-a", itemKind: "area-child", nodeId: "component-a" },
					},
				],
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children?.map((child) => child.metadata.id)).toEqual([
			"component-b",
			"component-a",
		]);
		expect(area.children?.map((child) => child.metadata.id)).toEqual([
			"component-a",
			"component-b",
		]);
	});

	it("mounts inserted catalog items as temporary RenderTree nodes", () => {
		const area = screenFixture.children[1].children[0];
		const result = applyPuckAreaData({
			area,
			catalogItems: [
				{
					defaultProps: { label: "추가 버튼", variant: "primary" },
					nodeType: "Button",
					puckType: "catalog:Button",
					title: "Button",
				},
			],
			data: {
				...renderTreeToPuckAreaData(area),
				content: [
					{
						type: "component-a",
						props: { id: "component-a", itemKind: "area-child", nodeId: "component-a" },
					},
					{
						type: "catalog:Button",
						props: {
							id: "inserted-button",
							itemKind: "area-child",
							nodeId: "inserted-button",
							nodePropsJson: JSON.stringify({ label: "수정된 버튼" }),
							title: "Mounted Button",
						},
					},
				],
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children?.map((child) => child.metadata.id)).toEqual([
			"component-a",
			"tmp:inserted-button",
		]);
		expect(result.node.children?.[1]).toMatchObject({
			metadata: { title: "Mounted Button" },
			props: { label: "수정된 버튼" },
			type: "Button",
		});
	});

	it("applies edited title and props JSON from Puck data", () => {
		const area = screenFixture.children[1].children[0];
		const result = applyPuckAreaData({
			area,
			data: {
				...renderTreeToPuckAreaData(area),
				content: [
					{
						type: "component-a",
						props: {
							id: "component-a",
							itemKind: "area-child",
							nodeId: "component-a",
							nodePropsJson: JSON.stringify({ label: "고객명" }),
							title: "Edited Component A",
						},
					},
					{
						type: "component-b",
						props: {
							id: "component-b",
							itemKind: "area-child",
							nodeId: "component-b",
							nodePropsJson: "{}",
						},
					},
				],
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children?.[0]).toMatchObject({
			metadata: { title: "Edited Component A" },
			props: { label: "고객명" },
		});
	});

	it("merges typed Puck field props into RenderTree props", () => {
		const area = screenFixture.children[1].children[0];
		const result = applyPuckAreaData({
			area,
			data: {
				...renderTreeToPuckAreaData(area),
				content: [
					{
						type: "component-b",
						props: {
							id: "component-b",
							itemKind: "area-child",
							label: "typed label",
							nodeId: "component-b",
							nodePropsJson: JSON.stringify({ label: "json label", size: "medium" }),
							variant: "primary",
						},
					},
				],
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children?.[0]?.props).toEqual({
			label: "typed label",
			size: "medium",
			variant: "primary",
		});
	});

	it("reports invalid props JSON without mutating the node props", () => {
		const area = screenFixture.children[1].children[0];
		const result = applyPuckAreaData({
			area,
			data: {
				...renderTreeToPuckAreaData(area),
				content: [
					{
						type: "component-a",
						props: {
							id: "component-a",
							itemKind: "area-child",
							nodeId: "component-a",
							nodePropsJson: "{",
						},
					},
				],
			},
		});

		expect(result.diagnostics).toContainEqual({
			code: "invalid_node_props_json",
			id: "component-a",
			severity: "error",
		});
		expect(result.node.children?.[0]?.props).toBeUndefined();
	});

	it("keeps compatibility wrappers for callers that only need the candidate node", () => {
		expect(
			puckScreenDataToRenderTree({
				screen: screenFixture,
				data: renderTreeToPuckScreenData(screenFixture),
			}).type,
		).toBe("Screen");
		expect(
			puckAreaDataToRenderTree({
				area: screenFixture.children[1].children[0],
				data: renderTreeToPuckAreaData(screenFixture.children[1].children[0]),
			}).type,
		).toBe("area.static");
		expect(
			puckComponentDataToRenderTree({
				component: componentWrapperFixture,
				data: renderTreeToPuckComponentData({ component: componentWrapperFixture }),
			}).type,
		).toBe("ComponentWrapper");
	});

	it("converts component child rows into Puck items and reorders component children", () => {
		const data = renderTreeToPuckComponentData({
			component: componentWrapperFixture,
			componentChildren: [
				{
					catalog_component_type: "TextField",
					component_id: "component-wrapper",
					id: "component-child-a",
					order_index: 0,
					props: { label: "이름" },
				},
				{
					catalog_component_type: "Button",
					component_id: "component-wrapper",
					id: "component-child-b",
					order_index: 1,
					props: { label: "확인" },
				},
			],
		});

		expect(data.content.map((item) => item.props)).toMatchObject([
			{
				itemKind: "component-child",
				nodeId: "component-wrapper.0",
			},
			{
				itemKind: "component-child",
				nodeId: "component-wrapper.1",
			},
		]);

		const result = applyPuckComponentData({
			component: componentWrapperFixture,
			data: {
				...data,
				content: [data.content[1], data.content[0]],
			},
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.node.children?.map((child) => child.metadata.id)).toEqual([
			"component-wrapper.1",
			"component-wrapper.0",
		]);
	});
});

const componentA = createNode({
	id: "component-a",
	title: "Component A",
	type: "TextField",
});

const componentB = createNode({
	id: "component-b",
	title: "Component B",
	type: "Button",
});

const componentWrapperFixture = createNode({
	children: [
		createNode({
			id: "component-wrapper.0",
			props: { label: "이름" },
			title: "TextField",
			type: "TextField",
		}),
		createNode({
			id: "component-wrapper.1",
			props: { label: "확인" },
			title: "Button",
			type: "Button",
		}),
	],
	id: "component-wrapper",
	title: "Component wrapper",
	type: "ComponentWrapper",
});

const areaA = createNode({
	children: [componentA, componentB],
	id: "area-a",
	layout: "layout.area.stack",
	title: "Area A",
	type: "area.static",
});

const areaB = createNode({
	id: "area-b",
	layout: "layout.area.stack",
	title: "Area B",
	type: "area.static",
});

const screenFixture = {
	type: "Screen",
	componentVersion: "1.0.0",
	layout: "layout.screen.shell",
	metadata: {
		id: "screen-1",
		title: "Screen",
	},
	children: [
		{
			type: "Screen.Header",
			componentVersion: "0.1.0",
			metadata: {
				id: "screen-1.header",
				title: "Header",
			},
			children: [],
		},
		{
			type: "Screen.Contents",
			componentVersion: "0.1.0",
			metadata: {
				id: "screen-1.contents",
				title: "Contents",
			},
			children: [areaA, areaB],
		},
		{
			type: "Screen.Bottom",
			componentVersion: "0.1.0",
			metadata: {
				id: "screen-1.bottom",
				title: "Bottom",
			},
			children: [],
		},
	],
} satisfies RenderTreeScreenNodeContract;

function createNode(input: {
	children?: RenderTreeNodeContract[];
	id: string;
	layout?: string;
	props?: RenderTreeNodeContract["props"];
	title: string;
	type: string;
}): RenderTreeNodeContract {
	return {
		type: input.type,
		componentVersion: "1.0.0",
		layout: input.layout,
		metadata: {
			id: input.id,
			title: input.title,
		},
		props: input.props,
		children: input.children,
	};
}
