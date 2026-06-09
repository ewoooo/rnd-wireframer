import { type ArtifactStore, INFERENCE_ARTIFACT_PATH, type StepExecution } from "../contracts";

export async function writeStepExecutionArtifacts(input: {
	artifactStore: ArtifactStore;
	execution: StepExecution;
	jobId: string;
	stepId: string;
}): Promise<void> {
	const { artifactStore, execution, jobId, stepId } = input;
	await artifactStore.writeJson(
		jobId,
		INFERENCE_ARTIFACT_PATH.step.inputs(stepId),
		execution.inputs,
	);
	await artifactStore.writeJson(
		jobId,
		INFERENCE_ARTIFACT_PATH.step.references(stepId),
		execution.references,
	);
	await artifactStore.writeJson(
		jobId,
		INFERENCE_ARTIFACT_PATH.step.outputContract(stepId),
		execution.outputContract,
	);
	if (execution.prompt) {
		await artifactStore.writeJson(
			jobId,
			INFERENCE_ARTIFACT_PATH.step.prompt(stepId),
			execution.prompt,
		);
	}
	await artifactStore.writeJson(
		jobId,
		INFERENCE_ARTIFACT_PATH.step.rawResponse(stepId),
		execution.raw,
	);
}

export async function writeStepOutputArtifact(input: {
	artifactStore: ArtifactStore;
	execution: StepExecution;
	jobId: string;
	stepId: string;
}): Promise<void> {
	const { artifactStore, execution, jobId, stepId } = input;
	await artifactStore.writeJson(jobId, INFERENCE_ARTIFACT_PATH.step.output(stepId), execution.raw);
}
