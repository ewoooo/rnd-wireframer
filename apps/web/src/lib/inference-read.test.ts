import {
	createInferenceKnowledgeBase,
	createJobStore,
	type InferenceRuntime,
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	runInferenceJob,
	createContextStore,
} from "@cx/inference";
import { MemoryArtifactStore, createFakeEngine } from "@cx/inference/testing";
import { describe, expect, it } from "vitest";
import { readArtifact, readStepSnapshots } from "./inference-read";

const validSourceSpec = {
	schemaVersion: "source-spec.v0.1",
	sourceImport: { files: [], importId: "t", receivedAt: "2026-06-08T00:00:00.000Z", sourceKind: "prdd-markdown-bundle" },
	sourceShape: { screen: { name: "T", regions: [], route: "/t", screenCode: "T" } },
};

async function runDemo() {
	const artifactStore = new MemoryArtifactStore();
	const jobStore = createJobStore(artifactStore, { now: () => "t", newId: () => "job-1" });
	const engine = createFakeEngine(() => validSourceSpec);
	const pipelines = createPipelineRegistry();
	pipelines.register(
		definePipeline({
			id: "screen-generation",
			version: "v1",
			steps: [
				defineStep({
					id: "01-analyze",
					engine: "function",
					inputs: { job: jobInput() },
					run: { id: "fake" },
					output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
				}),
			],
		}),
	);
	const runtime: InferenceRuntime = {
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: { claude: engine, function: engine },
		jobStore,
		knowledgeBase: createInferenceKnowledgeBase(),
		now: () => "t",
		newId: () => "x",
		pipelines,
	};
	const job = await jobStore.createJob({ pipelineId: "screen-generation", pipelineVersion: "v1", input: { screenCode: "T" } });
	await runInferenceJob(runtime, job.jobId);
	return { runtime, jobId: job.jobId };
}

describe("readStepSnapshots", () => {
	it("returns one snapshot per declared step", async () => {
		const { runtime, jobId } = await runDemo();
		const steps = await readStepSnapshots(runtime, jobId);
		expect(steps).toHaveLength(1);
		expect(steps[0]).toMatchObject({ stepId: "01-analyze", status: "succeeded" });
	});
});

describe("readArtifact", () => {
	it("reads allowed artifacts incl. output-contract.json; rejects traversal", async () => {
		const { runtime, jobId } = await runDemo();
		await runtime.artifactStore.writeText(jobId, "context/source.raw.md", "# raw");
		expect(JSON.parse(await readArtifact(runtime, jobId, "steps/01-analyze/output.json"))).toEqual(validSourceSpec);
		await expect(readArtifact(runtime, jobId, "steps/01-analyze/output-contract.json")).resolves.toBeTruthy();
		await expect(readArtifact(runtime, jobId, "context/source.raw.md")).resolves.toBe("# raw");
		await expect(readArtifact(runtime, jobId, "../secret")).rejects.toThrow();
	});
});
