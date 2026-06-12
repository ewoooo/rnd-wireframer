import { SCHEMA_VERSION, type SchemaVersion } from "./versions";

export type GenerationArtifactKind =
	| "agent-request"
	| "agent-result"
	| "apply-result"
	| "component-proposal"
	| "composition-plan"
	| "decoration-plan"
	| "draft-candidate"
	| "generation-context"
	| "preview"
	| "quality-inspection"
	| "render-tree"
	| "screen-intent"
	| "source-spec"
	| "table-generation-result"
	| "validation-report";

export const SCHEMA_VERSION_BY_ARTIFACT_KIND = {
	"agent-request": SCHEMA_VERSION.agentRequest,
	"agent-result": SCHEMA_VERSION.agentResult,
	"apply-result": SCHEMA_VERSION.applyResult,
	"component-proposal": SCHEMA_VERSION.componentProposal,
	"composition-plan": SCHEMA_VERSION.compositionPlan,
	"decoration-plan": SCHEMA_VERSION.decorationPlan,
	"draft-candidate": SCHEMA_VERSION.draftCandidate,
	"generation-context": SCHEMA_VERSION.generationContext,
	preview: SCHEMA_VERSION.preview,
	"quality-inspection": SCHEMA_VERSION.qualityInspection,
	"render-tree": SCHEMA_VERSION.renderTree,
	"screen-intent": SCHEMA_VERSION.screenIntent,
	"source-spec": SCHEMA_VERSION.sourceSpec,
	"table-generation-result": SCHEMA_VERSION.tableGenerationResult,
	"validation-report": SCHEMA_VERSION.validationReport,
} as const satisfies Record<GenerationArtifactKind, SchemaVersion>;
