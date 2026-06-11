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

	it("startFromStepId skips earlier steps and reuses their on-disk context", async () => {
		let time = 0;
		let id = 0;
		const calls: string[] = [];
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
					id: "01-first",
					inputs: { job: { kind: "job-input" } },
					run: { id: "fake" },
					output: {
						contractRef: { source: "output-contract", id: "source-spec" },
						writeToContext: "source-spec",
					},
				},
				{
					id: "02-second",
					inputs: { prior: { kind: "context", key: "source-spec" } },
					run: { id: "fake" },
					output: {
						contractRef: { source: "output-contract", id: "source-spec" },
						writeToContext: "second",
					},
				},
			],
		};
		const engine: Engine = {
			async execute(args) {
				calls.push(args.outputContract.id);
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

		// Full run primes both steps and writes 01-first's context to disk.
		await runInferenceJob(runtime, job.jobId);
		expect(calls).toHaveLength(2);

		// Rerun from 02-second: 01-first is skipped, its context is read from disk.
		calls.length = 0;
		await runInferenceJob(runtime, job.jobId, { startFromStepId: "02-second" });

		expect(calls).toHaveLength(1);
		await expect(artifactStore.exists(job.jobId, "steps/02-second/output.json")).resolves.toBe(
			true,
		);
		await expect(jobStore.getJob(job.jobId)).resolves.toMatchObject({ status: "succeeded" });
	});

	it("fails the job when startFromStepId is unknown", async () => {
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
					id: "01-first",
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

		await runInferenceJob(runtime, job.jobId, { startFromStepId: "99-nope" });

		await expect(jobStore.getJob(job.jobId)).resolves.toMatchObject({ status: "failed" });
	});

	it("writes contextOverrides into working memory before any step runs", async () => {
		let time = 0;
		let id = 0;
		const seenInputs: unknown[] = [];
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
					id: "01-only",
					inputs: { prior: { kind: "context", key: "source-spec" } },
					run: { id: "fake" },
					output: {
						contractRef: { source: "output-contract", id: "source-spec" },
						// keep the overridden context intact — otherwise the step output
						// would land on the same key (writeToContext defaults to contract id)
						writeToContext: false,
					},
				},
			],
		};
		const engine: Engine = {
			async execute(args) {
				seenInputs.push(args.inputs.prior);
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

		// Without the override the context read would fail — the step's only
		// input comes from the injected working-memory value.
		const patched = { ...validSourceSpec, patched: true };
		await runInferenceJob(runtime, job.jobId, {
			contextOverrides: { "source-spec": patched },
		});

		expect(seenInputs).toEqual([patched]);
		await expect(artifactStore.readJson(job.jobId, "context/source-spec.json")).resolves.toEqual(
			patched,
		);
		await expect(jobStore.getJob(job.jobId)).resolves.toMatchObject({ status: "succeeded" });

		// Invalid context keys are rejected by the ContextStore key rule.
		await runInferenceJob(runtime, job.jobId, {
			contextOverrides: { "BAD KEY": 1 },
		});
		await expect(jobStore.getJob(job.jobId)).resolves.toMatchObject({ status: "failed" });
	});
});
