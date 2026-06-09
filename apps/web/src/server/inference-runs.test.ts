import { createJobStore } from "@cx/inference";
import { MemoryArtifactStore } from "@cx/inference/testing";
import { describe, expect, it } from "vitest";
import { listScreenInferenceRunRows } from "./inference-runs";

function createTestStores() {
	let t = 0;
	let n = 0;
	const artifactStore = new MemoryArtifactStore();
	const jobStore = createJobStore(artifactStore, {
		newId: () => `job-${++n}`,
		now: () => new Date(t++).toISOString(),
	});
	return { artifactStore, jobStore };
}

describe("listScreenInferenceRunRows", () => {
	it("materializes job rows from jobStore and existing job artifacts", async () => {
		const { artifactStore, jobStore } = createTestStores();
		const older = await jobStore.createJob({
			input: { screenCode: "OLD", source: { path: "data/client-imports/old.md" } },
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
		});
		const newer = await jobStore.createJob({
			input: { screenCode: "NEW" },
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
		});

		await artifactStore.writeJson(newer.jobId, "context/render-tree.json", {});
		await artifactStore.writeJson(newer.jobId, "context/source-input.json", {
			source: { path: "data/client-imports/new.md" },
		});
		await artifactStore.writeJson(newer.jobId, "context/validation-report.json", {});
		await artifactStore.writeJson(newer.jobId, "context/source-spec.json", {
			sourceShape: { screen: { name: "신규 화면", route: "/new", screenCode: "SPEC-NEW" } },
		});

		const rows = await listScreenInferenceRunRows({ artifactStore, jobStore });

		expect(rows.map((row) => row.jobId)).toEqual([newer.jobId, older.jobId]);
		expect(rows[0]).toMatchObject({
			hasQualityReview: false,
			hasRenderTree: true,
			hasValidationReport: true,
			screenId: "SPEC-NEW",
			sourcePath: "data/client-imports/new.md",
			status: "queued",
			title: "신규 화면",
		});
		expect(rows[1]).toMatchObject({
			hasRenderTree: false,
			screenId: "OLD",
			sourcePath: "data/client-imports/old.md",
		});
	});

	it("marks rows as applied only from an ok apply-result artifact", async () => {
		const { artifactStore, jobStore } = createTestStores();
		const job = await jobStore.createJob({
			input: { screenCode: "DONE" },
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
		});
		await jobStore.updateJob(job.jobId, { status: "succeeded" });
		await artifactStore.writeJson(job.jobId, "context/apply-result.json", { ok: true });

		const [row] = await listScreenInferenceRunRows({ artifactStore, jobStore });

		expect(row).toMatchObject({
			jobId: job.jobId,
			screenId: "DONE",
			status: "applied",
		});
	});
});
