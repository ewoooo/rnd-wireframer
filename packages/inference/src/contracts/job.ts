import type { InferenceEventType, JobStatus, StepStatus } from "./ids";

export type Job = {
	jobId: string;
	pipelineId: string;
	pipelineVersion: string;
	status: JobStatus;
	input: unknown;
	currentStepId?: string;
	error?: { code: string; message: string };
	createdAt: string;
	updatedAt: string;
};

export type CreateJobInput = {
	pipelineId: string;
	pipelineVersion: string;
	input: unknown;
};

export type Step = {
	stepId: string;
	status: StepStatus;
	startedAt?: string;
	completedAt?: string;
	error?: { code: string; message: string };
};

export type InferenceEvent = {
	seq: number;
	jobId: string;
	type: InferenceEventType;
	timestamp: string;
	stepId?: string;
	payload?: unknown;
};
