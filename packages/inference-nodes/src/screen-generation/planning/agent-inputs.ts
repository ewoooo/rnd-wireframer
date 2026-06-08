import {
	type DecorationPlanContract,
	type DesignContextBundleContent,
	type DesignContextBundleRef,
	type DesignSkillSelectionContract,
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
	ComponentProposalAgentInput,
	CompositionPlanAgentInput,
	PatternLayerCandidate,
	PatternSelectionAgentInput,
	QualityReviewAgentInput,
	ScreenGenerationAgentInput,
	ScreenIntentAgentInput,
	ScreenRevisionAgentInput,
} from "./types";

/**
 * Bucket priority, stated once. The context is grouped by how the agent must treat each
 * field, so individual prompt lines no longer repeat "do not let X override Y" or
 * "keep priority: source over rules" — that ordering now lives in this single note.
 */
const CONTEXT_PRIORITY_NOTE =
	"Treat context by group priority: context.constraints is inviolable (SourceSpec, schema, catalogs, candidate and layout ids); context.upstream holds prior-stage decisions to honor; context.guidance is advisory and yields to constraints and upstream on any conflict.";

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
			"Use only refs listed in context.constraints.sourceReferenceCatalog.allowedRefs when naming source references. Do not invent aliases such as AppBarHeader unless provided there.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.screenIntent}.`,
			"Capture screenPurpose, primaryUserAction, contentPriority, sourceInterpretation, and rationale.",
			"Also capture audience, primaryTask, successMoment, missingDecisions, and stateCoverageHints when SourceSpec provides enough evidence.",
			"contentPriority should list source component or area refs in the order the user should understand them.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
		].join("\n"),
		context: {
			constraints: {
				sourceSpec,
				sourceReferenceCatalog: buildSourceReferenceCatalog(sourceSpec),
				targetArtifact: {
					jsonSchema: getJsonSchema("screen-intent"),
					kind: "screen-intent",
					schemaVersion: SCHEMA_VERSION.screenIntent,
				},
			},
			guidance: {
				sourceSummary,
			},
		},
	};
}

/**
 * Builds the composition-planning input that turns intent and candidates into sections.
 * The function only assembles context; it does not choose or validate a final layout.
 */
export function buildCompositionPlanAgentInput(input: {
	designSkillSelection?: DesignSkillSelectionContract;
	layerCandidates?: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): CompositionPlanAgentInput {
	const sourceSummary = createSourceSummary(input.sourceSpec);
	const screen = input.sourceSpec.sourceShape.screen;

	return {
		query: [
			"Create a composition plan before pattern selection and RenderTree generation.",
			"Use context.upstream.screenIntent to preserve product/design purpose when present.",
			"Use context.constraints.layerCandidates as available layout ids; do not invent unavailable layout ids.",
			"Use context.guidance.designSkillSelection.selectedSkill as the bounded design skill for CompositionPlan decisions when present.",
			"Apply selected skill quality gates to visualHierarchy, primaryUserAction, sectionRhythm, density, patternRationale, and rejectedPatterns.",
			"Use context.guidance.designSkillSelection.selectedSkill.requiredDesignDocs as the intended design-doc reference set; do not invent additional design documents.",
			"Use only refs listed in context.constraints.sourceReferenceCatalog.allowedRefs in sections[].sourceRefs.",
			"Prefer sourceReferenceCatalog.entries[].sourceId for component refs when available.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.compositionPlan}.`,
			"Define screenLayout, layoutStrategy, sections, and rationale.",
			"Also define design decision fields: visualHierarchy, primaryUserAction, sectionRhythm, density, patternRationale, and rejectedPatterns.",
			"Use visualHierarchy for what the user should perceive first, primaryUserAction for the main action slot, sectionRhythm for section pacing/divider cadence, density for low/medium/high information density, patternRationale for the selected composition pattern reasoning, and rejectedPatterns for plausible alternatives intentionally not used.",
			"Ground those decisions in the design-context layout-composition guidance linked to COMPOSITION_LAYERS, SECTION_PATTERNS, SCREEN_PATTERN_SUMMARY, LAYOUT_SPACING_CONTRACT, and INTERACTION_PATTERNS.",
			"Each section must identify targetRegion, role, priority, sourceRefs, and strategy.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
		].join("\n"),
		context: {
			constraints: {
				layerCandidates: input.layerCandidates ?? [],
				sourceSpec: input.sourceSpec,
				sourceReferenceCatalog: buildSourceReferenceCatalog(input.sourceSpec),
				targetArtifact: {
					jsonSchema: getJsonSchema("composition-plan"),
					kind: "composition-plan",
					schemaVersion: SCHEMA_VERSION.compositionPlan,
				},
			},
			upstream: {
				screenIntent: input.screenIntent,
			},
			guidance: {
				designSkillSelection: input.designSkillSelection,
				sourceSummary,
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
	designSkillSelection?: DesignSkillSelectionContract;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): PatternSelectionAgentInput {
	const sourceSummary = createSourceSummary(input.sourceSpec);

	return {
		query: [
			"Select the pattern layer strategy for the provided SourceSpec.",
			CONTEXT_PRIORITY_NOTE,
			"Use only context.constraints.layerCandidates and their layout ids. Do not invent unavailable layout ids.",
			"Use context.constraints.sourceReferenceCatalog to keep selected target refs aligned with SourceSpec source ids.",
			'Return one JSON object only with: schemaVersion "pattern-selection.v0.1", selectedCandidates, confidence, and reason.',
			"Select screen, region, area, and component candidates when they help the later table-shaped generation result.",
			"Each selected candidate must preserve its id, level, targetRef, and layout.",
			"Use upstream screenIntent and compositionPlan as guidance when present.",
			"Use context.upstream.decorationPlan role and layoutIntent as deterministic area-level guidance when present.",
			"Use context.guidance.designContextBundleRefs as design guidance when present.",
			"Use context.guidance.designSkillSelection.selectedSkill to keep selected patterns aligned with the composition skill when present.",
		].join("\n"),
		context: {
			constraints: {
				layerCandidates: input.layerCandidates,
				sourceSpec: input.sourceSpec,
				sourceReferenceCatalog: buildSourceReferenceCatalog(input.sourceSpec),
			},
			upstream: {
				compositionPlan: input.compositionPlan,
				decorationPlan: input.decorationPlan,
				screenIntent: input.screenIntent,
			},
			guidance: {
				designContextBundleRefs: input.designContextBundleRefs,
				designSkillSelection: input.designSkillSelection,
				sourceSummary,
			},
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
		designSkillSelection?: DesignSkillSelectionContract;
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
			CONTEXT_PRIORITY_NOTE,
			"Use only the structured SourceSpec context as the source of truth.",
			"Use context.upstream.screenIntent and context.upstream.compositionPlan as upstream design guidance when present.",
			"Use context.upstream.decorationPlan as deterministic display-structure guidance when present.",
			"Area metadata.title and props.name are structural metadata only, not visible copy. If a section heading should be visible, render it with an explicit heading component such as TitleSection using context.upstream.decorationPlan.areas[].displayTitle.",
			"Do not duplicate the same section heading through both area metadata/name and a TitleSection component.",
			"When context.upstream.decorationPlan splits one source area into multiple decorated areas, materialize the split areas in RenderTree and tableGenerationResult.",
			"When context.upstream.decorationPlan.areas[].repeatedItems exists, use its propsHint values before falling back to placeholder source props.",
			"ListText with props.table dot must include props.subText for visible row copy.",
			"When SourceSpec includes errorPolicy, required agreement, disabled, loading, or validation evidence, include bounded display.stateRole coverage in RenderTree.",
			"State-variant nodes that share one slot (especially Bottom CTAs) MUST be mutually exclusive via display.when, or be expressed as a single node. Never place two ungated primary CTAs in Screen.Bottom; the renderer shows every node without a falsy display.when.",
			"Every CompositionPlan section should be visible in tableGenerationResult through matching region, area, component, metadata, or provenance identifiers.",
			"Preserve high-priority source refs from context.upstream.compositionPlan.sections[].sourceRefs whenever possible.",
			"Use context.upstream.patternSelection as layout-pattern guidance when present.",
			"Use context.guidance.designContextBundleRefs as design guidance when present.",
			"Use context.guidance.designContextBundles[].body as the design rules to apply (divider/spacing/hierarchy/state coverage).",
			"Use context.guidance.designSkillSelection.selectedSkill as the selected composition skill. Respect its qualityGates and requiredDesignDocs while generating RenderTree structure.",
			"Pattern-store exploration is mandatory: use context.constraints.layerCandidates as the explored screen, region, area, and component layout ids; do not invent layout ids.",
			"Preserve the SourceSpec screen skeleton: Screen > Screen.Header/Screen.Contents/Screen.Bottom > area.static or area.dynamic > optional PageStack/layout wrapper > components.",
			"Never output a render node with type Area. Use SourceSpec area.renderNodeType, area.static, or area.dynamic for area wrapper nodes.",
			'Use the final RenderTree handoff shape as the primary result contract: top-level version, minRendererVersion "0.1.0", metadata, theme {"mode":"light"}, and children containing a Screen root.',
			"Screen region containers may omit props. When region props are present, keep them valid and renderer-oriented.",
			"Use PageStack or layout wrappers when the selected region/area pattern describes section grouping, list rails, or divider-separated sections.",
			'Render separation through the area stack node props.divider, not standalone Divider leaf nodes. Use only props.divider: "contents" | "section" | "none".',
			'Use props.divider: "contents" only for 1px dividers BETWEEN repeated row children inside a list/checkbox/field stack. It must not create a trailing divider after the last row.',
			'Use props.divider: "section" only for a trailing 4px area break after the leading area, between two Screen.Contents areas. Omit it on the last area and when cards/groups already separate sections. Use props.divider: "none" or omit the prop when no divider is needed.',
			"Apply visual hierarchy through component choice and props within the catalog (section titles vs rows, emphasis via component props). Do not invent colors, gradients, or icons for emphasis.",
			"For a field-side action button (verify/request/resend/use-all), set TextField props.button: true and props.buttonLabel. Never write TextField props.rightElement (renderer-owned slot); a render-node object there is invalid and is dropped.",
			"Use context.constraints.sourceReferenceCatalog.allowedRefs as the only valid source ref vocabulary.",
			"Use context.constraints.sourceReferenceCatalog.entries[].props, description, and raw notes as source text evidence for visible labels and descriptions.",
			"Use context.constraints.componentContractCatalog when choosing component props and composite layout candidates. Do not invent component props or layout ids outside that context.",
			"context.constraints.componentContractCatalog.available lists other catalog components you MAY use beyond the source refs, each with a status. Prefer entries (source-relevant); reach into available when a better-fitting component exists (e.g., multi-option single-select → RadioGroup with props.options). status:candidate components are unstable and will be flagged, so use them only with clear source evidence.",
			"Respect sourceShape.screen.regions: each region contains area nodes, and each area contains component nodes.",
			"Map header, contents, and bottom regions to Screen.Header, Screen.Contents, and Screen.Bottom.",
			`Also produce tableGenerationResult using schemaVersion: ${SCHEMA_VERSION.tableGenerationResult}.`,
			"tableGenerationResult must follow context.constraints.intermediateArtifact.jsonSchema and use layout ids shaped as layout.<target>.<PatternName>.",
			"Every tableGenerationResult screen, region, area, and component record must include a real layout id from selected candidates.",
			`Use RenderTree contract version: ${SCHEMA_VERSION.renderTree}.`,
			"Return one JSON object only with tableGenerationResult and renderTree.",
			"renderTree must match context.constraints.targetArtifact.jsonSchema.",
			"Use top-level version, metadata, and children. Do not use contractVersion, schemaVersion, root, tree, nodeId, or componentId.",
			"Top-level metadata must not include title. Every render node metadata must include id and title.",
			"RenderTree nodes use node.layout for layout pattern components.",
			"Put component-specific values inside node.props.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
			`Components: ${componentIds || "none"}`,
		].join("\n"),
		context: {
			constraints: {
				componentContractCatalog: options.componentContractCatalog,
				intermediateArtifact: {
					jsonSchema: getJsonSchema("table-generation-result"),
					kind: "table-generation-result",
					schemaVersion: SCHEMA_VERSION.tableGenerationResult,
				},
				layerCandidates: options.layerCandidates ?? [],
				sourceSpec,
				sourceReferenceCatalog: buildSourceReferenceCatalog(sourceSpec),
				targetArtifact: {
					jsonSchema: getJsonSchema("render-tree"),
					kind: "render-tree",
					schemaVersion: SCHEMA_VERSION.renderTree,
				},
			},
			upstream: {
				compositionPlan: options.compositionPlan,
				decorationPlan: options.decorationPlan,
				patternSelection: options.patternSelection,
				screenIntent: options.screenIntent,
			},
			guidance: {
				designContextBundleRefs: options.designContextBundleRefs,
				designContextBundles: options.designContextBundles,
				designSkillSelection: options.designSkillSelection,
				sourceSummary,
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
	designSkillSelection?: DesignSkillSelectionContract;
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
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
	});

	return {
		query: [
			"Revise the previous RenderTree candidate so it satisfies the validation report.",
			"Use the provided SourceSpec as the source of truth and preserve the intended screen.",
			"Preserve context.upstream.patternSelection and context.constraints.layerCandidates guidance when revising layout structure.",
			"Preserve context.upstream.screenIntent and context.upstream.compositionPlan guidance when revising generated artifacts.",
			"Preserve context.upstream.decorationPlan split areas, display titles, roles, layout intents, and repeated item props hints.",
			"Preserve the SourceSpec screen skeleton during revision: keep area.static/area.dynamic wrapper nodes instead of flattening regions directly to leaf components.",
			"Do not replace invalid Area nodes by removing the wrapper. Replace them with area.static or area.dynamic and keep their children.",
			"Pattern-store exploration remains mandatory during revision: use context.constraints.layerCandidates and context.upstream.patternSelection as the allowed pattern evidence.",
			"Fix invented source refs by replacing them with refs from context.constraints.sourceReferenceCatalog.allowedRefs.",
			"Fix invented component props or layout ids by using context.constraints.componentContractCatalog.",
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
			"When context.upstream.qualityInspection is present, also fix bounded P0 quality findings without rewriting unrelated valid structure.",
			"When context.guidance.designSkillSelection is present, keep the selected skill gates satisfied during revision.",
		].join("\n"),
		context: {
			constraints: generationInput.context.constraints,
			upstream: {
				...generationInput.context.upstream,
				previousCandidate: input.previousCandidate,
				qualityInspection: input.qualityInspection,
				validationReport: input.validationReport,
			},
			guidance: generationInput.context.guidance,
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
	designSkillSelection?: DesignSkillSelectionContract;
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
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
	});

	return {
		query: [
			"Review the generated screen candidate for design quality after schema and semantic validation.",
			"Use SourceSpec, screenIntent, compositionPlan, patternSelection, and validationReport as bounded evidence.",
			"Check source fidelity, composition alignment, visual hierarchy, action clarity, and obvious accessibility risks.",
			"Use context.guidance.designContextBundles[].body (quality-review gates) as the rule set for review.",
			"Use context.guidance.designSkillSelection.selectedSkill.qualityGates as additional bounded gates for findings when present.",
			"Score the candidate 0-5 on six design dimensions and return them in scores: hierarchy, separation, fidelity, actionClarity, densityFit, patternFit.",
			"Emit a finding with severity for any violated rule, for example missing dividers between sections or overused dividers inside cards.",
			"Set findings[].layer to understand, compose, or revise so the smoke UI can identify whether the issue came from intent, design composition, or final validation/revision.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.qualityInspection}.`,
			"Return bounded findings only. Do not mutate files, approve artifacts, or invent schema fields.",
			"Use findings with code, severity, message, optional layer, optional path, and optional suggestion.",
		].join("\n"),
		context: {
			constraints: generationInput.context.constraints,
			upstream: {
				...generationInput.context.upstream,
				candidate: input.candidate,
				validationReport: input.validationReport,
			},
			guidance: generationInput.context.guidance,
		},
	};
}

/**
 * Builds the non-binding component-proposal input.
 * The task proposes components or variants outside the catalog with source evidence and a nearest
 * catalog match. It never confirms or applies anything; promotion happens via catalog mutation only.
 */
export function buildComponentProposalAgentInput(input: {
	candidate?: unknown;
	componentContractCatalog?: ComponentContractCatalog;
	compositionPlan?: unknown;
	decorationPlan?: DecorationPlanContract;
	designContextBundleRefs?: DesignContextBundleRef[];
	designContextBundles?: DesignContextBundleContent[];
	designSkillSelection?: DesignSkillSelectionContract;
	layerCandidates?: PatternLayerCandidate[];
	patternSelection?: unknown;
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): ComponentProposalAgentInput {
	const generationInput = buildScreenGenerationAgentInput(input.sourceSpec, {
		componentContractCatalog: input.componentContractCatalog,
		compositionPlan: input.compositionPlan,
		decorationPlan: input.decorationPlan,
		designContextBundleRefs: input.designContextBundleRefs,
		designContextBundles: input.designContextBundles,
		designSkillSelection: input.designSkillSelection,
		layerCandidates: input.layerCandidates,
		patternSelection: input.patternSelection,
		screenIntent: input.screenIntent,
	});

	return {
		query: [
			"Propose components or variants that are NOT in the catalog but would improve this screen.",
			"Each proposal must include id (string), proposedComponentType (string: the name of the proposed new component/variant), sourceEvidence (array of ref strings from context.constraints.sourceReferenceCatalog.allowedRefs), nearestCatalogMatch (a single string equal to one componentType from context.constraints.componentContractCatalog), rationale (string), and optional suggestedProps (object).",
			"Use context.guidance.designContextBundles[].body as bounded design guidance for what would improve the screen.",
			"Return at most 5 proposals. Do not confirm or apply anything; this is a non-binding proposal artifact.",
			`Return one JSON object only using schemaVersion: ${SCHEMA_VERSION.componentProposal}.`,
		].join("\n"),
		context: {
			constraints: generationInput.context.constraints,
			upstream: {
				...generationInput.context.upstream,
				candidate: input.candidate,
			},
			guidance: generationInput.context.guidance,
		},
	};
}
