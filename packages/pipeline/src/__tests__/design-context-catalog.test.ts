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

	it("skips bundles whose file is missing", async () => {
		const contents = await loadDesignContextBundleContents(
			[{ id: "visual-foundation", reason: "r", sourceDocs: [], version: "v" }],
			"packages/agent/docs/__nonexistent__",
		);

		expect(contents).toHaveLength(0);
	});
});
