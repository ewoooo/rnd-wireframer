import type {
	ArtifactStore,
	CreateJobInput,
	InferenceEvent,
	Job,
	JobStore,
	Step,
} from "../contracts";
import { INFERENCE_ARTIFACT_PATH } from "../contracts";

export function createJobStore(
	store: ArtifactStore,
	clock: { now: () => string; newId: () => string },
): JobStore {
	return {
		async createJob(input: CreateJobInput): Promise<Job> {
			const ts = clock.now();
			const job: Job = {
				jobId: clock.newId(),
				pipelineId: input.pipelineId,
				pipelineVersion: input.pipelineVersion,
				status: "queued",
				input: input.input,
				createdAt: ts,
				updatedAt: ts,
			};
			await store.writeJson(job.jobId, INFERENCE_ARTIFACT_PATH.job, job);
			return job;
		},

		async getJob(jobId: string): Promise<Job> {
			return store.readJson<Job>(jobId, INFERENCE_ARTIFACT_PATH.job);
		},

		async listJobs(): Promise<Job[]> {
			const jobs = await Promise.all(
				(await store.listJobIds()).map(async (jobId) => {
					try {
						return await store.readJson<Job>(jobId, INFERENCE_ARTIFACT_PATH.job);
					} catch {
						return undefined;
					}
				}),
			);
			return jobs
				.filter((job): job is Job => Boolean(job))
				.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
		},

		async updateJob(jobId: string, patch: Partial<Job>): Promise<void> {
			const current = await store.readJson<Job>(jobId, INFERENCE_ARTIFACT_PATH.job);
			await store.writeJson(jobId, INFERENCE_ARTIFACT_PATH.job, {
				...current,
				...patch,
				updatedAt: clock.now(),
			});
		},

		async createStep(jobId: string, stepId: string): Promise<void> {
			const step: Step = { stepId, status: "pending" };
			await store.writeJson(jobId, INFERENCE_ARTIFACT_PATH.step.state(stepId), step);
		},

		async updateStep(jobId: string, stepId: string, patch: Partial<Step>): Promise<void> {
			const current = await store.readJson<Step>(jobId, INFERENCE_ARTIFACT_PATH.step.state(stepId));
			await store.writeJson(jobId, INFERENCE_ARTIFACT_PATH.step.state(stepId), {
				...current,
				...patch,
			});
		},

		async appendEvent(jobId: string, event: Omit<InferenceEvent, "seq">): Promise<InferenceEvent> {
			const existing = (await store.exists(jobId, INFERENCE_ARTIFACT_PATH.events))
				? await store.readText(jobId, INFERENCE_ARTIFACT_PATH.events)
				: "";
			const lines = existing ? existing.trimEnd().split("\n").filter(Boolean) : [];
			const stored: InferenceEvent = { ...event, seq: lines.length + 1 };
			await store.appendLine(jobId, INFERENCE_ARTIFACT_PATH.events, JSON.stringify(stored));
			return stored;
		},

		async listEvents(jobId: string, after = 0): Promise<InferenceEvent[]> {
			if (!(await store.exists(jobId, INFERENCE_ARTIFACT_PATH.events))) return [];
			const text = await store.readText(jobId, INFERENCE_ARTIFACT_PATH.events);
			return text
				.trimEnd()
				.split("\n")
				.filter(Boolean)
				.map((line) => JSON.parse(line) as InferenceEvent)
				.filter((e) => e.seq > after);
		},
	};
}
