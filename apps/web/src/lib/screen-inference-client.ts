import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import {
	parseScreenInferencePipelineEventMessage,
	SCREEN_INFERENCE_PIPELINE_EVENT_NAME,
	type ScreenInferencePipelineEvent,
} from "@/lib/screen-inference-events";
import type {
	ScreenInferenceRunCreateResponse,
	ScreenInferenceRunResponse,
	ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";

type ScreenInferenceSourceUploadResponse = {
	error?: string;
	source?: NewScreenSourceItem;
};

type ScreenInferenceSourceListResponse = {
	error?: string;
	sources?: NewScreenSourceItem[];
};

export async function uploadScreenInferenceSource(file: File): Promise<NewScreenSourceItem> {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("importId", "web-upload");

	const response = await fetch("/api/screen-inference/sources", {
		body: formData,
		method: "POST",
	});
	const body = (await response.json()) as ScreenInferenceSourceUploadResponse;

	if (!response.ok || body.error || !body.source) {
		throw new Error(body.error ?? `새 화면 source 업로드 실패 ${response.status}`);
	}

	return body.source;
}

export async function fetchScreenInferenceSources(): Promise<NewScreenSourceItem[]> {
	const response = await fetch("/api/screen-inference/sources");
	const body = (await response.json()) as ScreenInferenceSourceListResponse;

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 source 목록 요청 실패 ${response.status}`);
	}

	return body.sources ?? [];
}

export async function createScreenInferenceRunFromSource(
	source: NewScreenSourceItem,
	previousRunId?: string,
): Promise<ScreenInferenceRunCreateResponse> {
	const response = await fetch("/api/screen-inference/runs", {
		body: JSON.stringify({
			previousRunId,
			screenId: source.screenId,
			source: {
				path: source.path,
			},
			useAI: true,
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	const body = (await response.json()) as ScreenInferenceRunCreateResponse & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference 시작 실패 ${response.status}`);
	}

	return body;
}

export async function fetchScreenInferenceRunStatus(
	runId: string,
): Promise<ScreenInferenceRunStatus> {
	const response = await fetch(`/api/screen-inference/runs/${encodeURIComponent(runId)}`);
	const body = (await response.json()) as ScreenInferenceRunResponse & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference 상태 요청 실패 ${response.status}`);
	}

	return body.status;
}

export async function fetchScreenInferenceArtifact<T>(
	runId: string,
	artifactName: string,
): Promise<T> {
	const response = await fetch(
		`/api/screen-inference/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(
			artifactName,
		)}`,
	);
	const body = (await response.json()) as T & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 artifact 요청 실패 ${response.status}`);
	}

	return body;
}

export async function applyScreenInferenceRun(runId: string): Promise<void> {
	const response = await fetch(`/api/screen-inference/runs/${encodeURIComponent(runId)}/apply`, {
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
		onEvent: (event: ScreenInferencePipelineEvent) => Promise<void> | void;
	},
): () => void {
	if (typeof EventSource === "undefined") return () => undefined;

	const source = new EventSource(`/api/screen-inference/runs/${encodeURIComponent(runId)}/events`);
	const handlePipelineEvent = (message: MessageEvent<string>) => {
		const event = parseScreenInferencePipelineEventMessage(message.data);
		if (!event) return;
		void handlers.onEvent(event);
	};
	const handleError = () => {
		handlers.onError?.();
	};

	source.addEventListener(SCREEN_INFERENCE_PIPELINE_EVENT_NAME, handlePipelineEvent);
	source.addEventListener("error", handleError);

	return () => {
		source.removeEventListener(SCREEN_INFERENCE_PIPELINE_EVENT_NAME, handlePipelineEvent);
		source.removeEventListener("error", handleError);
		source.close();
	};
}
