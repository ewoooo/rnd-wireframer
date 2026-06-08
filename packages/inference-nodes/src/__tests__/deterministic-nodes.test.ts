import { describe, expect, it } from "vitest";
import { runRequiredRegionLayoutRepairNode } from "../screen-generation";

describe("screen-generation deterministic nodes", () => {
	it("repairs missing required Screen region layout refs without mutating input", () => {
		const payload = {
			renderTree: {
				children: [
					{
						children: [
							{ type: "Screen.Header" },
							{ layout: "layout.region.contents", type: "Screen.Contents" },
							{ type: "Screen.Bottom" },
						],
						type: "Screen",
					},
				],
			},
		};

		const repaired = runRequiredRegionLayoutRepairNode(payload);
		const regions = repaired.renderTree.children[0]?.children;

		expect(regions?.[0]).toMatchObject({
			layout: "layout.region.header",
			type: "Screen.Header",
		});
		expect(regions?.[1]).toMatchObject({
			layout: "layout.region.contents",
			type: "Screen.Contents",
		});
		expect(regions?.[2]).toMatchObject({
			layout: "layout.region.bottom",
			type: "Screen.Bottom",
		});
		expect(payload.renderTree.children[0]?.children[0]).not.toHaveProperty("layout");
	});
});
