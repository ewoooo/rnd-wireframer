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
	layout: string;
	reason: string;
	targetRef: string;
	title: string;
};

export type SourceReferenceCatalogEntry = {
	componentType?: string;
	description?: string;
	label: string;
	props?: Record<string, string | number | boolean>;
	refs: string[];
	region: SourceSpec["sourceShape"]["screen"]["regions"][number]["slot"];
	raw?: SourceSpec["sourceShape"]["screen"]["regions"][number]["children"][number]["children"][number]["raw"];
	roleAlias?: string;
	sourceAreaId: string;
	sourceAreaName?: string;
	sourceComponentId: string;
	sourceId: string;
	variant?: string;
};

export type SourceReferenceCatalog = {
	allowedRefs: string[];
	entries: SourceReferenceCatalogEntry[];
};

export type ComponentContractCatalogEntry = {
	componentType: string;
	layoutCandidates: string[];
	props: Record<
		string,
		{
			required?: boolean;
			role?: string;
			type: string;
			values?: readonly string[];
		}
	>;
	sourceRefs: string[];
};

export type ComponentContractCatalog = {
	entries: ComponentContractCatalogEntry[];
};

export type PatternSelectionAgentContext = {
	compositionPlan?: unknown;
	layerCandidates: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
	sourceReferenceCatalog: SourceReferenceCatalog;
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

export type ScreenIntentAgentContext = {
	sourceSpec: SourceSpec;
	sourceReferenceCatalog: SourceReferenceCatalog;
	sourceSummary: PatternSelectionAgentContext["sourceSummary"];
	targetArtifact: {
		jsonSchema: JsonSchemaDocument;
		kind: GenerationArtifactKind;
		schemaVersion: SchemaVersion;
	};
};

export type ScreenIntentAgentInput = OrchestrationAgentTaskInput & {
	context: ScreenIntentAgentContext;
};

export type CompositionPlanAgentContext = PatternSelectionAgentContext & {
	screenIntent?: unknown;
	targetArtifact: {
		jsonSchema: JsonSchemaDocument;
		kind: GenerationArtifactKind;
		schemaVersion: SchemaVersion;
	};
};

export type CompositionPlanAgentInput = OrchestrationAgentTaskInput & {
	context: CompositionPlanAgentContext;
};

export type ScreenGenerationAgentContext = PatternSelectionAgentContext & {
	componentContractCatalog?: ComponentContractCatalog;
	compositionPlan?: unknown;
	intermediateArtifact: {
		jsonSchema: JsonSchemaDocument;
		kind: GenerationArtifactKind;
		schemaVersion: SchemaVersion;
	};
	patternSelection?: unknown;
	screenIntent?: unknown;
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

export type QualityReviewAgentContext = ScreenGenerationAgentContext & {
	candidate: unknown;
	validationReport?: unknown;
};

export type QualityReviewAgentInput = OrchestrationAgentTaskInput & {
	context: QualityReviewAgentContext;
};
