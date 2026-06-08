import {
	createInferenceKnowledgeBase,
	type Engine,
	type InferenceRuntime,
	type PipelineDefinition,
	runInferenceJob,
} from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createContextStore } from "../context/context-store";
import { createJobStore } from "../stores/job-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

const validSourceSpec = {
	schemaVersion: "source-spec.v0.1",
	sourceImport: {
		files: [],
		importId: "sample",
		receivedAt: "2026-06-08T00:00:00.000Z",
		sourceKind: "prdd-markdown-bundle",
	},
	sourceShape: {
		screen: {
			name: "Sample",
			regions: [],
			route: "/sample",
			screenCode: "SAMPLE",
		},
	},
};

describe("runInferenceJob", () => {
	it("persists output-contract.json beside step artifacts", async () => {
		let time = 0;
		let id = 0;
		const artifactStore = new MemoryArtifactStore();
		const jobStore = createJobStore(artifactStore, {
			now: () => `t-${++time}`,
			newId: () => `job-${++id}`,
		});
		const job = await jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "SAMPLE" },
		});
		const pipeline: PipelineDefinition = {
			id: "screen-generation",
			version: "v1",
			steps: [
				{
					id: "01-analyze",
					engine: "function",
					inputs: { job: { kind: "job-input" } },
					run: { id: "fake" },
					output: {
						contractRef: { source: "output-contract", id: "source-spec" },
						writeToContext: "source-spec",
					},
				},
			],
		};
		const engine: Engine = {
			async execute() {
				return { raw: validSourceSpec };
			},
		};
		const runtime: InferenceRuntime = {
			artifactStore,
			createContextStore: (jobId) => createContextStore(jobId, artifactStore),
			engines: { claude: engine, function: engine },
			jobStore,
			knowledgeBase: createInferenceKnowledgeBase(),
			newId: () => `runtime-${++id}`,
			now: () => `t-${++time}`,
			pipelines: {
				register() {},
				get() {
					return pipeline;
				},
			},
		};

		await runInferenceJob(runtime, job.jobId);

		await expect(
			artifactStore.readJson(job.jobId, "steps/01-analyze/output-contract.json"),
		).resolves.toMatchObject({
			kind: "output-contract",
			id: "source-spec",
		});
		await expect(
			artifactStore.readJson(job.jobId, "steps/01-analyze/output.json"),
		).resolves.toEqual(validSourceSpec);
		await expect(artifactStore.readJson(job.jobId, "context/source-spec.json")).resolves.toEqual(
			validSourceSpec,
		);
		await expect(jobStore.getJob(job.jobId)).resolves.toMatchObject({ status: "succeeded" });
	});
});
