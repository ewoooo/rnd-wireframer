import type { PipelineDefinition } from "../contracts";

export function definePipeline<const T extends PipelineDefinition>(pipeline: T): T {
	return pipeline;
}
