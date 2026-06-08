import path from "node:path";
import {
	createInferenceRuntime,
	createPipelineRegistry,
	definePipeline,
	defineStep,
	type EngineRequest,
	type InferenceRuntime,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";

const cwd = process.cwd();
const dataRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`)
	? path.resolve(cwd, "../..", ".data")
	: path.resolve(cwd, ".data");

function buildSourceSpec(request: EngineRequest) {
	const jobInputValue =
		request.inputs.job && typeof request.inputs.job === "object"
			? (request.inputs.job as Record<string, unknown>)
			: {};
	const screenCode = typeof jobInputValue.screenCode === "string" ? jobInputValue.screenCode : "MVP-SCREEN";
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

export const inferenceRuntime: InferenceRuntime = createInferenceRuntime({
	dataRoot,
	pipelines,
	functions: { "source-spec-mvp": buildSourceSpec },
});

export async function createInferenceJob(input: unknown) {
	const job = await inferenceRuntime.jobStore.createJob({
		pipelineId: "screen-generation",
		pipelineVersion: "v1",
		input,
	});
	void runInferenceJob(inferenceRuntime, job.jobId).catch((error) => {
		console.error(`runInferenceJob failed for job ${job.jobId}`, error);
	});
	return job;
}
