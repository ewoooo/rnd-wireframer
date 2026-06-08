import path from "node:path";
import type { InferenceEvent, Job } from "@cx/inference";
import { readErrorMessage } from "@/lib/api-error";
import type { ScreenInferencePipelineEvent } from "@/lib/screen-inference-events";
import {
	createFailedScreenInferenceStatus,
	createScreenInferenceProgressStatus,
	createScreenInferenceRunId,
	createScreenInferenceStatus,
	createWaitingReviewStatus,
	type PipelineStageId,
	type ScreenInferenceRunManifest,
	type ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";
import { CLIENT_IMPORT_ROOT } from "@/lib/server-paths";
import { createInferenceJob, inferenceRuntime } from "@/server/inference-runtime";

const STATUS_OVERRIDE_ARTIFACT = "screen-inference-status.json";

const STAGE_BY_STEP_ID: Record<string, PipelineStageId> = {
	"01-source-spec": "parse-source",
	"02-screen-intent": "derive-screen-intent",
	"03-composition": "plan-composition",
	"04-render-tree": "generate-render-tree",
	"05-quality": "review-quality",
};

export type ScreenInferenceRunCreateInput = {
	previousRunId?: string;
	runId?: string;
	screenId?: string;
	sourcePath: string;
	tags?: string[];
	useAI?: boolean;
};

export async function createScreenInferenceRun(input: ScreenInferenceRunCreateInput) {
	const sourcePath = resolveClientImportPath(input.sourcePath);
	const screenId = input.screenId ?? path.basename(sourcePath).replace(/\.md$/i, "");
	const requestedRunId = input.runId ?? createScreenInferenceRunId(screenId);
	const job = await createInferenceJob({
		importId: "web-screen-inference",
		name: screenId,
		previousRunId: input.previousRunId,
		requestedRunId,
		route: `/${screenId.toLowerCase()}`,
		screenCode: screenId,
		source: {
			path: path.relative(process.cwd(), sourcePath),
			type: "file",
		},
		tags: ["web-new-screen", ...(input.tags ?? [])],
		useAI: input.useAI ?? true,
	});
	const status = createScreenInferenceStatus({
		createdAt: job.createdAt,
		now: job.updatedAt,
		runId: job.jobId,
		status: "queued",
	});

	return {
		runId: job.jobId,
		status,
		statusUrl: `/api/screen-inference/runs/${encodeURIComponent(job.jobId)}`,
	};
}

export async function readScreenInferenceRun(runId: string) {
	try {
		const [job, override] = await Promise.all([readJob(runId), readStatusOverride(runId)]);
		const manifest = createManifest(job);
		return {
			manifest,
			status: override ?? createStatusFromJob(job, manifest),
		};
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") return undefined;
		throw error;
	}
}

export async function updateScreenInferenceRunStatus(
	runId: string,
	status: ScreenInferenceRunStatus["status"],
) {
	const current = await readScreenInferenceRun(runId);
	if (!current) throw new Error("Run not found.");
	const next =
		status === "applied"
			? {
					...createWaitingReviewStatus({
						createdAt: current.status.createdAt,
						manifest: current.manifest,
						now: new Date().toISOString(),
						runId,
					}),
					status,
				}
			: {
					...current.status,
					currentLayer: undefined,
					status,
					updatedAt: new Date().toISOString(),
				};
	await inferenceRuntime.artifactStore.writeJson(runId, STATUS_OVERRIDE_ARTIFACT, next);
}

export async function readScreenInferenceRunPipelineEvents(
	runId: string,
): Promise<ScreenInferencePipelineEvent[]> {
	const events = await inferenceRuntime.jobStore.listEvents(runId);
	return events.map(toScreenInferencePipelineEvent).filter((event) => !!event);
}

async function readJob(runId: string): Promise<Job> {
	return inferenceRuntime.jobStore.getJob(runId);
}

async function readStatusOverride(runId: string): Promise<ScreenInferenceRunStatus | undefined> {
	if (!(await inferenceRuntime.artifactStore.exists(runId, STATUS_OVERRIDE_ARTIFACT))) {
		return undefined;
	}
	return inferenceRuntime.artifactStore.readJson<ScreenInferenceRunStatus>(
		runId,
		STATUS_OVERRIDE_ARTIFACT,
	);
}

function createStatusFromJob(
	job: Job,
	manifest: ScreenInferenceRunManifest,
): ScreenInferenceRunStatus {
	if (job.status === "queued") {
		return createScreenInferenceStatus({
			createdAt: job.createdAt,
			now: job.updatedAt,
			runId: job.jobId,
			status: "queued",
		});
	}
	if (job.status === "running") {
		const stage = readStageForStep(job.currentStepId);
		return stage
			? createScreenInferenceProgressStatus({
					createdAt: job.createdAt,
					now: job.updatedAt,
					runId: job.jobId,
					stage,
				})
			: createScreenInferenceStatus({
					createdAt: job.createdAt,
					now: job.updatedAt,
					runId: job.jobId,
					status: "running",
				});
	}
	if (job.status === "failed") {
		return createFailedScreenInferenceStatus({
			createdAt: job.createdAt,
			error: {
				code: job.error?.code ?? "screen_inference_run_failed",
				message: readErrorMessage(job.error, "Screen inference run failed."),
			},
			now: job.updatedAt,
			runId: job.jobId,
			stage: readStageForStep(job.currentStepId),
		});
	}
	return createWaitingReviewStatus({
		createdAt: job.createdAt,
		manifest,
		now: job.updatedAt,
		runId: job.jobId,
	});
}

function createManifest(job: Job): ScreenInferenceRunManifest {
	const source = readJobInputRecord(job.input).source;
	const sourcePath =
		source && typeof source === "object" && "path" in source && typeof source.path === "string"
			? source.path
			: undefined;
	return {
		runId: job.jobId,
		sourcePath,
		summary: {
			errorCount: job.error ? 1 : 0,
			ok: job.status === "succeeded",
			validationOk: job.status === "succeeded",
			warningCount: 0,
		},
	};
}

function toScreenInferencePipelineEvent(
	event: InferenceEvent,
): ScreenInferencePipelineEvent | undefined {
	const stage = readStageForStep(event.stepId);
	const status = readPipelineEventStatus(event.type);
	if (!status) return undefined;
	return {
		eventId: String(event.seq),
		pipelineId: "screen-generation",
		runId: event.jobId,
		stage,
		status,
		timestamp: event.timestamp,
		type: stage ? "stage" : "job",
	};
}

function readPipelineEventStatus(
	type: InferenceEvent["type"],
): ScreenInferencePipelineEvent["status"] | undefined {
	if (type === "step_started" || type === "job_started") return "started";
	if (type === "step_completed" || type === "job_completed") return "completed";
	if (type === "step_failed" || type === "job_failed") return "failed";
	return undefined;
}

function readStageForStep(stepId?: string): PipelineStageId | undefined {
	return stepId ? STAGE_BY_STEP_ID[stepId] : undefined;
}

function readJobInputRecord(input: unknown): Record<string, unknown> {
	return input && typeof input === "object" && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: {};
}

function resolveClientImportPath(sourcePath: string): string {
	const absolutePath = path.resolve(process.cwd(), sourcePath);
	const relativePath = path.relative(CLIENT_IMPORT_ROOT, absolutePath);

	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error("source.path must be under data/client-imports/.");
	}
	if (!/\.md$/i.test(absolutePath)) {
		throw new Error("source.path must point to a Markdown file.");
	}

	return absolutePath;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
