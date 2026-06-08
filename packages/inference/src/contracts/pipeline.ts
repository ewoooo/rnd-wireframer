import type { InferenceStepDefinition } from "./step";

export type PipelineDefinition = {
	id: string;
	version: string;
	steps: InferenceStepDefinition[];
};

export interface PipelineRegistry {
	register(pipeline: PipelineDefinition): void;
	get(pipelineId: string, pipelineVersion: string): PipelineDefinition;
}
