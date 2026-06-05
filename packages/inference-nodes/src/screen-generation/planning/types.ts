import type {
	DecorationPlanContract,
	DesignContextBundleContent,
	DesignContextBundleRef,
	DesignSkillSelectionContract,
	GenerationArtifactKind,
	JsonSchemaDocument,
	SchemaVersion,
	SourceSpec,
} from "@cx/schema";

export type { DesignSkillSelectionContract } from "@cx/schema";

export type InferencePlanningStageKind =
	| "source-ingest"
	| "generation"
	| "quality-review"
	| "preview"
	| "apply";

export type InferencePlanningNextAction =
	| "request-generation"
	| "request-review"
	| "request-preview"
	| "request-apply"
	| "request-retry"
	| "stop";

export type InferencePlanningIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
};

export type InferencePlanningDecision = {
	action: InferencePlanningNextAction;
	issues: InferencePlanningIssue[];
	stage: InferencePlanningStageKind;
};

export type InferenceAgentTaskInput = {
	context?: unknown;
	previousResult?: unknown;
	query: string;
};

export type DesignContextBundleSelection = {
	bundleRefs: DesignContextBundleRef[];
	rationale: string;
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

/**
 * A catalog component the agent MAY use that is not tied to a source ref.
 * Exposure is independent of status; `status` only marks stability (candidate is flagged).
 */
export type ComponentContractAvailableEntry = {
	componentType: string;
	status: "candidate" | "stable";
	props: ComponentContractCatalogEntry["props"];
};

export type ComponentContractCatalog = {
	/** Registry components beyond the source refs, each tagged with status. */
	available?: ComponentContractAvailableEntry[];
	entries: ComponentContractCatalogEntry[];
};

export type PatternSelectionAgentContext = {
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	designSkillSelection?: DesignSkillSelectionContract;
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

export type PatternSelectionAgentInput = InferenceAgentTaskInput & {
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

export type ScreenIntentAgentInput = InferenceAgentTaskInput & {
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

export type CompositionPlanAgentInput = InferenceAgentTaskInput & {
	context: CompositionPlanAgentContext;
};

export type ScreenGenerationAgentContext = PatternSelectionAgentContext & {
	componentContractCatalog?: ComponentContractCatalog;
	compositionPlan?: unknown;
	designContextBundles?: DesignContextBundleContent[];
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

export type ScreenGenerationAgentInput = InferenceAgentTaskInput & {
	context: ScreenGenerationAgentContext;
};

export type ScreenRevisionAgentContext = ScreenGenerationAgentContext & {
	previousCandidate: unknown;
	qualityInspection?: unknown;
	validationReport: unknown;
};

export type ScreenRevisionAgentInput = InferenceAgentTaskInput & {
	context: ScreenRevisionAgentContext;
	previousResult: unknown;
};

export type QualityReviewAgentContext = ScreenGenerationAgentContext & {
	candidate: unknown;
	validationReport?: unknown;
};

export type QualityReviewAgentInput = InferenceAgentTaskInput & {
	context: QualityReviewAgentContext;
};

export type ComponentProposalAgentContext = ScreenGenerationAgentContext & {
	candidate?: unknown;
};

export type ComponentProposalAgentInput = InferenceAgentTaskInput & {
	context: ComponentProposalAgentContext;
};

export type BuildGenerationNextActionInput = {
	initialValidationReport?: unknown;
	qualityInspection?: unknown;
	retryCount: number;
	validationReport?: unknown;
};

export type GenerationNextAction =
	| { action: "request-human-review"; reason: string }
	| { action: "request-revision"; reason: string; target: "contract" | "quality" }
	| { action: "stop"; reason: string }
	| { action: "write-artifacts"; reason: string };
