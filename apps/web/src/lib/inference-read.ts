import type { InferenceRuntime, Step } from "@cx/inference";

export async function readStepSnapshots(runtime: InferenceRuntime, jobId: string): Promise<Step[]> {
	const job = await runtime.jobStore.getJob(jobId);
	const pipeline = runtime.pipelines.get(job.pipelineId, job.pipelineVersion);
	return Promise.all(
		pipeline.steps.map(async (step): Promise<Step> => {
			const stepPath = `steps/${step.id}/step.json`;
			if (await runtime.artifactStore.exists(jobId, stepPath)) {
				return runtime.artifactStore.readJson<Step>(jobId, stepPath);
			}
			return { stepId: step.id, status: "pending" };
		}),
	);
}

const ALLOWED_ARTIFACT =
	/^(job\.json|events\.ndjson|steps\/[a-z0-9-]+\/[a-z-]+\.json|context\/[a-z0-9-]+\.json)$/;

export async function readArtifact(runtime: InferenceRuntime, jobId: string, artifactPath: string): Promise<string> {
	if (!ALLOWED_ARTIFACT.test(artifactPath)) throw new Error(`Artifact not allowed: ${artifactPath}`);
	return runtime.artifactStore.readText(jobId, artifactPath);
}
