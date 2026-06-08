import type { KnowledgeRef, OutputContractRef, StepInputRef } from "../contracts";

export const jobInput = (path?: string): StepInputRef => ({ kind: "job-input", path });
export const stepOutput = (stepId: string, outputName?: string): StepInputRef => ({
	kind: "step-output",
	stepId,
	outputName,
});
export const context = (key: string): StepInputRef => ({ kind: "context", key });
export const artifact = (path: string): StepInputRef => ({ kind: "artifact", path });
export const value = (input: unknown): StepInputRef => ({ kind: "value", value: input });

export const knowledge = (source: KnowledgeRef["source"], id?: string, version?: string): KnowledgeRef => ({
	source,
	id,
	version,
});

export const outputContractRef = (id: string, version?: string): OutputContractRef => ({
	source: "output-contract",
	id,
	version,
});
