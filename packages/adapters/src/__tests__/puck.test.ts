import {
	applyPuckAreaData,
	applyPuckScreenData,
	puckAreaDataToRenderTree,
	puckScreenDataToRenderTree,
	renderTreeToPuckAreaData,
	renderTreeToPuckScreenData,
} from "@cx/adapters/puck";
import type { RenderTreeNodeContract, RenderTreeScreenNodeContract } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("@cx/adapters/puck", () => {
	it("converts Screen.Contents area children into stable Puck items", () => {
		const data = renderTreeToPuckScreenData(screenFixture);

		expect(data).toEqual({
			content: [
				{
					type: "area-a",
					props: {
						id: "area-a",
						nodeId: "area-a",
						nodePropsJson: "{}",
						title: "Area A",
					},
				},
				{
					type: "area-b",
					props: {
						id: "area-b",
						nodeId: "area-b",
						nodePropsJson: "{}",
						title: "Area B",
					},
				},
			],
			root: { props: {} },
			zones: {},
		});
	});

	it("applies Puck screen order as a full RenderTree candidate without mutating the source", () => {
		const result = applyPuckScreenData({
			screen: screenFixture,
			data: {
				...renderTreeToPuckScreenData(screenFixture),
				content: [
					{ type: "area-b", props: { id: "area-b", nodeId: "area-b" } },
					{ type: "area-a", props: { id: "area-a", nodeId: "area-a" } },
				],
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

	it("keeps unmentioned screen children and reports unknown or duplicate Puck items", () => {
		const result = applyPuckScreenData({
			screen: screenFixture,
			data: {
				root: { props: {} },
				zones: {},
				content: [
					{ type: "missing", props: { id: "missing", nodeId: "missing" } },
					{ type: "area-b", props: { id: "area-b", nodeId: "area-b" } },
					{ type: "area-b", props: { id: "area-b-duplicate", nodeId: "area-b" } },
				],
			},
		});

		expect(result.diagnostics).toEqual([
			{ code: "unknown_node", id: "missing", severity: "warning" },
			{ code: "duplicate_node", id: "area-b", severity: "warning" },
		]);
		expect(result.node.children[1].children.map((child) => child.metadata.id)).toEqual([
			"area-b",
			"area-a",
		]);
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
					{ type: "component-b", props: { id: "component-b", nodeId: "component-b" } },
					{ type: "component-a", props: { id: "component-a", nodeId: "component-a" } },
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
							nodeId: "component-a",
							nodePropsJson: JSON.stringify({ label: "고객명" }),
							title: "Edited Component A",
						},
					},
					{
						type: "component-b",
						props: {
							id: "component-b",
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
		children: input.children,
	};
}
