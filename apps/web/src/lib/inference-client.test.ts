import { afterEach, describe, expect, it, vi } from "vitest";
import { createInferenceJob } from "./inference-client";

afterEach(() => vi.restoreAllMocks());

describe("createInferenceJob", () => {
	it("POSTs and returns jobId", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ jobId: "job-xyz" }), { status: 202 })));
		expect(await createInferenceJob({ a: 1 })).toBe("job-xyz");
	});
	it("throws on non-ok", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
		await expect(createInferenceJob({})).rejects.toThrow();
	});
});
