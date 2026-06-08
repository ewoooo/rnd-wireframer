import type { InferenceEvent } from "@cx/inference";

const INFERENCE_EVENT_TYPES = [
	"job_started",
	"job_completed",
	"job_failed",
	"step_started",
	"step_completed",
	"step_failed",
] as const;

export async function createInferenceJob(input: unknown): Promise<string> {
	const response = await fetch("/api/inference", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!response.ok) throw new Error(`Inference job creation failed: ${response.status}`);
	const body = (await response.json()) as { jobId: string };
	return body.jobId;
}

export function subscribeInferenceEvents(
	jobId: string,
	handlers: { onEvent: (event: InferenceEvent) => void; onError?: () => void },
): () => void {
	if (typeof EventSource === "undefined") return () => undefined;
	const source = new EventSource(`/api/inference/${encodeURIComponent(jobId)}/events`);
	const onMessage = (message: MessageEvent<string>) => {
		try {
			handlers.onEvent(JSON.parse(message.data) as InferenceEvent);
		} catch {
			// keep-alive comments are not JSON
		}
	};
	const onError = () => handlers.onError?.();
	for (const type of INFERENCE_EVENT_TYPES) source.addEventListener(type, onMessage);
	source.addEventListener("error", onError);
	return () => {
		for (const type of INFERENCE_EVENT_TYPES) source.removeEventListener(type, onMessage);
		source.removeEventListener("error", onError);
		source.close();
	};
}
