import type { Job, Step } from "@cx/inference/contracts";
import {
	createFailedScreenInferenceStatus,
	createScreenInferenceProgressStatus,
	createScreenInferenceStatus,
	createWaitingReviewStatus,
	type PipelineStageId,
	type ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";

const stageByStepId = {
	"01-source-spec": "parse-source",
	// 02-intent-composition은 intent 판단과 구성 계획을 한 호출로 내는 통합 step.
	// 옛 잡 아티팩트의 02-screen-intent/03-composition 매핑은 읽기 호환으로 남긴다.
	"02-intent-composition": "plan-composition",
	"02-screen-intent": "derive-screen-intent",
	"03-composition": "plan-composition",
	"04-render-tree": "generate-render-tree",
	"05-validation": "validate-render-tree",
	"06-revision": "review-quality",
	"07-validation-after-revision": "validate-render-tree",
	"08-quality": "review-quality",
	"09-design-revision": "review-quality",
	"10-validation-after-design-revision": "validate-render-tree",
	"11-component-proposal": "propose-components",
} as const satisfies Record<string, PipelineStageId>;

export function toScreenInferenceStatus(input: {
	isApplied: boolean;
	job: Job;
	steps: Step[];
}): ScreenInferenceRunStatus {
	const { isApplied, job, steps } = input;
	if (isApplied) {
		return createScreenInferenceStatus({
			createdAt: job.createdAt,
			now: job.updatedAt,
			runId: job.jobId,
			status: "applied",
		});
	}
	if (job.status === "queued") {
		return createScreenInferenceStatus({
			createdAt: job.createdAt,
			now: job.updatedAt,
			runId: job.jobId,
			status: "queued",
		});
	}
	if (job.status === "running") {
		const stage = readStageForStep(job.currentStepId);
		return stage
			? createScreenInferenceProgressStatus({
					createdAt: job.createdAt,
					now: job.updatedAt,
					runId: job.jobId,
					stage,
				})
			: createScreenInferenceStatus({
					createdAt: job.createdAt,
					now: job.updatedAt,
					runId: job.jobId,
					status: "running",
				});
	}
	if (job.status === "failed") {
		return createFailedScreenInferenceStatus({
			createdAt: job.createdAt,
			error: job.error,
			now: job.updatedAt,
			runId: job.jobId,
			stage: readStageForStep(job.currentStepId) ?? readFailedStage(steps),
		});
	}
	return createWaitingReviewStatus({
		createdAt: job.createdAt,
		manifest: {
			runId: job.jobId,
			sourcePath: readSourcePath(job.input),
			summary: {
				errorCount: 0,
				ok: true,
				validationOk: true,
				warningCount: 0,
			},
		},
		now: job.updatedAt,
		runId: job.jobId,
	});
}

function readStageForStep(stepId?: string): PipelineStageId | undefined {
	return stepId ? stageByStepId[stepId as keyof typeof stageByStepId] : undefined;
}

function readFailedStage(steps: Step[]): PipelineStageId | undefined {
	return readStageForStep(steps.find((step) => step.status === "failed")?.stepId);
}

function readSourcePath(input: unknown): string | undefined {
	if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
	const source = (input as Record<string, unknown>).source;
	if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
	const sourcePath = (source as Record<string, unknown>).path;
	return typeof sourcePath === "string" ? sourcePath : undefined;
}
