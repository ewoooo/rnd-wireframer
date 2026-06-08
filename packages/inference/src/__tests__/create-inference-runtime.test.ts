import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	createInferenceRuntime,
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";
import { describe, expect, it } from "vitest";

describe("createInferenceRuntime", () => {
	it("wires a file-backed runtime that runs a function-engine step end-to-end", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-rt-"));
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
						run: { id: "source-spec-mvp" },
						output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
					}),
				],
			}),
		);
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines,
			functions: {
				"source-spec-mvp": () => ({
					schemaVersion: "source-spec.v0.1",
					sourceImport: {
						files: [],
						importId: "test",
						receivedAt: "2026-06-08T00:00:00.000Z",
						sourceKind: "prdd-markdown-bundle",
					},
					sourceShape: {
						screen: { name: "T", regions: [], route: "/t", screenCode: "T" },
					},
				}),
			},
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		const jobJson = JSON.parse(await readFile(path.join(dataRoot, "inference-jobs", job.jobId, "job.json"), "utf8"));
		expect(jobJson.status).toBe("succeeded");
	});
});
