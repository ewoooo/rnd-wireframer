import { describe, expect, it } from "vitest";
import { createContextStore } from "../context/context-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

describe("ContextStore", () => {
	it("writes and reads context/{key}.json", async () => {
		const store = new MemoryArtifactStore();
		const ctx = createContextStore("job-1", store);
		await ctx.writeJson("layout-plan", { rows: 3 });
		expect(await ctx.readJson<{ rows: number }>("layout-plan")).toEqual({ rows: 3 });
		expect(await store.exists("job-1", "context/layout-plan.json")).toBe(true);
	});

	it("tryReadJson returns null when the key is missing", async () => {
		const ctx = createContextStore("job-1", new MemoryArtifactStore());
		expect(await ctx.tryReadJson("missing")).toBeNull();
	});

	it("rejects invalid keys", async () => {
		const ctx = createContextStore("job-1", new MemoryArtifactStore());
		await expect(ctx.writeJson("../escape", {})).rejects.toThrow();
		await expect(ctx.writeJson("Bad Key", {})).rejects.toThrow();
	});
});
