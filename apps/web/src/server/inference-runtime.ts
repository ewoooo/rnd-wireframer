import path from "node:path";
import { createClaudeRunner } from "@cx/agent/claude";
import {
	createInferenceRuntime,
	type EngineRequest,
	type InferenceRuntime,
	runInferenceJob,
} from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";
import { prepareSourceFile } from "@/server/source-file";

const cwd = process.cwd();
const dataRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`)
	? path.resolve(cwd, "../..", ".data")
	: path.resolve(cwd, ".data");

function buildSourceSpec(request: EngineRequest) {
	const jobInputValue =
		request.inputs.job && typeof request.inputs.job === "object"
			? (request.inputs.job as Record<string, unknown>)
			: {};
	const preparedSource =
		jobInputValue.preparedSource && typeof jobInputValue.preparedSource === "object"
			? (jobInputValue.preparedSource as Record<string, unknown>)
			: undefined;
	if (preparedSource?.sourceSpec) return preparedSource.sourceSpec;

	const screenCode =
		typeof jobInputValue.screenCode === "string" ? jobInputValue.screenCode : "MVP-SCREEN";
	return {
		schemaVersion: "source-spec.v0.1",
		sourceImport: {
			files: [],
			importId: String(jobInputValue.importId ?? "api-inference-mvp"),
			receivedAt: new Date().toISOString(),
			sourceKind: "prdd-markdown-bundle",
		},
		sourceShape: {
			screen: {
				name: String(jobInputValue.name ?? screenCode),
				regions: [],
				route: String(jobInputValue.route ?? `/${screenCode.toLowerCase()}`),
				screenCode,
			},
		},
	};
}

export const inferenceRuntime: InferenceRuntime = createInferenceRuntime({
	dataRoot,
	pipelines: [screenGenerationPipelineV1],
	functions: { "source-spec-mvp": buildSourceSpec },
	claudeRunner: createClaudeRunner({ localFirst: true }),
});

export async function createInferenceJob(input: unknown) {
	const preparedSource = await prepareSourceFile(input);
	const jobInput =
		preparedSource && input && typeof input === "object" && !Array.isArray(input)
			? { ...(input as Record<string, unknown>), preparedSource }
			: input;
	const job = await inferenceRuntime.jobStore.createJob({
		pipelineId: "screen-generation",
		pipelineVersion: "v1",
		input: jobInput,
	});
	if (preparedSource) {
		await Promise.all([
			inferenceRuntime.artifactStore.writeJson(job.jobId, "context/source-input.json", {
				source: preparedSource.source,
			}),
			inferenceRuntime.artifactStore.writeText(
				job.jobId,
				"context/source.raw.md",
				preparedSource.rawMarkdown,
			),
			inferenceRuntime.artifactStore.writeJson(
				job.jobId,
				"context/source-spec.json",
				preparedSource.sourceSpec,
			),
		]);
	}
	void runInferenceJob(inferenceRuntime, job.jobId).catch((error) => {
		console.error(`runInferenceJob failed for job ${job.jobId}`, error);
	});
	return job;
}
