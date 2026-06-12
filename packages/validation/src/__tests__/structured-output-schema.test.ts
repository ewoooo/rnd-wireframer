import { getJsonSchema, SCHEMA_VERSION, toStructuredOutputJsonSchema } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { validateJsonSchema } from "../public/validators";

/** depth만큼 componentNode를 중첩한 RenderTree를 만든다. */
function renderTreeWithComponentDepth(depth: number) {
	let component: Record<string, unknown> = {
		type: "ListText",
		componentVersion: "0.1.0",
		metadata: { id: `leaf`, title: "Leaf" },
	};
	for (let level = depth - 1; level >= 1; level -= 1) {
		component = {
			type: "Stack",
			componentVersion: "0.1.0",
			metadata: { id: `level-${level}`, title: `Level ${level}` },
			children: [component],
		};
	}
	return {
		version: SCHEMA_VERSION.renderTree,
		metadata: { id: "x" },
		children: [
			{
				type: "Screen",
				componentVersion: "0.1.0",
				layout: "layout.screen.mobileScreen",
				metadata: { id: "screen", title: "Screen" },
				children: [
					{
						type: "Screen.Contents",
						componentVersion: "0.1.0",
						layout: "layout.region.contents",
						metadata: { id: "contents", title: "Contents" },
						children: [
							{
								type: "area.static",
								componentVersion: "0.1.0",
								layout: "layout.area.stack",
								metadata: { id: "area", title: "Area" },
								children: [component],
							},
						],
					},
				],
			},
		],
	};
}

describe("structured-output render-tree schema", () => {
	const unrolled = toStructuredOutputJsonSchema(getJsonSchema("render-tree"));

	it("validates a normal-depth render tree like the recursive contract", () => {
		const tree = renderTreeWithComponentDepth(3);
		expect(validateJsonSchema(getJsonSchema("render-tree"), tree).ok).toBe(true);
		expect(validateJsonSchema(unrolled, tree).ok).toBe(true);
	});

	it("stays permissive beyond the unroll depth so valid deep trees are not blocked", () => {
		const tree = renderTreeWithComponentDepth(10);
		expect(validateJsonSchema(getJsonSchema("render-tree"), tree).ok).toBe(true);
		expect(validateJsonSchema(unrolled, tree).ok).toBe(true);
	});

	it("still rejects an invalid tree at bounded depth", () => {
		const tree = renderTreeWithComponentDepth(2) as { children: Array<{ type: string }> };
		tree.children[0].type = "NotAScreen";
		expect(validateJsonSchema(unrolled, tree).ok).toBe(false);
	});
});
