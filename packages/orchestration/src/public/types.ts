import type {
	GenerationArtifactKind,
	JsonSchemaDocument,
	SchemaVersion,
	SourceSpec,
} from "@cx/schema";
import type { orchestrationBoundary } from "./contract";

export type OrchestrationBoundary = typeof orchestrationBoundary;
export type OrchestrationBoundaryName = OrchestrationBoundary["name"];
export type OrchestrationPackageName = OrchestrationBoundary["packageName"];

export type OrchestrationOperation = OrchestrationBoundary["owns"][number];

export type OrchestrationStageKind =
	| "source-ingest"
	| "generation"
	| "quality-review"
	| "preview"
	| "apply";

export type OrchestrationNextAction =
	| "request-generation"
	| "request-review"
	| "request-preview"
	| "request-apply"
	| "request-retry"
	| "stop";

export type OrchestrationIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
};

export type OrchestrationDecision = {
	action: OrchestrationNextAction;
	issues: OrchestrationIssue[];
	stage: OrchestrationStageKind;
};

export type OrchestrationAgentTaskInput = {
	context?: unknown;
	previousResult?: unknown;
	query: string;
};

export type PatternLayerCandidate = {
	constraints?: string[];
	id: string;
	level: "area" | "component" | "region" | "screen";
	pattern: {
		id: string;
		target: "area" | "composite" | "region" | "screen";
		variant?: string;
	};
	reason: string;
	targetRef: string;
	title: string;
};

export type PatternSelectionAgentContext = {
	layerCandidates: PatternLayerCandidate[];
	sourceSpec: SourceSpec;
	sourceSummary: {
		areaCount: number;
		componentCount: number;
		route: string;
		screenCode: string;
		screenName: string;
	};
};

export type PatternSelectionAgentInput = OrchestrationAgentTaskInput & {
	context: PatternSelectionAgentContext;
};

export type ScreenGenerationAgentContext = PatternSelectionAgentContext & {
	intermediateArtifact: {
		jsonSchema: JsonSchemaDocument;
		kind: GenerationArtifactKind;
		schemaVersion: SchemaVersion;
	};
	patternSelection?: unknown;
	targetArtifact: {
		jsonSchema: JsonSchemaDocument;
		kind: GenerationArtifactKind;
		schemaVersion: SchemaVersion;
	};
};

export type ScreenGenerationAgentInput = OrchestrationAgentTaskInput & {
	context: ScreenGenerationAgentContext;
};

export type ScreenRevisionAgentContext = ScreenGenerationAgentContext & {
	previousCandidate: unknown;
	validationReport: unknown;
};

export type ScreenRevisionAgentInput = OrchestrationAgentTaskInput & {
	context: ScreenRevisionAgentContext;
	previousResult: unknown;
};
