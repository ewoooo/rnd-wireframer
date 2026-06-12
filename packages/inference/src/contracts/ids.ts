export type JobStatus = "queued" | "running" | "succeeded" | "failed";
export type StepStatus = "pending" | "running" | "succeeded" | "failed";

export type InferenceEventType =
	| "job_started"
	| "job_completed"
	| "job_failed"
	| "step_started"
	| "step_completed"
	| "step_failed";
