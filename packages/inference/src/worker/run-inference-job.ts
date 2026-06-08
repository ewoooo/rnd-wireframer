import type { InferenceRuntime, StepInputRef } from "../contracts";
import { runStep } from "../pipeline/run-step";

export async function runInferenceJob(runtime: InferenceRuntime, jobId: string): Promise<void> {
	const job = await runtime.jobStore.getJob(jobId);
	const pipeline = runtime.pipelines.get(job.pipelineId, job.pipelineVersion);
	const contextStore = runtime.createContextStore(jobId);

	await runtime.jobStore.updateJob(jobId, { status: "running" });
	await runtime.jobStore.appendEvent(jobId, {
		jobId,
		type: "job_started",
		timestamp: runtime.now(),
	});

	try {
		for (const step of pipeline.steps) {
			await runtime.jobStore.createStep(jobId, step.id);
			await runtime.jobStore.updateJob(jobId, { currentStepId: step.id });
			await runtime.jobStore.updateStep(jobId, step.id, {
				status: "running",
				startedAt: runtime.now(),
			});
			await runtime.jobStore.appendEvent(jobId, {
				jobId,
				stepId: step.id,
				type: "step_started",
				timestamp: runtime.now(),
			});

			const execution = await runStep(step, {
				engines: runtime.engines,
				resolveInput: (ref) => resolveInput(jobId, job.input, ref, runtime, contextStore),
				resolveReference: (ref) => runtime.knowledgeBase.resolve(ref),
				resolveOutputContract: (ref) => runtime.knowledgeBase.resolveOutputContract(ref),
			});

			const stepRoot = `steps/${step.id}`;
			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/inputs.json`, execution.inputs);
			await runtime.artifactStore.writeJson(
				jobId,
				`${stepRoot}/references.json`,
				execution.references,
			);
			await runtime.artifactStore.writeJson(
				jobId,
				`${stepRoot}/output-contract.json`,
				execution.outputContract,
			);
			if (execution.prompt) {
				await runtime.artifactStore.writeJson(jobId, `${stepRoot}/prompt.json`, execution.prompt);
			}
			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/raw-response.json`, execution.raw);

			if (execution.status === "failed") {
				await runtime.jobStore.updateStep(jobId, step.id, {
					status: "failed",
					completedAt: runtime.now(),
					error: execution.error,
				});
				await runtime.jobStore.appendEvent(jobId, {
					jobId,
					stepId: step.id,
					type: "step_failed",
					timestamp: runtime.now(),
					payload: execution.error,
				});
				throw execution.error ?? new Error(`Step failed: ${step.id}`);
			}

			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/output.json`, execution.output);
			for (const [key, value] of Object.entries(execution.contextWrites ?? {})) {
				await contextStore.writeJson(key, value);
			}
			await runtime.jobStore.updateStep(jobId, step.id, {
				status: "succeeded",
				completedAt: runtime.now(),
			});
			await runtime.jobStore.appendEvent(jobId, {
				jobId,
				stepId: step.id,
				type: "step_completed",
				timestamp: runtime.now(),
			});
		}

		await runtime.jobStore.updateJob(jobId, { status: "succeeded", currentStepId: undefined });
		await runtime.jobStore.appendEvent(jobId, {
			jobId,
			type: "job_completed",
			timestamp: runtime.now(),
		});
	} catch (error) {
		const normalized = normalizeError(error);
		await runtime.jobStore.updateJob(jobId, { status: "failed", error: normalized });
		await runtime.jobStore.appendEvent(jobId, {
			jobId,
			type: "job_failed",
			timestamp: runtime.now(),
			payload: normalized,
		});
	}
}

async function resolveInput(
	jobId: string,
	jobInput: unknown,
	ref: StepInputRef,
	runtime: InferenceRuntime,
	contextStore: ReturnType<InferenceRuntime["createContextStore"]>,
): Promise<unknown> {
	switch (ref.kind) {
		case "job-input":
			return ref.path ? readPath(jobInput, ref.path) : jobInput;
		case "step-output":
			return runtime.artifactStore.readJson(jobId, `steps/${ref.stepId}/output.json`);
		case "context":
			return contextStore.readJson(ref.key);
		case "artifact":
			return runtime.artifactStore.readJson(jobId, ref.path);
		case "value":
			return ref.value;
	}
}

function readPath(value: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((current, key) => {
		if (current && typeof current === "object" && key in current) {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, value);
}

function normalizeError(error: unknown): { code: string; message: string } {
	if (error && typeof error === "object" && "code" in error && "message" in error) {
		return error as { code: string; message: string };
	}
	return {
		code: "inference_job_failed",
		message: error instanceof Error ? error.message : String(error),
	};
}
