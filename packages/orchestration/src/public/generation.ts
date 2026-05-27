import { getJsonSchema, SCHEMA_VERSION, type SourceSpec } from "@cx/schema";
import {
	GENERATION_PLAN_STEP,
	type GenerationPlan,
	type GenerationPlanOptions,
	type PatternLayerCandidate,
	type PatternSelectionAgentInput,
	type ScreenGenerationAgentInput,
	type ScreenRevisionAgentInput,
} from "./types";

export function buildGenerationPlan(options: GenerationPlanOptions = {}): GenerationPlan {
	const persistArtifacts = options.persistArtifacts ?? true;
	const reviseInvalid = options.reviseInvalid ?? true;
	const selectPattern = options.selectPattern ?? true;

	return {
		steps: [
			...(selectPattern
				? [
						{
							id: GENERATION_PLAN_STEP.selectPattern,
							kind: GENERATION_PLAN_STEP.selectPattern,
						},
					]
				: []),
			{
				id: GENERATION_PLAN_STEP.generateRenderTree,
				kind: GENERATION_PLAN_STEP.generateRenderTree,
			},
			{
				id: GENERATION_PLAN_STEP.validateRenderTree,
				kind: GENERATION_PLAN_STEP.validateRenderTree,
			},
			...(reviseInvalid
				? [
						{
							id: GENERATION_PLAN_STEP.reviseRenderTreeIfInvalid,
							kind: GENERATION_PLAN_STEP.reviseRenderTreeIfInvalid,
						},
						{
							id: "validate-render-tree-after-revision",
							kind: GENERATION_PLAN_STEP.validateRenderTree,
						},
					]
				: []),
			...(persistArtifacts
				? [
						{
							id: GENERATION_PLAN_STEP.writeArtifacts,
							kind: GENERATION_PLAN_STEP.writeArtifacts,
						},
					]
				: []),
		],
	};
}

export function buildPatternSelectionAgentInput(input: {
	layerCandidates: PatternLayerCandidate[];
	sourceSpec: SourceSpec;
}): PatternSelectionAgentInput {
	const sourceSummary = createSourceSummary(input.sourceSpec);

	return {
		query: [
			"Select the pattern layer strategy for the provided SourceSpec.",
			"Use only context.layerCandidates and their pattern refs. Do not invent unavailable pattern ids.",
			'Return one JSON object only with: schemaVersion "pattern-selection.v0.1", selectedCandidates, confidence, and reason.',
			"Select screen, region, area, and component candidates when they help the later table-shaped generation result.",
			"Each selected candidate must preserve its id, level, targetRef, and pattern.",
		].join("\n"),
		context: {
			layerCandidates: input.layerCandidates,
			sourceSpec: input.sourceSpec,
			sourceSummary,
		},
	};
}

export function buildScreenGenerationAgentInput(
	sourceSpec: SourceSpec,
	options: {
		layerCandidates?: PatternLayerCandidate[];
		patternSelection?: unknown;
	} = {},
): ScreenGenerationAgentInput {
	const screen = sourceSpec.sourceShape.screen;
	const componentIds = listSourceComponentIds(sourceSpec).join(", ");
	const sourceSummary = createSourceSummary(sourceSpec);

	return {
		query: [
			"Generate a RenderTree candidate from the provided SourceSpec.",
			"Use only the structured SourceSpec context as the source of truth.",
			"Use context.patternSelection as layout-pattern guidance when present.",
			"Use context.layerCandidates as screen, region, area, and component pattern refs; do not invent pattern ids.",
			"Respect sourceShape.screen.regions: each region contains area nodes, and each area contains component nodes.",
			"Map header, contents, and bottom regions to Screen.Header, Screen.Contents, and Screen.Bottom.",
			`Also produce tableGenerationResult using schemaVersion: ${SCHEMA_VERSION.tableGenerationResult}.`,
			"tableGenerationResult must follow context.intermediateArtifact.jsonSchema and use pattern refs shaped as {id, variant}.",
			"Every tableGenerationResult screen, region, area, and component record must include a real pattern ref from selected candidates.",
			`Use RenderTree contract version: ${SCHEMA_VERSION.renderTree}.`,
			"Return one JSON object only with tableGenerationResult and renderTree.",
			"renderTree must match context.targetArtifact.jsonSchema.",
			"Use top-level version, metadata, and children. Do not use contractVersion, schemaVersion, root, tree, nodeId, or componentId.",
			"Top-level metadata must not include title. Every render node metadata must include id and title.",
			"RenderTree node.pattern is optional preview provenance and, when present, must be shaped as {id, variant}.",
			"Put component-specific values inside node.props.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
			`Components: ${componentIds || "none"}`,
		].join("\n"),
		context: {
			intermediateArtifact: {
				jsonSchema: getJsonSchema("table-generation-result"),
				kind: "table-generation-result",
				schemaVersion: SCHEMA_VERSION.tableGenerationResult,
			},
			layerCandidates: options.layerCandidates ?? [],
			patternSelection: options.patternSelection,
			sourceSpec,
			sourceSummary,
			targetArtifact: {
				jsonSchema: getJsonSchema("render-tree"),
				kind: "render-tree",
				schemaVersion: SCHEMA_VERSION.renderTree,
			},
		},
	};
}

function createSourceSummary(sourceSpec: SourceSpec) {
	const screen = sourceSpec.sourceShape.screen;

	return {
		areaCount: countSourceAreas(sourceSpec),
		componentCount: listSourceComponentIds(sourceSpec).length,
		route: screen.route,
		screenCode: screen.screenCode,
		screenName: screen.name,
	};
}

export function buildScreenRevisionAgentInput(input: {
	layerCandidates?: PatternLayerCandidate[];
	patternSelection?: unknown;
	previousCandidate: unknown;
	sourceSpec: SourceSpec;
	validationReport: unknown;
}): ScreenRevisionAgentInput {
	const generationInput = buildScreenGenerationAgentInput(input.sourceSpec, {
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
	});

	return {
		query: [
			"Revise the previous RenderTree candidate so it satisfies the validation report.",
			"Use the provided SourceSpec as the source of truth and preserve the intended screen.",
			"Preserve context.patternSelection and context.layerCandidates guidance when revising layout structure.",
			"Preserve or fix tableGenerationResult so every screen, region, area, and component record has a real {id, variant} pattern ref.",
			"Return one JSON object only with tableGenerationResult and renderTree.",
			"Keep top-level version, metadata, and children. Do not use contractVersion, schemaVersion, root, tree, nodeId, or componentId.",
			"Top-level children must contain a Screen root node. Put Screen.Header, Screen.Contents, and Screen.Bottom under that Screen node.",
			"The Screen root node must contain Header, Contents, and Bottom regions.",
			'Use props.position values only from "fixed", "sticky", or "static". Prefer "static" when unsure.',
			'Use layout props as objects, for example: {"direction":"column"}. Do not use layout strings such as "stack".',
			"Every Screen.Header node must include props.position and props.layout.",
			"Every Screen.Contents node must include props.layout and boolean props.scroll.",
			"Every Screen.Bottom node must include props.position and props.layout.",
			"Fix required-field-missing and invalid-render-node errors before addressing warnings.",
		].join("\n"),
		context: {
			...generationInput.context,
			previousCandidate: input.previousCandidate,
			validationReport: input.validationReport,
		},
		previousResult: input.previousCandidate,
	};
}

function countSourceAreas(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) => count + region.children.length,
		0,
	);
}

function listSourceComponentIds(sourceSpec: SourceSpec): string[] {
	return sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => component.sourceComponentId),
		),
	);
}
