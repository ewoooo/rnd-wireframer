import type { CreateJobInput, InferenceEvent, Job, Step } from "./job";

export interface ArtifactStore {
	writeText(jobId: string, path: string, content: string): Promise<void>;
	writeJson(jobId: string, path: string, value: unknown): Promise<void>;
	appendLine(jobId: string, path: string, content: string): Promise<void>;
	readText(jobId: string, path: string): Promise<string>;
	readJson<T>(jobId: string, path: string): Promise<T>;
	exists(jobId: string, path: string): Promise<boolean>;
	listJobIds(): Promise<string[]>;
}

export interface JobStore {
	createJob(input: CreateJobInput): Promise<Job>;
	getJob(jobId: string): Promise<Job>;
	updateJob(jobId: string, patch: Partial<Job>): Promise<void>;
	createStep(jobId: string, stepId: string): Promise<void>;
	updateStep(jobId: string, stepId: string, patch: Partial<Step>): Promise<void>;
	appendEvent(jobId: string, event: Omit<InferenceEvent, "seq">): Promise<InferenceEvent>;
	listEvents(jobId: string, after?: number): Promise<InferenceEvent[]>;
	listJobs(): Promise<Job[]>;
}

export interface ContextStore {
	writeJson(key: string, value: unknown): Promise<void>;
	readJson<T>(key: string): Promise<T>;
	tryReadJson<T>(key: string): Promise<T | null>;
}
