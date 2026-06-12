import type { InferenceRuntime, StepExecution } from "../contracts";

export async function recordJobStarted(input: {
	jobId: string;
	runtime: InferenceRuntime;
}): Promise<void> {
	const { jobId, runtime } = input;
	await runtime.jobStore.updateJob(jobId, { status: "running" });
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		type: "job_started",
		timestamp: runtime.now(),
	});
}

export async function recordJobSucceeded(input: {
	jobId: string;
	runtime: InferenceRuntime;
}): Promise<void> {
	const { jobId, runtime } = input;
	await runtime.jobStore.updateJob(jobId, { status: "succeeded", currentStepId: undefined });
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		type: "job_completed",
		timestamp: runtime.now(),
	});
}

export async function recordJobFailed(input: {
	error: unknown;
	jobId: string;
	runtime: InferenceRuntime;
}): Promise<void> {
	const { error, jobId, runtime } = input;
	const normalized = normalizeJobError(error);
	await runtime.jobStore.updateJob(jobId, { status: "failed", error: normalized });
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		type: "job_failed",
		timestamp: runtime.now(),
		payload: normalized,
	});
}

export async function recordStepStarted(input: {
	jobId: string;
	runtime: InferenceRuntime;
	stepId: string;
}): Promise<void> {
	const { jobId, runtime, stepId } = input;
	await runtime.jobStore.createStep(jobId, stepId);
	await runtime.jobStore.updateJob(jobId, { currentStepId: stepId });
	await runtime.jobStore.updateStep(jobId, stepId, {
		status: "running",
		startedAt: runtime.now(),
	});
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		stepId,
		type: "step_started",
		timestamp: runtime.now(),
	});
}

export async function recordStepSucceeded(input: {
	jobId: string;
	runtime: InferenceRuntime;
	stepId: string;
}): Promise<void> {
	const { jobId, runtime, stepId } = input;
	await runtime.jobStore.updateStep(jobId, stepId, {
		status: "succeeded",
		completedAt: runtime.now(),
	});
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		stepId,
		type: "step_completed",
		timestamp: runtime.now(),
	});
}

export async function recordStepFailed(input: {
	execution: StepExecution;
	jobId: string;
	runtime: InferenceRuntime;
	stepId: string;
}): Promise<void> {
	const { execution, jobId, runtime, stepId } = input;
	await runtime.jobStore.updateStep(jobId, stepId, {
		status: "failed",
		completedAt: runtime.now(),
		error: execution.error,
	});
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		stepId,
		type: "step_failed",
		timestamp: runtime.now(),
		payload: execution.error,
	});
}

function normalizeJobError(error: unknown): { code: string; message: string } {
	if (error && typeof error === "object" && "code" in error && "message" in error) {
		return error as { code: string; message: string };
	}
	return {
		code: "inference_job_failed",
		message: error instanceof Error ? error.message : String(error),
	};
}
