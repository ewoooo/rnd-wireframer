import { describe, expect, it } from "vitest";
import { loadDesignContextBundleContents } from "../pipelines/screen-generation/design-context-catalog";

describe("loadDesignContextBundleContents", () => {
	it("loads body for selected bundle refs from agent docs", async () => {
		const contents = await loadDesignContextBundleContents([
			{
				id: "visual-foundation",
				reason: "r",
				sourceDocs: [],
				version: "2026-05-29",
			},
		]);

		expect(contents).toHaveLength(1);
		expect(contents[0].id).toBe("visual-foundation");
		expect(contents[0].body.length).toBeGreaterThan(0);
	});

	it("loads real bodies for every selectable bundle id", async () => {
		const contents = await loadDesignContextBundleContents([
			{ id: "visual-foundation", reason: "r", sourceDocs: [], version: "v" },
			{ id: "layout-composition", reason: "r", sourceDocs: [], version: "v" },
			{ id: "interaction-state", reason: "r", sourceDocs: [], version: "v" },
			{ id: "quality-review", reason: "r", sourceDocs: [], version: "v" },
		]);

		expect(contents.map((content) => content.id).sort()).toEqual([
			"interaction-state",
			"layout-composition",
			"quality-review",
			"visual-foundation",
		]);
		expect(contents.every((content) => content.body.length > 0)).toBe(true);
	});

	it("skips bundles whose file is missing", async () => {
		const contents = await loadDesignContextBundleContents(
			[{ id: "visual-foundation", reason: "r", sourceDocs: [], version: "v" }],
			"packages/agent/docs/__nonexistent__",
		);

		expect(contents).toHaveLength(0);
	});
});
