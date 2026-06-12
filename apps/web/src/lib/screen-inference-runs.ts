import type { Job, JobStatus } from "@cx/inference/contracts";

export type ScreenInferenceRunRowStatus = JobStatus | "applied";

export type ScreenInferenceRunRow = {
	createdAt: string;
	currentStepId?: string;
	hasQualityReview: boolean;
	hasRenderTree: boolean;
	hasValidationReport: boolean;
	jobId: string;
	screenId?: string;
	sourcePath?: string;
	status: ScreenInferenceRunRowStatus;
	title?: string;
	updatedAt: string;
};

export function createScreenInferenceRunRow(input: {
	applyResult?: unknown;
	artifacts: {
		hasQualityReview: boolean;
		hasRenderTree: boolean;
		hasValidationReport: boolean;
	};
	job: Job;
	sourceInput?: unknown;
	sourceSpec?: unknown;
}): ScreenInferenceRunRow {
	const sourceSpecScreen = readSourceSpecScreen(input.sourceSpec);
	return {
		createdAt: input.job.createdAt,
		currentStepId: input.job.currentStepId,
		hasQualityReview: input.artifacts.hasQualityReview,
		hasRenderTree: input.artifacts.hasRenderTree,
		hasValidationReport: input.artifacts.hasValidationReport,
		jobId: input.job.jobId,
		screenId: sourceSpecScreen?.screenCode ?? readJobInputString(input.job.input, "screenCode"),
		sourcePath: readSourcePath(input.sourceInput) ?? readSourcePath(input.job.input),
		status: readRunStatus(input.job, input.applyResult),
		title: sourceSpecScreen?.name,
		updatedAt: input.job.updatedAt,
	};
}

function readRunStatus(job: Job, applyResult: unknown): ScreenInferenceRunRowStatus {
	if (readRecord(applyResult)?.ok === true) return "applied";
	return job.status;
}

function readSourceSpecScreen(input: unknown): { name?: string; screenCode?: string } | undefined {
	const screen = readRecord(readRecord(input)?.sourceShape)?.screen;
	const record = readRecord(screen);
	if (!record) return undefined;
	return {
		name: readString(record.name),
		screenCode: readString(record.screenCode),
	};
}

function readSourcePath(input: unknown): string | undefined {
	const source = readRecord(input)?.source;
	return readString(readRecord(source)?.path);
}

function readJobInputString(input: unknown, key: string): string | undefined {
	return readString(readRecord(input)?.[key]);
}

function readRecord(input: unknown): Record<string, unknown> | undefined {
	if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
	return input as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}
