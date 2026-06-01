export type SmokeRunManifestArtifactUsage = "apply-source" | "validation-and-comparison-only";

export type SmokeRunManifestLayer = "compose" | "revise" | "understand";

export type SmokeRunManifestLayerGroup = {
	artifacts: string[];
	layer: SmokeRunManifestLayer;
	stages: string[];
	traceKeys: string[];
};

export type SmokeRunManifest = {
	agentMode: string;
	agentResult: string;
	artifactRoot: string;
	componentProposal: string;
	compositionPlan: string;
	createdAt: string;
	decorationPlan: string;
	finalResult: string;
	patternSelection: string;
	pipelineId: "screen-generation";
	pipelineResult: string;
	qualityReview: string;
	runId: string;
	schemaVersion: "smoke-run-manifest.v0.1";
	screenIntent: string;
	sourcePath: string;
	sourceSpec: string;
	stageLayers: SmokeRunManifestLayerGroup[];
	stageOrder: string[];
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
	trace: string;
	validationReport: string;
};
