import type { Job } from "@cx/inference/contracts";
import { describe, expect, it } from "vitest";
import { createScreenInferenceRunRow } from "./screen-inference-runs";

describe("screen inference run rows", () => {
	it("uses job metadata as the stable row identity", () => {
		const row = createScreenInferenceRunRow({
			artifacts: {
				hasQualityReview: false,
				hasRenderTree: true,
				hasValidationReport: true,
			},
			job: createJob({
				input: {
					screenCode: "NOVA-PRDD-PG-015-1",
				},
				status: "running",
			}),
			sourceInput: {
				source: { path: "data/client-imports/web-upload/20260604/source.md" },
			},
		});

		expect(row).toMatchObject({
			currentStepId: "04-render-tree",
			hasQualityReview: false,
			hasRenderTree: true,
			hasValidationReport: true,
			jobId: "job-1",
			screenId: "NOVA-PRDD-PG-015-1",
			sourcePath: "data/client-imports/web-upload/20260604/source.md",
			status: "running",
		});
	});

	it("prefers source-spec screen metadata when available", () => {
		const row = createScreenInferenceRunRow({
			artifacts: {
				hasQualityReview: true,
				hasRenderTree: true,
				hasValidationReport: true,
			},
			job: createJob({ input: { screenCode: "JOB-SCREEN" } }),
			sourceSpec: {
				sourceShape: {
					screen: {
						name: "약관 동의",
						route: "/terms",
						screenCode: "SPEC-SCREEN",
					},
				},
			},
		});

		expect(row.screenId).toBe("SPEC-SCREEN");
		expect(row.title).toBe("약관 동의");
	});

	it("marks an otherwise succeeded job as applied when apply-result is ok", () => {
		const row = createScreenInferenceRunRow({
			applyResult: { ok: true },
			artifacts: {
				hasQualityReview: true,
				hasRenderTree: true,
				hasValidationReport: true,
			},
			job: createJob({ status: "succeeded" }),
		});

		expect(row.status).toBe("applied");
	});
});

function createJob(input: Partial<Job> = {}): Job {
	return {
		createdAt: "2026-06-09T00:00:00.000Z",
		currentStepId: "04-render-tree",
		input: {},
		jobId: "job-1",
		pipelineId: "screen-generation",
		pipelineVersion: "v1",
		status: "queued",
		updatedAt: "2026-06-09T00:01:00.000Z",
		...input,
	};
}
