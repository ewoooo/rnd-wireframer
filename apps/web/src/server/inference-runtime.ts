import path from "node:path";
import {
	createContextStore,
	createInferenceKnowledgeBase,
	createJobStore,
	type Engine,
	FileArtifactStore,
	type InferenceRuntime,
	type PipelineDefinition,
	runInferenceJob,
} from "@cx/inference";

const cwd = process.cwd();
const dataRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`)
	? path.resolve(cwd, "../..", ".data")
	: path.resolve(cwd, ".data");
const artifactStore = new FileArtifactStore(dataRoot);
const jobStore = createJobStore(artifactStore, {
	now: () => new Date().toISOString(),
	newId: () => `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
});

const sourceSpecEngine: Engine = {
	async execute(request) {
		const jobInput =
			request.inputs.job && typeof request.inputs.job === "object"
				? (request.inputs.job as Record<string, unknown>)
				: {};
		const screenCode = typeof jobInput.screenCode === "string" ? jobInput.screenCode : "MVP-SCREEN";
		return {
			raw: {
				schemaVersion: "source-spec.v0.1",
				sourceImport: {
					files: [],
					importId: String(jobInput.importId ?? "api-inference-mvp"),
					receivedAt: new Date().toISOString(),
					sourceKind: "prdd-markdown-bundle",
				},
				sourceShape: {
					screen: {
						name: String(jobInput.name ?? screenCode),
						regions: [],
						route: String(jobInput.route ?? `/${screenCode.toLowerCase()}`),
						screenCode,
					},
				},
			},
		};
	},
};

const screenGenerationPipeline: PipelineDefinition = {
	id: "screen-generation",
	version: "v1",
	steps: [
		{
			id: "01-analyze",
			engine: "function",
			inputs: {
				job: { kind: "job-input" },
			},
			run: { id: "source-spec-mvp" },
			output: {
				contractRef: { source: "output-contract", id: "source-spec" },
				writeToContext: "source-spec",
			},
		},
	],
};

export const inferenceRuntime: InferenceRuntime = {
	artifactStore,
	createContextStore: (jobId) => createContextStore(jobId, artifactStore),
	engines: {
		claude: sourceSpecEngine,
		function: sourceSpecEngine,
	},
	jobStore,
	knowledgeBase: createInferenceKnowledgeBase(),
	newId: () => `runtime-${Date.now().toString(36)}`,
	now: () => new Date().toISOString(),
	pipelines: {
		register() {},
		get(pipelineId, pipelineVersion) {
			if (
				pipelineId === screenGenerationPipeline.id &&
				pipelineVersion === screenGenerationPipeline.version
			) {
				return screenGenerationPipeline;
			}
			throw new Error(`Unknown inference pipeline: ${pipelineId}@${pipelineVersion}`);
		},
	},
};

export async function createInferenceJob(input: unknown) {
	const job = await inferenceRuntime.jobStore.createJob({
		pipelineId: "screen-generation",
		pipelineVersion: "v1",
		input,
	});
	void runInferenceJob(inferenceRuntime, job.jobId);
	return job;
}
