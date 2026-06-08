import type { InferenceEvent, Job, Step } from "@cx/inference";
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import {
	createFailedScreenInferenceStatus,
	createScreenInferenceProgressStatus,
	createScreenInferenceStatus,
	createWaitingReviewStatus,
	type PipelineStageId,
	type ScreenInferenceRunCreateResponse,
	type ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";

type InferenceSourceUploadResponse = {
	error?: string;
	source?: NewScreenSourceItem;
};

type InferenceSourceListResponse = {
	error?: string;
	sources?: NewScreenSourceItem[];
};

const STAGE_BY_STEP_ID: Record<string, PipelineStageId> = {
	"01-source-spec": "parse-source",
	"02-screen-intent": "derive-screen-intent",
	"03-composition": "plan-composition",
	"04-render-tree": "generate-render-tree",
	"05-quality": "review-quality",
};

export async function uploadScreenInferenceSource(file: File): Promise<NewScreenSourceItem> {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("importId", "web-upload");

	const response = await fetch("/api/inference/sources", {
		body: formData,
		method: "POST",
	});
	const body = (await response.json()) as InferenceSourceUploadResponse;

	if (!response.ok || body.error || !body.source) {
		throw new Error(body.error ?? `새 화면 source 업로드 실패 ${response.status}`);
	}

	return body.source;
}

export async function fetchScreenInferenceSources(): Promise<NewScreenSourceItem[]> {
	const response = await fetch("/api/inference/sources");
	const body = (await response.json()) as InferenceSourceListResponse;

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 source 목록 요청 실패 ${response.status}`);
	}

	return body.sources ?? [];
}

export async function createScreenInferenceRunFromSource(
	source: NewScreenSourceItem,
	previousRunId?: string,
): Promise<ScreenInferenceRunCreateResponse> {
	const response = await fetch("/api/inference", {
		body: JSON.stringify({
			previousRunId,
			screenCode: source.screenId,
			source: {
				path: source.path,
			},
			useAI: true,
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	const body = (await response.json()) as { error?: string; jobId?: string };

	if (!response.ok || body.error || !body.jobId) {
		throw new Error(body.error ?? `새 화면 inference 시작 실패 ${response.status}`);
	}

	const status = await fetchScreenInferenceRunStatus(body.jobId);
	return {
		runId: body.jobId,
		status,
		statusUrl: `/api/inference/${encodeURIComponent(body.jobId)}`,
	};
}

export async function fetchScreenInferenceRunStatus(
	runId: string,
): Promise<ScreenInferenceRunStatus> {
	const [job, steps, applyResult] = await Promise.all([
		fetchInferenceJob(runId),
		fetchInferenceSteps(runId),
		fetchOptionalInferenceArtifact<{ ok?: boolean }>(runId, "context/apply-result.json"),
	]);
	return toScreenInferenceStatus(job, steps, !!applyResult?.ok);
}

export async function fetchScreenInferenceArtifact<T>(
	runId: string,
	artifactName: string,
): Promise<T> {
	if (artifactName === "validation-report.json") {
		const job = await fetchInferenceJob(runId);
		return {
			issues: job.error
				? [{ code: job.error.code, message: job.error.message, severity: "error" }]
				: [],
			ok: !job.error,
			schemaVersion: "validation-report.v0.1",
			summary: {
				errorCount: job.error ? 1 : 0,
				warningCount: 0,
			},
			target: "steps/04-render-tree/output.json",
		} as T;
	}

	const artifactPath = readArtifactPath(artifactName);
	return fetchInferenceArtifact<T>(runId, artifactPath);
}

export async function applyScreenInferenceRun(runId: string): Promise<void> {
	const response = await fetch(`/api/inference/${encodeURIComponent(runId)}/apply`, {
		method: "POST",
	});
	const body = (await response.json()) as { error?: string; ok?: boolean };

	if (!response.ok || body.error || !body.ok) {
		throw new Error(body.error ?? `새 화면 DB 등록 실패 ${response.status}`);
	}
}

export function subscribeScreenInferenceRunEvents(
	runId: string,
	handlers: {
		onError?: () => void;
		onEvent: (event: InferenceEvent) => Promise<void> | void;
	},
): () => void {
	if (typeof EventSource === "undefined") return () => undefined;

	const source = new EventSource(`/api/inference/${encodeURIComponent(runId)}/events`);
	const handleEvent = (message: MessageEvent<string>) => {
		try {
			void handlers.onEvent(JSON.parse(message.data) as InferenceEvent);
		} catch {
			// keep-alive comments are not JSON messages.
		}
	};
	const handleError = () => {
		handlers.onError?.();
	};

	for (const type of [
		"job_started",
		"job_completed",
		"job_failed",
		"step_started",
		"step_completed",
		"step_failed",
	]) {
		source.addEventListener(type, handleEvent);
	}
	source.addEventListener("error", handleError);

	return () => {
		for (const type of [
			"job_started",
			"job_completed",
			"job_failed",
			"step_started",
			"step_completed",
			"step_failed",
		]) {
			source.removeEventListener(type, handleEvent);
		}
		source.removeEventListener("error", handleError);
		source.close();
	};
}

async function fetchInferenceJob(runId: string): Promise<Job> {
	const response = await fetch(`/api/inference/${encodeURIComponent(runId)}`);
	const body = (await response.json()) as Job & { error?: string };
	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference 상태 요청 실패 ${response.status}`);
	}
	return body;
}

async function fetchInferenceSteps(runId: string): Promise<Step[]> {
	const response = await fetch(`/api/inference/${encodeURIComponent(runId)}/steps`);
	const body = (await response.json()) as { error?: string; steps?: Step[] };
	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference step 요청 실패 ${response.status}`);
	}
	return body.steps ?? [];
}

async function fetchInferenceArtifact<T>(runId: string, artifactPath: string): Promise<T> {
	const response = await fetch(
		`/api/inference/${encodeURIComponent(runId)}/artifacts/${artifactPath
			.split("/")
			.map(encodeURIComponent)
			.join("/")}`,
	);
	const body = (await response.json()) as T & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 artifact 요청 실패 ${response.status}`);
	}

	return body;
}

async function fetchOptionalInferenceArtifact<T>(
	runId: string,
	artifactPath: string,
): Promise<T | undefined> {
	try {
		return await fetchInferenceArtifact<T>(runId, artifactPath);
	} catch {
		return undefined;
	}
}

function toScreenInferenceStatus(
	job: Job,
	steps: Step[],
	isApplied: boolean,
): ScreenInferenceRunStatus {
	if (isApplied) {
		return createScreenInferenceStatus({
			createdAt: job.createdAt,
			now: job.updatedAt,
			runId: job.jobId,
			status: "applied",
		});
	}
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
			error: job.error,
			now: job.updatedAt,
			runId: job.jobId,
			stage: readStageForStep(job.currentStepId) ?? readFailedStage(steps),
		});
	}
	return createWaitingReviewStatus({
		createdAt: job.createdAt,
		manifest: {
			runId: job.jobId,
			sourcePath: readSourcePath(job.input),
			summary: {
				errorCount: 0,
				ok: true,
				validationOk: true,
				warningCount: 0,
			},
		},
		now: job.updatedAt,
		runId: job.jobId,
	});
}

function readArtifactPath(artifactName: string): string {
	if (artifactName === "final-result.json") return "steps/04-render-tree/output.json";
	if (artifactName === "quality-review.json") return "steps/05-quality/output.json";
	if (artifactName === "pipeline-result.json") return "job.json";
	if (artifactName === "agent-result.json") return "steps/04-render-tree/raw-response.json";
	return artifactName;
}

function readStageForStep(stepId?: string): PipelineStageId | undefined {
	return stepId ? STAGE_BY_STEP_ID[stepId] : undefined;
}

function readFailedStage(steps: Step[]): PipelineStageId | undefined {
	return readStageForStep(steps.find((step) => step.status === "failed")?.stepId);
}

function readSourcePath(input: unknown): string | undefined {
	if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
	const source = (input as Record<string, unknown>).source;
	if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
	const sourcePath = (source as Record<string, unknown>).path;
	return typeof sourcePath === "string" ? sourcePath : undefined;
}
