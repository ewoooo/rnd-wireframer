import type { InferenceRuntime } from "../contracts";
import { runStep } from "../pipeline/run-step";
import { resolveInput } from "./resolve-input";

export async function runInferenceJob(runtime: InferenceRuntime, jobId: string): Promise<void> {
	try {
		const job = await runtime.jobStore.getJob(jobId);
		const pipeline = runtime.pipelines.get(job.pipelineId, job.pipelineVersion);
		const contextStore = runtime.createContextStore(jobId);

		await runtime.jobStore.updateJob(jobId, { status: "running" });
		await runtime.jobStore.appendEvent(jobId, {
			jobId,
			type: "job_started",
			timestamp: runtime.now(),
		});

		for (const step of pipeline.steps) {
			if (!(await shouldRunStep(step.runWhen, contextStore))) continue;

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
				resolveInput: (ref) => resolveInput(job.input, ref, contextStore),
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
			for (const [key, value] of Object.entries(execution.contextWrites ?? {})) {
				await contextStore.writeJson(key, value);
			}

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

			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/output.json`, execution.raw);
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
		try {
			await runtime.jobStore.updateJob(jobId, { status: "failed", error: normalized });
			await runtime.jobStore.appendEvent(jobId, {
				jobId,
				type: "job_failed",
				timestamp: runtime.now(),
				payload: normalized,
			});
		} catch {
			// best-effort: store itself is broken, nothing more to record
		}
	}
}

async function shouldRunStep(
	runWhen: { contextValidationReportHasErrors: string } | undefined,
	contextStore: ReturnType<InferenceRuntime["createContextStore"]>,
): Promise<boolean> {
	if (!runWhen) return true;
	const report = await contextStore.readJson<unknown>(runWhen.contextValidationReportHasErrors);
	return readValidationErrorCount(report) > 0;
}

function readValidationErrorCount(input: unknown): number {
	if (!input || typeof input !== "object" || Array.isArray(input)) return 0;
	const summary = (input as Record<string, unknown>).summary;
	if (!summary || typeof summary !== "object" || Array.isArray(summary)) return 0;
	const errorCount = (summary as Record<string, unknown>).errorCount;
	return typeof errorCount === "number" ? errorCount : 0;
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
