import type { InferenceEventType } from "./ids";

export const INFERENCE_EVENT_TYPES = [
	"job_started",
	"job_completed",
	"job_failed",
	"step_started",
	"step_completed",
	"step_failed",
] as const satisfies readonly InferenceEventType[];

export const INFERENCE_TERMINAL_EVENT_TYPES = [
	"job_completed",
	"job_failed",
] as const satisfies readonly InferenceEventType[];

export function isInferenceTerminalEventType(type: InferenceEventType): boolean {
	return INFERENCE_TERMINAL_EVENT_TYPES.some((terminalType) => terminalType === type);
}
