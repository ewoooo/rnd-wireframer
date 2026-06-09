import type { InferenceRuntime, StepExecution } from "../contracts";

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
