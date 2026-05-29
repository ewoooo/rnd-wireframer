export const SCHEMA_VERSION = {
	agentRequest: "agent-request.v0.1",
	agentResult: "agent-result.v0.1",
	applyResult: "apply-result.v0.1",
	draftCandidate: "draft-candidate.v0.1",
	generationContext: "generation-context.v0.1",
	preview: "preview.v0.1",
	qualityInspection: "quality-inspection.v0.1",
	renderTree: "render-tree.v0.1",
	compositionPlan: "composition-plan.v0.1",
	screenIntent: "screen-intent.v0.1",
	sourceSpec: "source-spec.v0.1",
	tableGenerationResult: "table-generation-result.v0.1",
	validationReport: "validation-report.v0.1",
} as const;

export type SchemaVersion = (typeof SCHEMA_VERSION)[keyof typeof SCHEMA_VERSION];
