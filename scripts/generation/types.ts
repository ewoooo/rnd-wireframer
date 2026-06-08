export type GenerationSmokeOptions = {
	artifactRoot?: string;
	artifactStore?: "data-run" | "local-transient" | "web-fixture";
	disableDesignContext?: boolean;
	outDir?: string;
	runId?: string;
	tags?: string[];
	useAI?: boolean;
};

export type GenerationSmokeSummary = {
	ok: boolean;
	outDir: string;
	runDir: string;
	runId: string;
	validationOk?: boolean;
};

export type GenerationSmokeResult = {
	outDir: string;
	parseCommandResult: {
		parseResult: {
			ok: boolean;
		};
	};
	runId: string;
	summary: GenerationSmokeSummary;
	validationReport?: {
		summary?: {
			errorCount?: number;
			warningCount?: number;
		};
	};
};

export type GenerationSmokePipelineOptions = GenerationSmokeOptions;
