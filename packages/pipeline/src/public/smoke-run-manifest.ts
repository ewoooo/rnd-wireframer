export type SmokeRunManifestArtifactUsage = "apply-source" | "validation-and-comparison-only";

export type SmokeRunManifest = {
	agentMode: string;
	agentResult: string;
	artifactRoot: string;
	createdAt: string;
	finalResult: string;
	pipelineId: "screen-generation";
	pipelineResult: string;
	qualityReview: string;
	runId: string;
	schemaVersion: "smoke-run-manifest.v0.1";
	sourcePath: string;
	summary: {
		errorCount: number;
		ok: boolean;
		validationOk?: boolean;
		warningCount: number;
	};
	tableGenerationResult: {
		source: string;
		usage: SmokeRunManifestArtifactUsage;
	};
	tags: string[];
	validationReport: string;
};
