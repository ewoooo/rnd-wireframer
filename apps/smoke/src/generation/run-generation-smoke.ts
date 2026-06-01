import { runPipeline } from "@cx/pipeline";

import type { GenerationSmokeOptions, GenerationSmokeResult } from "./types";

export async function runGenerationSmoke(
	target: string,
	options: GenerationSmokeOptions = {},
): Promise<GenerationSmokeResult> {
	return runPipeline("screen-generation", {
		agentMode: options.useAI ? "claude-local-first" : "fake",
		artifactStore: {
			preset: options.artifactStore,
			rootDir: options.artifactRoot,
		},
		disableDesignContext: options.disableDesignContext,
		outDir: options.outDir,
		runId: options.runId,
		source: {
			path: target,
			type: "file",
		},
	}) as Promise<GenerationSmokeResult>;
}
