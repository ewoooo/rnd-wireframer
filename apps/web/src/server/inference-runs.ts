import type { ArtifactStore, JobStore } from "@cx/inference/contracts";
import {
	createScreenInferenceRunRow,
	type ScreenInferenceRunRow,
} from "@/lib/screen-inference-runs";

const RUN_ARTIFACT_PATH = {
	applyResult: "context/apply-result.json",
	qualityInspection: "context/quality-inspection.json",
	qualityStepOutput: "steps/08-quality/output.json",
	renderTree: "context/render-tree.json",
	sourceInput: "context/source-input.json",
	sourceSpec: "context/source-spec.json",
	validationReport: "context/validation-report.json",
} as const;

export async function listScreenInferenceRunRows(input: {
	artifactStore: ArtifactStore;
	jobStore: JobStore;
}): Promise<ScreenInferenceRunRow[]> {
	const jobs = await input.jobStore.listJobs();
	return Promise.all(
		jobs.map(async (job) => {
			const [
				hasRenderTree,
				hasValidationReport,
				hasQualityInspection,
				hasQualityStepOutput,
				sourceSpec,
				sourceInput,
				applyResult,
			] = await Promise.all([
				input.artifactStore.exists(job.jobId, RUN_ARTIFACT_PATH.renderTree),
				input.artifactStore.exists(job.jobId, RUN_ARTIFACT_PATH.validationReport),
				input.artifactStore.exists(job.jobId, RUN_ARTIFACT_PATH.qualityInspection),
				input.artifactStore.exists(job.jobId, RUN_ARTIFACT_PATH.qualityStepOutput),
				readOptionalJson(input.artifactStore, job.jobId, RUN_ARTIFACT_PATH.sourceSpec),
				readOptionalJson(input.artifactStore, job.jobId, RUN_ARTIFACT_PATH.sourceInput),
				readOptionalJson(input.artifactStore, job.jobId, RUN_ARTIFACT_PATH.applyResult),
			]);

			return createScreenInferenceRunRow({
				applyResult,
				artifacts: {
					hasQualityReview: hasQualityInspection || hasQualityStepOutput,
					hasRenderTree,
					hasValidationReport,
				},
				job,
				sourceInput,
				sourceSpec,
			});
		}),
	);
}

async function readOptionalJson(
	artifactStore: ArtifactStore,
	jobId: string,
	path: string,
): Promise<unknown> {
	if (!(await artifactStore.exists(jobId, path))) return undefined;
	try {
		return await artifactStore.readJson(jobId, path);
	} catch {
		return undefined;
	}
}
