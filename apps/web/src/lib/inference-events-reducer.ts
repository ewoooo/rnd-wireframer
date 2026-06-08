import type { InferenceEvent } from "@cx/inference";

export type InferenceStreamStatus = "running" | "succeeded" | "failed";

export type InferenceStreamState = {
	events: InferenceEvent[];
	status: InferenceStreamStatus;
	lastSeq: number;
};

export const initialInferenceStreamState: InferenceStreamState = { events: [], status: "running", lastSeq: 0 };

export function reduceInferenceEvent(state: InferenceStreamState, event: InferenceEvent): InferenceStreamState {
	if (event.seq <= state.lastSeq) return state;
	const status: InferenceStreamStatus =
		event.type === "job_completed" ? "succeeded" : event.type === "job_failed" ? "failed" : state.status;
	return { events: [...state.events, event], status, lastSeq: event.seq };
}
