import type { PipelineDefinition, PipelineRegistry } from "../contracts";

export function createPipelineRegistry(): PipelineRegistry {
	const map = new Map<string, PipelineDefinition>();
	const key = (id: string, version: string) => `${id}@${version}`;
	return {
		register(pipeline) {
			map.set(key(pipeline.id, pipeline.version), pipeline);
		},
		get(id, version) {
			const found = map.get(key(id, version));
			if (!found) throw new Error(`Unknown pipeline: ${key(id, version)}`);
			return found;
		},
	};
}
