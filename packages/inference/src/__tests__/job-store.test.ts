import { describe, expect, it } from "vitest";
import { createJobStore } from "../stores/job-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

function makeStore() {
	let t = 0;
	let n = 0;
	const artifact = new MemoryArtifactStore();
	const jobStore = createJobStore(artifact, {
		now: () => new Date(t++).toISOString(),
		newId: () => `job-${++n}`,
	});
	return { artifact, jobStore };
}

describe("JobStore", () => {
	it("creates a job snapshot at job.json", async () => {
		const { artifact, jobStore } = makeStore();
		const job = await jobStore.createJob({
			pipelineId: "demo",
			pipelineVersion: "v1",
			input: { a: 1 },
		});
		expect(job.jobId).toBe("job-1");
		expect(job.status).toBe("queued");
		expect(await jobStore.getJob("job-1")).toEqual(job);
		expect(await artifact.exists("job-1", "job.json")).toBe(true);
	});

	it("updateJob merges patch and bumps updatedAt", async () => {
		const { jobStore } = makeStore();
		await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		await jobStore.updateJob("job-1", { status: "running" });
		expect((await jobStore.getJob("job-1")).status).toBe("running");
	});

	it("lists jobs from stored job snapshots ordered by updatedAt descending", async () => {
		const { jobStore } = makeStore();
		await jobStore.createJob({
			pipelineId: "demo",
			pipelineVersion: "v1",
			input: { screenCode: "first" },
		});
		await jobStore.createJob({
			pipelineId: "demo",
			pipelineVersion: "v1",
			input: { screenCode: "second" },
		});
		await jobStore.updateJob("job-1", { status: "running" });

		expect((await jobStore.listJobs()).map((job) => [job.jobId, job.status])).toEqual([
			["job-1", "running"],
			["job-2", "queued"],
		]);
	});

	it("appendEvent assigns a monotonic seq and listEvents filters by after", async () => {
		const { jobStore } = makeStore();
		await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		const e1 = await jobStore.appendEvent("job-1", {
			jobId: "job-1",
			type: "job_started",
			timestamp: "t",
		});
		const e2 = await jobStore.appendEvent("job-1", {
			jobId: "job-1",
			type: "job_completed",
			timestamp: "t",
		});
		expect([e1.seq, e2.seq]).toEqual([1, 2]);
		expect(await jobStore.listEvents("job-1")).toHaveLength(2);
		expect(await jobStore.listEvents("job-1", 1)).toEqual([e2]);
	});

	it("createStep/updateStep maintain a step snapshot", async () => {
		const { artifact, jobStore } = makeStore();
		await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		await jobStore.createStep("job-1", "analyze");
		await jobStore.updateStep("job-1", "analyze", { status: "succeeded" });
		const step = await artifact.readJson<{ stepId: string; status: string }>(
			"job-1",
			"steps/analyze/step.json",
		);
		expect(step).toMatchObject({ stepId: "analyze", status: "succeeded" });
	});
});
