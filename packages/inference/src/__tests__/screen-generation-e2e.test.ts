import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AgentRunner } from "@cx/agent";
import { createInferenceRuntime, runInferenceJob } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";
import { SCHEMA_VERSION } from "@cx/schema";
import { describe, expect, it } from "vitest";

const sourceSpec = {
	schemaVersion: SCHEMA_VERSION.sourceSpec,
	sourceImport: {
		files: [],
		importId: "test",
		receivedAt: "2026-06-08T00:00:00.000Z",
		sourceKind: "prdd-markdown-bundle",
	},
	sourceShape: {
		screen: {
			name: "Test Screen",
			regions: [],
			route: "/test",
			screenCode: "T",
		},
	},
};

const validRenderTree = {
	version: SCHEMA_VERSION.renderTree,
	metadata: { id: "x" },
	children: [
		{
			type: "Screen",
			componentVersion: "0.1.0",
			layout: "layout.screen.screenShell",
			metadata: { id: "T", title: "Screen" },
			children: [
				{
					type: "Screen.Header",
					componentVersion: "0.1.0",
					layout: "layout.region.header",
					metadata: { id: "header", title: "Header" },
					props: { position: "static" },
					children: [],
				},
				{
					type: "Screen.Contents",
					componentVersion: "0.1.0",
					layout: "layout.region.contents",
					metadata: { id: "contents", title: "Contents" },
					props: { scroll: true },
					children: [],
				},
				{
					type: "Screen.Bottom",
					componentVersion: "0.1.0",
					layout: "layout.region.bottom",
					metadata: { id: "bottom", title: "Bottom" },
					props: { position: "static", safeArea: true },
					children: [],
				},
			],
		},
	],
};

const invalidRenderTree = {
	version: SCHEMA_VERSION.renderTree,
	metadata: { id: "x" },
	children: [],
};

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
			{ targetRegion: "contents", role: "content", priority: 1, sourceRefs: ["T"], strategy: "x" },
		],
		visualHierarchy: "x",
		primaryUserAction: "x",
		sectionRhythm: "x",
		density: "medium",
		patternRationale: "x",
		rejectedPatterns: [],
	},
	"screen-generation": validRenderTree,
	"screen-revision": validRenderTree,
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
	it("runs validation and skips revision when the first RenderTree is valid", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
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
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/validation-report.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0 } });
		await expect(
			runtime.artifactStore.exists(job.jobId, "steps/06-revision/step.json"),
		).resolves.toBe(false);
	});

	it("runs one revision and validates again when deterministic validation has errors", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const calls: string[] = [];
		const runner: AgentRunner = async (request) => {
			calls.push(request.taskKind);
			return {
				taskKind: request.taskKind,
				session: { mode: "new" },
				payload:
					request.taskKind === "screen-generation"
						? invalidRenderTree
						: payloadByTaskKind[request.taskKind],
			};
		};
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
			claudeRunner: runner,
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
		expect(calls).toContain("screen-revision");
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/validation-report.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0 } });
		await expect(
			runtime.artifactStore.exists(job.jobId, "steps/07-validation-after-revision/step.json"),
		).resolves.toBe(true);
	});
});
