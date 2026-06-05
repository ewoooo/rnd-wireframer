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

/**
 * The output contract an agent must satisfy. Lives under `constraints` because the
 * generated artifact is inviolable: schema mismatch is a hard failure, not advice.
 */
export type ArtifactContract = {
	jsonSchema: JsonSchemaDocument;
	kind: GenerationArtifactKind;
	schemaVersion: SchemaVersion;
};

export type SourceSummary = {
	areaCount: number;
	componentCount: number;
	route: string;
	screenCode: string;
	screenName: string;
};

/**
 * Agent context is grouped by how the agent must treat each field, not by topic:
 * - constraints: inviolable. Output must stay within these (source truth, vocabulary, schema).
 * - upstream: prior node decisions. Honor them unless they conflict with a constraint.
 * - guidance: advisory. Yields to constraints and upstream on conflict.
 * The grouping carries priority structurally, so prompts no longer spell it out in prose.
 */
export type PatternSelectionAgentContext = {
	constraints: {
		layerCandidates: PatternLayerCandidate[];
		sourceSpec: SourceSpec;
		sourceReferenceCatalog: SourceReferenceCatalog;
	};
	upstream: {
		compositionPlan?: unknown;
		decorationPlan?: DecorationPlanContract;
		screenIntent?: unknown;
	};
	guidance: {
		designContextBundleRefs?: DesignContextBundleRef[];
		designSkillSelection?: DesignSkillSelectionContract;
		sourceSummary: SourceSummary;
	};
};

export type PatternSelectionAgentInput = InferenceAgentTaskInput & {
	context: PatternSelectionAgentContext;
};

export type ScreenIntentAgentContext = {
	constraints: {
		sourceSpec: SourceSpec;
		sourceReferenceCatalog: SourceReferenceCatalog;
		targetArtifact: ArtifactContract;
	};
	guidance: {
		sourceSummary: SourceSummary;
	};
};

export type ScreenIntentAgentInput = InferenceAgentTaskInput & {
	context: ScreenIntentAgentContext;
};

export type CompositionPlanAgentContext = {
	constraints: PatternSelectionAgentContext["constraints"] & {
		targetArtifact: ArtifactContract;
	};
	upstream: PatternSelectionAgentContext["upstream"];
	guidance: PatternSelectionAgentContext["guidance"];
};

export type CompositionPlanAgentInput = InferenceAgentTaskInput & {
	context: CompositionPlanAgentContext;
};

export type ScreenGenerationAgentContext = {
	constraints: PatternSelectionAgentContext["constraints"] & {
		componentContractCatalog?: ComponentContractCatalog;
		intermediateArtifact: ArtifactContract;
		targetArtifact: ArtifactContract;
	};
	upstream: PatternSelectionAgentContext["upstream"] & {
		patternSelection?: unknown;
	};
	guidance: PatternSelectionAgentContext["guidance"] & {
		designContextBundles?: DesignContextBundleContent[];
	};
};

export type ScreenGenerationAgentInput = InferenceAgentTaskInput & {
	context: ScreenGenerationAgentContext;
};

export type ScreenRevisionAgentContext = {
	constraints: ScreenGenerationAgentContext["constraints"];
	upstream: ScreenGenerationAgentContext["upstream"] & {
		previousCandidate: unknown;
		qualityInspection?: unknown;
		validationReport: unknown;
	};
	guidance: ScreenGenerationAgentContext["guidance"];
};

export type ScreenRevisionAgentInput = InferenceAgentTaskInput & {
	context: ScreenRevisionAgentContext;
	previousResult: unknown;
};

export type QualityReviewAgentContext = {
	constraints: ScreenGenerationAgentContext["constraints"];
	upstream: ScreenGenerationAgentContext["upstream"] & {
		candidate: unknown;
		validationReport?: unknown;
	};
	guidance: ScreenGenerationAgentContext["guidance"];
};

export type QualityReviewAgentInput = InferenceAgentTaskInput & {
	context: QualityReviewAgentContext;
};

export type ComponentProposalAgentContext = {
	constraints: ScreenGenerationAgentContext["constraints"];
	upstream: ScreenGenerationAgentContext["upstream"] & {
		candidate?: unknown;
	};
	guidance: ScreenGenerationAgentContext["guidance"];
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
