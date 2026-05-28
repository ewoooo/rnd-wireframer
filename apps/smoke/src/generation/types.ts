import type { ParseMarkdownSourceCommandResult } from "@cx/pipeline/parser";
import type {
	PipelineRunResult,
	PipelineSummary,
	ScreenGenerationPipelineOptions,
} from "@cx/pipeline/types";

export type GenerationSmokeOptions = {
	outDir?: string;
	runId?: string;
	useAI?: boolean;
};

export type GenerationSmokeSummary = PipelineSummary;

export type GenerationSmokeResult = PipelineRunResult & {
	parseCommandResult: ParseMarkdownSourceCommandResult;
};

export type GenerationSmokePipelineOptions = ScreenGenerationPipelineOptions;
