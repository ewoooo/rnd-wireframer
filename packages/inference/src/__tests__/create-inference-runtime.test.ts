import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	createInferenceRuntime,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";
import { SCHEMA_VERSION } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("createInferenceRuntime", () => {
	it("builds a registry from pipelines[] and runs a function-engine step end-to-end", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-rt-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [
				definePipeline({
					id: "src-only",
					version: "v1",
					steps: [
						defineStep({
							id: "01-source-spec",
							inputs: { job: jobInput() },
							run: { id: "source-spec-mvp" },
							output: {
								contractRef: outputContractRef("source-spec"),
								writeToContext: "source-spec",
							},
						}),
					],
				}),
			],
			functions: { "source-spec-mvp": () => ({ schemaVersion: SCHEMA_VERSION.sourceSpec }) },
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "src-only",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		const jobJson = JSON.parse(
			await readFile(path.join(dataRoot, "inference-jobs", job.jobId, "job.json"), "utf8"),
		);
		expect(jobJson.status).toBe("succeeded");
	});
});
