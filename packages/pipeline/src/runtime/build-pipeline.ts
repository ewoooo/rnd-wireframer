import type { PipelineDefinition } from "../public/types";

export function buildPipeline(definition: PipelineDefinition): PipelineDefinition {
	return {
		id: definition.id,
		stages: [...definition.stages],
	};
}
