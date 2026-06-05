import { SCREEN_GENERATION_PIPELINE_ID } from "../pipelines/screen-generation/constants";
import { runScreenGenerationPipeline } from "../pipelines/screen-generation/screen-generation-pipeline";
import type { PipelineRunResult, ScreenGenerationPipelineOptions } from "../public/types";

export async function runPipeline(
	pipeline: typeof SCREEN_GENERATION_PIPELINE_ID,
	options: ScreenGenerationPipelineOptions,
): Promise<PipelineRunResult> {
	if (pipeline !== SCREEN_GENERATION_PIPELINE_ID) {
		throw new Error(`Unknown pipeline: ${pipeline}`);
	}

	return runScreenGenerationPipeline(options);
}
