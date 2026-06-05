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
import type { PatternLayerCandidate } from "./candidate";
import type { ComponentContractCatalog, SourceReferenceCatalog } from "./catalog";

export type { DesignSkillSelectionContract } from "@cx/schema";

export type InferenceAgentTaskInput = {
	context?: unknown;
	previousResult?: unknown;
	query: string;
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
