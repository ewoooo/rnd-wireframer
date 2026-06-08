import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AgentRunner } from "@cx/agent";
import { createInferenceRuntime, runInferenceJob } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";
import { SCHEMA_VERSION } from "@cx/schema";
import { describe, expect, it } from "vitest";

// Minimal payloads — required fields only, just enough to pass each JSON schema.
const payloadByTaskKind: Record<string, unknown> = {
	"screen-intent": {
		schemaVersion: SCHEMA_VERSION.screenIntent,
		screenPurpose: "x",
		contentPriority: [],
		sourceInterpretation: { defer: [], preserve: [], summarize: [] },
	},
	"composition-planning": {
		schemaVersion: SCHEMA_VERSION.compositionPlan,
		screenLayout: "layout.screen.Default",
		layoutStrategy: "x",
		sections: [
			{ targetRegion: "contents", role: "content", priority: 1, sourceRefs: ["a"], strategy: "x" },
		],
		visualHierarchy: "x",
		primaryUserAction: "x",
		sectionRhythm: "x",
		density: "medium",
		patternRationale: "x",
		rejectedPatterns: [],
	},
	"screen-generation": {
		version: SCHEMA_VERSION.renderTree,
		metadata: { id: "x" },
		children: [],
	},
	"quality-review": {
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		inspection: { compositionAligned: true, sourceFaithful: true, visualHierarchyClear: true },
		findings: [],
		summary: { errorCount: 0, warningCount: 0 },
	},
};

const fakeRunner: AgentRunner = async (request) => ({
	taskKind: request.taskKind,
	session: { mode: "new" },
	payload: payloadByTaskKind[request.taskKind],
});

describe("screen-generation@v1 end-to-end", () => {
	it("runs all 5 steps to succeeded with a fake runner", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => ({ schemaVersion: SCHEMA_VERSION.sourceSpec }) },
			claudeRunner: fakeRunner,
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		await expect(runtime.jobStore.getJob(job.jobId)).resolves.toMatchObject({
			status: "succeeded",
		});
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/quality-inspection.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0, warningCount: 0 } });
	});
});
