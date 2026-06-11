import { INFERENCE_ARTIFACT_PATH, type InferenceRuntime } from "../contracts";
import { runStep } from "../pipeline/run-step";
import { shouldRunInferenceStep } from "../policies/inference-policy";
import {
	recordJobFailed,
	recordJobStarted,
	recordJobSucceeded,
	recordStepFailed,
	recordStepStarted,
	recordStepSucceeded,
} from "./lifecycle";
import { resolveInput } from "./resolve-input";
import { writeStepExecutionArtifacts, writeStepOutputArtifact } from "./step-artifacts";

export async function runInferenceJob(
	runtime: InferenceRuntime,
	jobId: string,
	options: { contextOverrides?: Record<string, unknown>; startFromStepId?: string } = {},
): Promise<void> {
	try {
		const job = await runtime.jobStore.getJob(jobId);
		const pipeline = runtime.pipelines.get(job.pipelineId, job.pipelineVersion);
		const contextStore = runtime.createContextStore(jobId);

		const { contextOverrides, startFromStepId } = options;
		const startIndex = startFromStepId
			? pipeline.steps.findIndex((step) => step.id === startFromStepId)
			: 0;
		if (startIndex < 0) {
			throw new Error(`Unknown startFromStepId: ${startFromStepId}`);
		}
		// Steps before startFromStepId are skipped; their context outputs from a prior
		// run stay on disk under the same jobId, so downstream context reads still resolve.
		const stepsToRun = pipeline.steps.slice(startIndex);

		// Overrides land in working memory before any step runs, so a rerun can
		// patch context through the API instead of hand-editing context/*.json.
		for (const [key, value] of Object.entries(contextOverrides ?? {})) {
			await contextStore.writeJson(key, value);
		}

		// Reset leftover snapshots in the run range so a rerun never presents a
		// prior attempt's succeeded/failed as this run's result — without this,
		// steps whose runWhen turns false would keep their stale snapshot forever.
		// Steps that never ran have no snapshot and stay that way (first-run contract).
		for (const step of stepsToRun) {
			if (await runtime.artifactStore.exists(jobId, INFERENCE_ARTIFACT_PATH.step.state(step.id))) {
				await runtime.jobStore.createStep(jobId, step.id);
			}
		}

		await recordJobStarted({ jobId, runtime });

		for (const step of stepsToRun) {
			if (!(await shouldRunInferenceStep(step.runWhen, contextStore))) continue;

			await recordStepStarted({ jobId, runtime, stepId: step.id });

			const execution = await runStep(step, {
				engines: runtime.engines,
				resolveInput: (ref) => resolveInput(job.input, ref, contextStore),
				resolveReference: (ref) => runtime.knowledgeBase.resolve(ref),
				resolveOutputContract: (ref) => runtime.knowledgeBase.resolveOutputContract(ref),
			});

			await writeStepExecutionArtifacts({
				artifactStore: runtime.artifactStore,
				execution,
				jobId,
				stepId: step.id,
			});
			for (const [key, value] of Object.entries(execution.contextWrites ?? {})) {
				await contextStore.writeJson(key, value);
			}

			if (execution.status === "failed") {
				await recordStepFailed({ execution, jobId, runtime, stepId: step.id });
				throw execution.error ?? new Error(`Step failed: ${step.id}`);
			}

			await writeStepOutputArtifact({
				artifactStore: runtime.artifactStore,
				execution,
				jobId,
				stepId: step.id,
			});
			await recordStepSucceeded({ jobId, runtime, stepId: step.id });
		}

		await recordJobSucceeded({ jobId, runtime });
	} catch (error) {
		try {
			await recordJobFailed({ error, jobId, runtime });
		} catch {
			// best-effort: store itself is broken, nothing more to record
		}
	}
}
