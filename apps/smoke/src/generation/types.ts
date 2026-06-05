import type { ParseMarkdownSourceCommandResult } from "@cx/pipeline/parser";
import type {
	PipelineRunResult,
	PipelineSummary,
	ScreenGenerationPipelineOptions,
} from "@cx/pipeline/types";

export type GenerationSmokeOptions = {
	artifactRoot?: string;
	artifactStore?: "data-run" | "local-transient" | "web-fixture";
	disableDesignContext?: boolean;
	executionMode?: ScreenGenerationPipelineOptions["executionMode"];
	outDir?: string;
	runId?: string;
	tags?: string[];
	useAI?: boolean;
};

export type GenerationSmokeSummary = PipelineSummary;

export type GenerationSmokeResult = PipelineRunResult & {
	parseCommandResult: ParseMarkdownSourceCommandResult;
};

export type GenerationSmokePipelineOptions = ScreenGenerationPipelineOptions;
