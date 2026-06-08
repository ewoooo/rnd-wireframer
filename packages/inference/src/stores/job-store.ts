import type { ArtifactStore, CreateJobInput, InferenceEvent, Job, JobStore, Step } from "../contracts";

const EVENTS = "events.ndjson";
const stepPath = (stepId: string) => `steps/${stepId}/step.json`;

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
			await store.writeJson(job.jobId, "job.json", job);
			return job;
		},

		async getJob(jobId: string): Promise<Job> {
			return store.readJson<Job>(jobId, "job.json");
		},

		async updateJob(jobId: string, patch: Partial<Job>): Promise<void> {
			const current = await store.readJson<Job>(jobId, "job.json");
			await store.writeJson(jobId, "job.json", { ...current, ...patch, updatedAt: clock.now() });
		},

		async createStep(jobId: string, stepId: string): Promise<void> {
			const step: Step = { stepId, status: "pending" };
			await store.writeJson(jobId, stepPath(stepId), step);
		},

		async updateStep(jobId: string, stepId: string, patch: Partial<Step>): Promise<void> {
			const current = await store.readJson<Step>(jobId, stepPath(stepId));
			await store.writeJson(jobId, stepPath(stepId), { ...current, ...patch });
		},

		async appendEvent(jobId: string, event: Omit<InferenceEvent, "seq">): Promise<InferenceEvent> {
			const existing = (await store.exists(jobId, EVENTS)) ? await store.readText(jobId, EVENTS) : "";
			const lines = existing ? existing.trimEnd().split("\n").filter(Boolean) : [];
			const stored: InferenceEvent = { ...event, seq: lines.length + 1 };
			await store.appendLine(jobId, EVENTS, JSON.stringify(stored));
			return stored;
		},

		async listEvents(jobId: string, after = 0): Promise<InferenceEvent[]> {
			if (!(await store.exists(jobId, EVENTS))) return [];
			const text = await store.readText(jobId, EVENTS);
			return text
				.trimEnd()
				.split("\n")
				.filter(Boolean)
				.map((line) => JSON.parse(line) as InferenceEvent)
				.filter((e) => e.seq > after);
		},
	};
}
