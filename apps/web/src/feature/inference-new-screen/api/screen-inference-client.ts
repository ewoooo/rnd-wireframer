import type { InferenceEvent, Job, Step } from "@cx/inference/contracts";
import type { NewScreenSourceItem } from "@/feature/inference-new-screen/types";
import type {
	ScreenInferenceRunCreateResponse,
	ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";
import type { ScreenInferenceRunRow } from "@/lib/screen-inference-runs";
import { toScreenInferenceStatus } from "@/lib/screen-inference-status-adapter";

type InferenceSourceUploadResponse = {
	error?: string;
	source?: NewScreenSourceItem;
};

type InferenceSourceListResponse = {
	error?: string;
	sources?: NewScreenSourceItem[];
};

type InferenceRunListResponse = {
	error?: string;
	runs?: ScreenInferenceRunRow[];
};

const artifactPathByAlias = {
	"agent-result.json": "steps/04-render-tree/output.json",
	"component-proposal.json": "context/component-proposal.json",
	"composition-plan.json": "context/composition-plan.json",
	"final-result.json": "context/render-tree.json",
	"pipeline-result.json": "job.json",
	"quality-review.json": "steps/08-quality/output.json",
	"screen-intent.json": "context/screen-intent.json",
	"source-spec.json": "context/source-spec.json",
	"validation-report.json": "context/validation-report.json",
} as const;

const inferenceEventTypes = [
	"job_started",
	"job_completed",
	"job_failed",
	"step_started",
	"step_completed",
	"step_failed",
] as const;

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

export async function fetchScreenInferenceRuns(): Promise<ScreenInferenceRunRow[]> {
	const response = await fetch("/api/inference/runs");
	const body = (await response.json()) as InferenceRunListResponse;

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference run 목록 요청 실패 ${response.status}`);
	}

	return body.runs ?? [];
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
	return toScreenInferenceStatus({ isApplied: !!applyResult?.ok, job, steps });
}

export async function fetchScreenInferenceArtifact<T>(
	runId: string,
	artifactName: string,
): Promise<T> {
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

	for (const type of inferenceEventTypes) {
		source.addEventListener(type, handleEvent);
	}
	source.addEventListener("error", handleError);

	return () => {
		for (const type of inferenceEventTypes) {
			source.removeEventListener(type, handleEvent);
		}
		source.removeEventListener("error", handleError);
		source.close();
	};
}

async function fetchInferenceJob(runId: string): Promise<Job> {
	const response = await fetch(`/api/inference/${encodeURIComponent(runId)}`);
	// A failed job is a valid 200 response whose own `error` is { code, message }.
	// Only a transport-level failure (e.g. 404 envelope) should throw here; the
	// job's recorded failure flows through as status "failed".
	const body = (await response.json()) as Job & { error?: unknown };
	if (!response.ok) {
		const envelopeError =
			typeof body.error === "string"
				? body.error
				: `새 화면 inference 상태 요청 실패 ${response.status}`;
		throw new Error(envelopeError);
	}
	return body as Job;
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

function readArtifactPath(artifactName: string): string {
	return artifactPathByAlias[artifactName as keyof typeof artifactPathByAlias] ?? artifactName;
}
