import {
	runScreenGenerationPipeline,
	screenGenerationPipelineDefinition,
} from "../pipelines/screen-generation/screen-generation-pipeline";
import type {
	PipelineDefinition,
	PipelineRunResult,
	ScreenGenerationPipelineOptions,
} from "../public/types";

export async function runPipeline(
	pipeline: "screen-generation" | PipelineDefinition,
	options: ScreenGenerationPipelineOptions,
): Promise<PipelineRunResult> {
	const definition = typeof pipeline === "string" ? resolvePipelineDefinition(pipeline) : pipeline;

	if (definition.id !== "screen-generation") {
		throw new Error(`Unknown pipeline: ${definition.id}`);
	}

	return runScreenGenerationPipeline(definition, options);
}

function resolvePipelineDefinition(id: "screen-generation"): PipelineDefinition {
	if (id === "screen-generation") return screenGenerationPipelineDefinition;
	throw new Error(`Unknown pipeline: ${id}`);
}
