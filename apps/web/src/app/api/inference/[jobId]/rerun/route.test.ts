import { beforeEach, describe, expect, it, vi } from "vitest";

const { rerunInferenceJob, RerunConflictError, UnknownRerunStepError } = vi.hoisted(() => {
	class RerunConflictError extends Error {}
	class UnknownRerunStepError extends Error {}
	return { rerunInferenceJob: vi.fn(), RerunConflictError, UnknownRerunStepError };
});
vi.mock("@/server/inference-runtime", () => ({
	RerunConflictError,
	rerunInferenceJob: (...args: unknown[]) => rerunInferenceJob(...args),
	UnknownRerunStepError,
}));

import { POST } from "./route";

function postRequest(body: unknown): Request {
	return new Request("http://test/api/inference/job-1/rerun", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

const ctx = { params: Promise.resolve({ jobId: "job-1" }) };

describe("POST /api/inference/[jobId]/rerun", () => {
	beforeEach(() => {
		rerunInferenceJob.mockReset();
		rerunInferenceJob.mockResolvedValue({ jobId: "job-1", status: "queued" });
	});

	it("passes startFromStepId and contextOverrides through, echoing overridden keys", async () => {
		const res = await POST(
			postRequest({
				startFromStepId: "04-render-tree",
				contextOverrides: { "composition-plan": { ok: true } },
			}),
			ctx,
		);

		expect(res.status).toBe(202);
		expect(rerunInferenceJob).toHaveBeenCalledWith("job-1", {
			startFromStepId: "04-render-tree",
			contextOverrides: { "composition-plan": { ok: true } },
		});
		await expect(res.json()).resolves.toMatchObject({
			ok: true,
			startFromStepId: "04-render-tree",
			overriddenContextKeys: ["composition-plan"],
		});
	});

	it("rejects a non-object contextOverrides with 400 and does not rerun", async () => {
		const res = await POST(postRequest({ contextOverrides: [1, 2] }), ctx);
		expect(res.status).toBe(400);
		expect(rerunInferenceJob).not.toHaveBeenCalled();
	});

	it("rejects an invalid context key with 400", async () => {
		const res = await POST(postRequest({ contextOverrides: { "BAD KEY": 1 } }), ctx);
		expect(res.status).toBe(400);
		expect(rerunInferenceJob).not.toHaveBeenCalled();
	});

	it("treats an empty contextOverrides object as no overrides", async () => {
		const res = await POST(postRequest({ contextOverrides: {} }), ctx);
		expect(res.status).toBe(202);
		expect(rerunInferenceJob).toHaveBeenCalledWith("job-1", {});
		await expect(res.json()).resolves.not.toHaveProperty("overriddenContextKeys");
	});

	it("returns 409 when the job is still running", async () => {
		rerunInferenceJob.mockRejectedValue(new RerunConflictError("Job job-1 is running"));
		const res = await POST(postRequest({}), ctx);
		expect(res.status).toBe(409);
		await expect(res.json()).resolves.toMatchObject({ error: "Job job-1 is running" });
	});

	it("returns 400 when startFromStepId is not a pipeline step", async () => {
		rerunInferenceJob.mockRejectedValue(
			new UnknownRerunStepError("Unknown startFromStepId: 99-nope"),
		);
		const res = await POST(postRequest({ startFromStepId: "99-nope" }), ctx);
		expect(res.status).toBe(400);
		await expect(res.json()).resolves.toMatchObject({
			error: "Unknown startFromStepId: 99-nope",
		});
	});

	it("reruns from scratch when no body is provided", async () => {
		const res = await POST(
			new Request("http://test/api/inference/job-1/rerun", { method: "POST" }),
			ctx,
		);
		expect(res.status).toBe(202);
		expect(rerunInferenceJob).toHaveBeenCalledWith("job-1", {});
	});
});
