import type { EngineRegistry } from "./engine";
import type { PromptPayload } from "./engine";
import type { PipelineRegistry } from "./pipeline";
import type { KnowledgeRef, ReferenceEnvelope, StepInputRef } from "./step";
import type { ArtifactStore, ContextStore, JobStore } from "./stores";

export type KnowledgeBase = {
	resolve(ref: KnowledgeRef): Promise<ReferenceEnvelope | ReferenceEnvelope[]>;
};

export type WorkerDeps = {
	jobStore: JobStore;
	artifactStore: ArtifactStore;
	createContextStore: (jobId: string) => ContextStore;
	engines: EngineRegistry;
	knowledgeBase: KnowledgeBase;
	pipelines: PipelineRegistry;
	now: () => string;
	newId: () => string;
};

/** Opaque public handle the app passes back to runInferenceJob. */
export type InferenceRuntime = WorkerDeps;

export type StepRunContext = {
	resolveInput: (ref: StepInputRef) => Promise<unknown>;
	resolveReference: (ref: KnowledgeRef) => Promise<ReferenceEnvelope | ReferenceEnvelope[]>;
	engines: EngineRegistry;
};

export type StepExecution = {
	status: "succeeded" | "failed";
	inputs: Record<string, unknown>;
	references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]>;
	prompt?: PromptPayload;
	raw: unknown;
	output?: unknown;
	contextWrites?: Record<string, unknown>;
	error?: { code: string; message: string };
};
