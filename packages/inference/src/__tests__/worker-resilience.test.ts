import {
	createInferenceKnowledgeBase,
	type InferenceRuntime,
	runInferenceJob,
} from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createContextStore } from "../context/context-store";
import { createJobStore } from "../stores/job-store";
import { createFakeEngine } from "../testing/fake-engine";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

function runtimeWithNoPipelines(): InferenceRuntime {
	const artifactStore = new MemoryArtifactStore();
	const jobStore = createJobStore(artifactStore, { now: () => "t", newId: () => "job-1" });
	const engine = createFakeEngine(() => ({}));
	return {
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: { claude: engine, function: engine },
		jobStore,
		knowledgeBase: createInferenceKnowledgeBase(),
		now: () => "t",
		newId: () => "x",
		pipelines: {
			register() {},
			get() {
				throw new Error("Unknown pipeline");
			},
		},
	};
}

describe("runInferenceJob resilience", () => {
	it("marks the job failed (no throw) when the pipeline is unknown", async () => {
		const runtime = runtimeWithNoPipelines();
		const job = await runtime.jobStore.createJob({
			pipelineId: "ghost",
			pipelineVersion: "v9",
			input: {},
		});
		await expect(runInferenceJob(runtime, job.jobId)).resolves.toBeUndefined();
		expect((await runtime.jobStore.getJob(job.jobId)).status).toBe("failed");
		const events = await runtime.jobStore.listEvents(job.jobId);
		expect(events.at(-1)?.type).toBe("job_failed");
	});
});
