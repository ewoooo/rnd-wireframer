import {
	type DecorationPlanContract,
	type DesignContextBundleContent,
	type DesignContextBundleRef,
	getJsonSchema,
	SCHEMA_VERSION,
	type SourceSpec,
} from "@cx/schema";
import {
	buildSourceReferenceCatalog,
	createSourceSummary,
	listSourceComponentIds,
} from "./source-context";
import type {
	ComponentContractCatalog,
	CompositionPlanAgentInput,
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	QualityReviewAgentInput,
	ScreenGenerationAgentInput,
	ScreenIntentAgentInput,
	ScreenRevisionAgentInput,
} from "./types";

/**
 * Builds the screen-intent agent input from SourceSpec only.
 * This stage frames product purpose before any layout or RenderTree generation happens.
 */
export function buildScreenIntentAgentInput(sourceSpec: SourceSpec): ScreenIntentAgentInput {
	const sourceSummary = createSourceSummary(sourceSpec);
	const screen = sourceSpec.sourceShape.screen;

	return {
		query: [
			"Derive the screen intent from the provided SourceSpec before visual composition.",
			"Use only the structured SourceSpec context as the source of truth.",
			"Use only refs listed in context.sourceReferenceCatalog.allowedRefs when naming source references. Do not invent aliases such as AppBarHeader unless provided there.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.screenIntent}.`,
			"Capture screenPurpose, primaryUserAction, contentPriority, sourceInterpretation, and rationale.",
			"Also capture audience, primaryTask, successMoment, missingDecisions, and stateCoverageHints when SourceSpec provides enough evidence.",
			"contentPriority should list source component or area refs in the order the user should understand them.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
		].join("\n"),
		context: {
			sourceSpec,
			sourceReferenceCatalog: buildSourceReferenceCatalog(sourceSpec),
			sourceSummary,
			targetArtifact: {
				jsonSchema: getJsonSchema("screen-intent"),
				kind: "screen-intent",
				schemaVersion: SCHEMA_VERSION.screenIntent,
			},
		},
	};
}

/**
 * Builds the composition-planning input that turns intent and candidates into sections.
 * The function only assembles context; it does not choose or validate a final layout.
 */
export function buildCompositionPlanAgentInput(input: {
	layerCandidates?: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): CompositionPlanAgentInput {
	const sourceSummary = createSourceSummary(input.sourceSpec);
	const screen = input.sourceSpec.sourceShape.screen;

	return {
		query: [
			"Create a composition plan before pattern selection and RenderTree generation.",
			"Use context.screenIntent to preserve product/design purpose when present.",
			"Use context.layerCandidates as available layout ids; do not invent unavailable layout ids.",
			"Use only refs listed in context.sourceReferenceCatalog.allowedRefs in sections[].sourceRefs.",
			"Prefer sourceReferenceCatalog.entries[].sourceId for component refs when available.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.compositionPlan}.`,
			"Define screenLayout, layoutStrategy, sections, and rationale.",
			"Each section must identify targetRegion, role, priority, sourceRefs, and strategy.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
		].join("\n"),
		context: {
			layerCandidates: input.layerCandidates ?? [],
			screenIntent: input.screenIntent,
			sourceSpec: input.sourceSpec,
			sourceReferenceCatalog: buildSourceReferenceCatalog(input.sourceSpec),
			sourceSummary,
			targetArtifact: {
				jsonSchema: getJsonSchema("composition-plan"),
				kind: "composition-plan",
				schemaVersion: SCHEMA_VERSION.compositionPlan,
			},
		},
	};
}

/**
 * Builds the pattern-selection input from already-resolved pattern layer candidates.
 * Candidate ids are treated as the allowed layout vocabulary for the agent.
 */
export function buildPatternSelectionAgentInput(input: {
	layerCandidates: PatternLayerCandidate[];
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): PatternSelectionAgentInput {
	const sourceSummary = createSourceSummary(input.sourceSpec);

	return {
		query: [
			"Select the pattern layer strategy for the provided SourceSpec.",
			"Use only context.layerCandidates and their layout ids. Do not invent unavailable layout ids.",
			"Use context.sourceReferenceCatalog to keep selected target refs aligned with SourceSpec source ids.",
			'Return one JSON object only with: schemaVersion "pattern-selection.v0.1", selectedCandidates, confidence, and reason.',
			"Select screen, region, area, and component candidates when they help the later table-shaped generation result.",
			"Each selected candidate must preserve its id, level, targetRef, and layout.",
			"Use upstream screenIntent and compositionPlan as guidance when present.",
			"Use context.decorationPlan role and layoutIntent as deterministic area-level guidance when present.",
			"Use context.designContextBundleRefs as bounded design guidance when present; do not let bundles override SourceSpec or candidate ids.",
		].join("\n"),
		context: {
			compositionPlan: input.compositionPlan,
			decorationPlan: input.decorationPlan,
			designContextBundleRefs: input.designContextBundleRefs,
			layerCandidates: input.layerCandidates,
			screenIntent: input.screenIntent,
			sourceSpec: input.sourceSpec,
			sourceReferenceCatalog: buildSourceReferenceCatalog(input.sourceSpec),
			sourceSummary,
		},
	};
}

/**
 * Builds the main RenderTree generation input.
 * It combines source evidence, upstream design artifacts, pattern refs, and component contracts.
 */
export function buildScreenGenerationAgentInput(
	sourceSpec: SourceSpec,
	options: {
		componentContractCatalog?: ComponentContractCatalog;
		compositionPlan?: unknown;
		decorationPlan?: DecorationPlanContract;
		designContextBundleRefs?: DesignContextBundleRef[];
		designContextBundles?: DesignContextBundleContent[];
		layerCandidates?: PatternLayerCandidate[];
		patternSelection?: unknown;
		screenIntent?: unknown;
	} = {},
): ScreenGenerationAgentInput {
	const screen = sourceSpec.sourceShape.screen;
	const componentIds = listSourceComponentIds(sourceSpec).join(", ");
	const sourceSummary = createSourceSummary(sourceSpec);

	return {
		query: [
			"Generate a RenderTree candidate from the provided SourceSpec.",
			"Use only the structured SourceSpec context as the source of truth.",
			"Use context.screenIntent and context.compositionPlan as upstream design guidance when present.",
			"Use context.decorationPlan as deterministic display-structure guidance when present.",
			"Visible area titles must prefer context.decorationPlan.areas[].displayTitle. Preserve source area names only as provenance, not visible copy.",
			"When context.decorationPlan splits one source area into multiple decorated areas, materialize the split areas in RenderTree and tableGenerationResult.",
			"When context.decorationPlan.areas[].repeatedItems exists, use its propsHint values before falling back to placeholder source props.",
			"ListText with props.table dot must include props.subText for visible row copy.",
			"When SourceSpec includes errorPolicy, required agreement, disabled, loading, or validation evidence, include bounded display.stateRole coverage in RenderTree.",
			"Every CompositionPlan section should be visible in tableGenerationResult through matching region, area, component, metadata, or provenance identifiers.",
			"Preserve high-priority source refs from context.compositionPlan.sections[].sourceRefs whenever possible.",
			"Use context.patternSelection as layout-pattern guidance when present.",
			"Use context.designContextBundleRefs as bounded design guidance when present; do not let bundles override SourceSpec, schema, component contracts, or candidate ids.",
			"Use context.designContextBundles[].body as the actual design rules to apply (divider/spacing/hierarchy/state coverage). Keep priority: source evidence and schema/catalog over these rules.",
			"Pattern-store exploration is mandatory: use context.layerCandidates as the explored screen, region, area, and component layout ids; do not invent layout ids.",
			"Preserve the SourceSpec screen skeleton: Screen > Screen.Header/Screen.Contents/Screen.Bottom > area.static or area.dynamic > optional PageStack/layout wrapper > components.",
			"Never output a render node with type Area. Use SourceSpec area.renderNodeType, area.static, or area.dynamic for area wrapper nodes.",
			'Use the final RenderTree handoff shape as the primary result contract: top-level version, minRendererVersion "0.1.0", metadata, theme {"mode":"light"}, and children containing a Screen root.',
			"Screen region containers may omit props. When region props are present, keep them valid and renderer-oriented.",
			"Use PageStack or layout wrappers when the selected region/area pattern describes section grouping, list rails, or divider-separated sections.",
			"Use Divider only when the selected pattern-store candidate or source composition requires separation; keep it as a component node, not a raw border.",
			"Use context.sourceReferenceCatalog.allowedRefs as the only valid source ref vocabulary.",
			"Use context.sourceReferenceCatalog.entries[].props, description, and raw notes as source text evidence for visible labels and descriptions.",
			"Use context.componentContractCatalog when choosing component props and composite layout candidates. Do not invent component props or layout ids outside that context.",
			"Respect sourceShape.screen.regions: each region contains area nodes, and each area contains component nodes.",
			"Map header, contents, and bottom regions to Screen.Header, Screen.Contents, and Screen.Bottom.",
			`Also produce tableGenerationResult using schemaVersion: ${SCHEMA_VERSION.tableGenerationResult}.`,
			"tableGenerationResult must follow context.intermediateArtifact.jsonSchema and use layout ids shaped as layout.<target>.<PatternName>.",
			"Every tableGenerationResult screen, region, area, and component record must include a real layout id from selected candidates.",
			`Use RenderTree contract version: ${SCHEMA_VERSION.renderTree}.`,
			"Return one JSON object only with tableGenerationResult and renderTree.",
			"renderTree must match context.targetArtifact.jsonSchema.",
			"Use top-level version, metadata, and children. Do not use contractVersion, schemaVersion, root, tree, nodeId, or componentId.",
			"Top-level metadata must not include title. Every render node metadata must include id and title.",
			"RenderTree nodes use node.layout for layout pattern components.",
			"Put component-specific values inside node.props.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
			`Components: ${componentIds || "none"}`,
		].join("\n"),
		context: {
			componentContractCatalog: options.componentContractCatalog,
			compositionPlan: options.compositionPlan,
			decorationPlan: options.decorationPlan,
			designContextBundleRefs: options.designContextBundleRefs,
			designContextBundles: options.designContextBundles,
			intermediateArtifact: {
				jsonSchema: getJsonSchema("table-generation-result"),
				kind: "table-generation-result",
				schemaVersion: SCHEMA_VERSION.tableGenerationResult,
			},
			layerCandidates: options.layerCandidates ?? [],
			patternSelection: options.patternSelection,
			screenIntent: options.screenIntent,
			sourceSpec,
			sourceReferenceCatalog: buildSourceReferenceCatalog(sourceSpec),
			sourceSummary,
			targetArtifact: {
				jsonSchema: getJsonSchema("render-tree"),
				kind: "render-tree",
				schemaVersion: SCHEMA_VERSION.renderTree,
			},
		},
	};
}

/**
 * Builds the bounded revision input after validation or quality review finds defects.
 * The previous candidate is passed through as previousResult so the agent can edit in place.
 */
export function buildScreenRevisionAgentInput(input: {
	componentContractCatalog?: ComponentContractCatalog;
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	designContextBundles?: DesignContextBundleContent[];
	layerCandidates?: PatternLayerCandidate[];
	patternSelection?: unknown;
	previousCandidate: unknown;
	qualityInspection?: unknown;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
	validationReport: unknown;
}): ScreenRevisionAgentInput {
	const generationInput = buildScreenGenerationAgentInput(input.sourceSpec, {
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
	});

	return {
		query: [
			"Revise the previous RenderTree candidate so it satisfies the validation report.",
			"Use the provided SourceSpec as the source of truth and preserve the intended screen.",
			"Preserve context.patternSelection and context.layerCandidates guidance when revising layout structure.",
			"Preserve context.screenIntent and context.compositionPlan guidance when revising generated artifacts.",
			"Preserve context.decorationPlan split areas, display titles, roles, layout intents, and repeated item props hints.",
			"Preserve the SourceSpec screen skeleton during revision: keep area.static/area.dynamic wrapper nodes instead of flattening regions directly to leaf components.",
			"Do not replace invalid Area nodes by removing the wrapper. Replace them with area.static or area.dynamic and keep their children.",
			"Pattern-store exploration remains mandatory during revision: use context.layerCandidates and context.patternSelection as the allowed pattern evidence.",
			"Fix invented source refs by replacing them with refs from context.sourceReferenceCatalog.allowedRefs.",
			"Fix invented component props or layout ids by using context.componentContractCatalog.",
			"Keep CompositionPlan source refs visible in the revised tableGenerationResult whenever possible.",
			"Preserve or fix tableGenerationResult so every screen, region, area, and component record has a real layout id.",
			"Return one JSON object only with tableGenerationResult and renderTree.",
			"Keep top-level version, metadata, and children. Do not use contractVersion, schemaVersion, root, tree, nodeId, or componentId.",
			"Top-level children must contain a Screen root node. Put Screen.Header, Screen.Contents, and Screen.Bottom under that Screen node.",
			"The Screen root node must contain Header, Contents, and Bottom regions.",
			'Use the final RenderTree handoff shape as the primary result contract: top-level version, minRendererVersion "0.1.0", metadata, theme {"mode":"light"}, and children containing a Screen root.',
			"Screen region containers may omit props. When region props are present, keep them valid and renderer-oriented.",
			'Use props.position values only from "fixed", "sticky", or "static". Prefer "static" when unsure.',
			'Use layout props as objects, for example: {"direction":"column"}. Do not use layout strings such as "stack".',
			"Fix required-field-missing and invalid-render-node errors before addressing warnings.",
			"When context.qualityInspection is present, also fix bounded P0 quality findings without rewriting unrelated valid structure.",
		].join("\n"),
		context: {
			...generationInput.context,
			previousCandidate: input.previousCandidate,
			qualityInspection: input.qualityInspection,
			validationReport: input.validationReport,
		},
		previousResult: input.previousCandidate,
	};
}

/**
 * Builds the post-validation quality review input.
 * The review task reports bounded findings only; it does not approve or mutate artifacts.
 */
export function buildQualityReviewAgentInput(input: {
	candidate: unknown;
	componentContractCatalog?: ComponentContractCatalog;
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	designContextBundles?: DesignContextBundleContent[];
	layerCandidates?: PatternLayerCandidate[];
	patternSelection?: unknown;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
	validationReport?: unknown;
}): QualityReviewAgentInput {
	const generationInput = buildScreenGenerationAgentInput(input.sourceSpec, {
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
	});

	return {
		query: [
			"Review the generated screen candidate for design quality after schema and semantic validation.",
			"Use SourceSpec, screenIntent, compositionPlan, patternSelection, and validationReport as bounded evidence.",
			"Check source fidelity, composition alignment, visual hierarchy, action clarity, and obvious accessibility risks.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.qualityInspection}.`,
			"Return bounded findings only. Do not mutate files, approve artifacts, or invent schema fields.",
			"Use findings with code, severity, message, optional path, and optional suggestion.",
		].join("\n"),
		context: {
			...generationInput.context,
			candidate: input.candidate,
			validationReport: input.validationReport,
		},
	};
}
