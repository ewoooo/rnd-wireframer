import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentRunner } from "@cx/agent";
import { createClaudeRunner } from "@cx/agent/claude";
import { createInferenceRuntime, runInferenceJob } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";
import { SCHEMA_VERSION } from "@cx/schema";
import type { GenerationSmokeOptions, GenerationSmokeResult } from "./types";

const DEFAULT_ARTIFACT_ROOT = "data/runs/screen-generation";

const fakePayloadByTaskKind: Record<string, unknown> = {
	"composition-planning": {
		density: "medium",
		layoutStrategy: "default",
		patternRationale: "fake smoke run",
		primaryUserAction: "review",
		rejectedPatterns: [],
		schemaVersion: SCHEMA_VERSION.compositionPlan,
		screenLayout: "layout.screen.default",
		sectionRhythm: "default",
		sections: [
			{
				priority: 1,
				role: "content",
				sourceRefs: ["source"],
				strategy: "preserve source content",
				targetRegion: "contents",
			},
		],
		visualHierarchy: "content first",
	},
	"quality-review": {
		findings: [],
		inspection: {
			compositionAligned: true,
			sourceFaithful: true,
			visualHierarchyClear: true,
		},
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		summary: { errorCount: 0, warningCount: 0 },
	},
	"screen-generation": {
		children: [],
		metadata: { id: "smoke-render-tree" },
		version: SCHEMA_VERSION.renderTree,
	},
	"screen-intent": {
		contentPriority: [],
		schemaVersion: SCHEMA_VERSION.screenIntent,
		screenPurpose: "fake smoke run",
		sourceInterpretation: { defer: [], preserve: [], summarize: [] },
	},
};

const fakeRunner: AgentRunner = async (request) => ({
	payload: fakePayloadByTaskKind[request.taskKind],
	session: { mode: "new" },
	taskKind: request.taskKind,
});

export async function runGenerationSmoke(
	target: string,
	options: GenerationSmokeOptions = {},
): Promise<GenerationSmokeResult> {
	const runId = options.runId ?? createRunId(target);
	const dataRoot = options.artifactRoot ?? DEFAULT_ARTIFACT_ROOT;
	const runtime = createInferenceRuntime({
		claudeRunner: options.useAI ? createClaudeRunner({ localFirst: true }) : fakeRunner,
		dataRoot,
		functions: {
			"source-spec-mvp": () => ({ schemaVersion: SCHEMA_VERSION.sourceSpec }),
		},
		newId: () => runId,
		pipelines: [screenGenerationPipelineV1],
	});
	const job = await runtime.jobStore.createJob({
		input: {
			source: {
				path: target,
				type: "file",
			},
			tags: options.tags ?? [],
		},
		pipelineId: "screen-generation",
		pipelineVersion: "v1",
	});
	await runInferenceJob(runtime, job.jobId);
	const completed = await runtime.jobStore.getJob(job.jobId);
	const runDir = path.resolve(dataRoot, "inference-jobs", job.jobId);
	const outDir = options.outDir ?? path.join(runDir, "artifacts");
	const validationReport = {
		summary: {
			errorCount: completed.error ? 1 : 0,
			warningCount: 0,
		},
	};

	await mkdir(runDir, { recursive: true });
	await writeFile(
		path.join(runDir, "manifest.json"),
		`${JSON.stringify(
			{
				runId: job.jobId,
				sourcePath: target,
				tags: options.tags ?? [],
			},
			null,
			2,
		)}\n`,
		"utf8",
	);

	return {
		outDir,
		parseCommandResult: { parseResult: { ok: true } },
		runId: job.jobId,
		summary: {
			ok: completed.status === "succeeded",
			outDir,
			runDir,
			runId: job.jobId,
			validationOk: !completed.error,
		},
		validationReport,
	};
}

function createRunId(target: string): string {
	const basename = path.basename(target, path.extname(target)).replace(/[^a-zA-Z0-9_-]/g, "_");
	const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
	return `${basename}-${timestamp}`;
}
