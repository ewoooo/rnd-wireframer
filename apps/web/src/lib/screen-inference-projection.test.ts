import { RENDER_TREE_NODE_TYPE, type RenderTreeScreenNodeContract } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { SCREEN_DB_TABLES } from "./screen-db-rest";
import {
	projectScreenInferenceFinalResult,
	readProjectionRowCounts,
} from "./screen-inference-projection";

describe("screen inference projection", () => {
	it("projects a generated screen render tree into screen DB row families", () => {
		const node = createScreenNode();

		const projection = projectScreenInferenceFinalResult(node);

		expect(projection.diagnostics).toEqual([]);
		expect(readProjectionRowCounts(projection)).toMatchObject({
			[SCREEN_DB_TABLES.areaChildren]: 1,
			[SCREEN_DB_TABLES.areas]: 1,
			[SCREEN_DB_TABLES.componentChildren]: 1,
			[SCREEN_DB_TABLES.components]: 1,
			[SCREEN_DB_TABLES.screenRegionChildren]: 1,
			[SCREEN_DB_TABLES.screenRegions]: 3,
			[SCREEN_DB_TABLES.screenRoutes]: 1,
			[SCREEN_DB_TABLES.screenVariants]: 1,
			[SCREEN_DB_TABLES.screens]: 1,
		});
		expect(projection.screenRoutes[0]).toMatchObject({
			id: "screen-1.route",
			name: "Screen One",
		});
		expect(projection.screenVariants[0]).toMatchObject({
			id: "screen-1.variant",
			screen_route_id: "screen-1.route",
		});
		expect(projection.areas[0]).toMatchObject({
			id: "area-1",
			type: "area_static",
		});
		expect(projection.components[0]).toMatchObject({
			id: "component-1",
			type: "Card",
		});
	});
});

function createScreenNode(): RenderTreeScreenNodeContract {
	return {
		children: [
			{
				children: [],
				componentVersion: "0.1.0",
				metadata: { id: "screen-1.header", title: "Header" },
				type: RENDER_TREE_NODE_TYPE.screenHeader,
			},
			{
				children: [
					{
						children: [
							{
								children: [
									{
										componentVersion: "1.0.0",
										metadata: { id: "component-1.title", title: "Title" },
										props: { text: "Hello" },
										type: "Text",
									},
								],
								componentVersion: "1.0.0",
								metadata: { id: "component-1", title: "Card" },
								props: { title: "Hello" },
								type: "Card",
							},
						],
						componentVersion: "1.0.0",
						metadata: { id: "area-1", title: "Main Area" },
						type: RENDER_TREE_NODE_TYPE.areaStatic,
					},
				],
				componentVersion: "0.1.0",
				metadata: { id: "screen-1.contents", title: "Contents" },
				type: RENDER_TREE_NODE_TYPE.screenContents,
			},
			{
				children: [],
				componentVersion: "0.1.0",
				metadata: { id: "screen-1.bottom", title: "Bottom" },
				type: RENDER_TREE_NODE_TYPE.screenBottom,
			},
		],
		componentVersion: "1.0.0",
		metadata: { id: "screen-1", title: "Screen One" },
		type: RENDER_TREE_NODE_TYPE.screen,
	};
}
