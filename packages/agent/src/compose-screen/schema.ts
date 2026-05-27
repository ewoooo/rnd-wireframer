import { z } from "zod";

/**
 * Schema B (CompositionOutput) Zod 미러.
 *
 * 동일 타입을 `@cx/types/composition-output.ts` 에 TypeScript interface로 정의해두었고,
 * 여기서는 LLM structured output 검증 + JSON schema 생성을 위해 Zod로 재정의한다.
 * TS 타입과의 일치는 사람의 책임이지만 (재정의 비용), z.infer 결과를 `CompositionOutput`에 만족하는지
 * 타입 어서션으로 확인하면 drift를 빨리 잡을 수 있다.
 */

const CompositionMode = z.enum([
	"reuse-primitive",
	"reuse-pattern",
	"propose-pattern",
	"report-gap",
]);

const ScreenStrategy = z.enum([
	"task-flow",
	"comparison",
	"decision-summary",
	"error-recovery",
	"form-entry",
	"detail-reading",
	"confirmation",
	"support",
]);

const ScreenArchetype = z.enum([
	"commerce-detail",
	"form-entry",
	"agreement-flow",
	"confirmation",
	"list-browse",
	"support",
	"generic-detail",
]);

const ArchetypeBlockId = z.enum([
	"navigation",
	"hero-summary",
	"hero-media",
	"primary-facts",
	"price-summary",
	"price-accordion",
	"benefit-list",
	"option-selection",
	"option-list",
	"option-grid",
	"delivery-info",
	"rich-image-tab",
	"product-more-link",
	"coupon-benefit",
	"map-store-list",
	"brand-benefit-list",
	"product-disclosure",
	"bottom-cta",
	"supporting-info",
	"disclosure",
	"disclosure-list",
	"primary-action",
	"sticky-cta",
	"terms-list",
	"agreement-control",
	"form-fields",
	"validation-feedback",
	"result-state",
	"next-action",
	"list-results",
	"card-list",
	"product-list",
	"product-list-group",
	"product-list-horizontal",
	"product-list-row",
	"filter-sort",
	"summary-card",
	"filter-chip",
	"text-list",
	"info-text-list",
	"notice-list",
	"accordion-list",
	"search-filter",
	"tab-filter",
	"support-action",
	"section-header",
	"divider",
	"footer-legal",
]);

const AreaRole = z.enum([
	"navigation",
	"hero",
	"summary",
	"form",
	"list",
	"guide",
	"error",
	"empty",
	"confirmation",
	"action",
	"supporting",
]);

const AreaVisualIntent = z.enum([
	"primary",
	"secondary",
	"supporting",
	"warning",
	"confirmation",
	"cta-support",
]);

const CompositionAction = z.enum([
	"preserve-source-area",
	"merge-source-areas",
	"split-source-area",
	"synthesize-supporting-area",
]);

const DecisionEmphasis = z.enum(["high", "medium", "low"]);
const DraftConfidence = z.enum(["high", "medium", "low"]);

const DesignDocumentId = z.enum([
	"COMPOSITION_LAYERS.md",
	"DESIGN_FOUNDATION.md",
	"LAYOUT_SPACING_CONTRACT.md",
	"SECTION_PATTERNS.md",
	"SCREEN_PATTERN_SUMMARY.md",
	"COMPONENT_INVENTORY.md",
	"INTERACTION_PATTERNS.md",
	"VISUAL_FOUNDATION_OBSERVATIONS.md",
]);

const DesignReference = z.object({
	document: DesignDocumentId,
	section: z.string().optional(),
	reason: z.string(),
});

const LayoutPatternDraft = z.object({
	layoutPatternId: z.string(),
	variant: z.string().optional(),
	reasons: z.array(z.string()),
	confidence: DraftConfidence,
});

const CompositionSourceRef = z.object({
	screenId: z.string(),
	areaId: z.string().optional(),
	areaNo: z.number().optional(),
	componentRow: z.number().optional(),
	componentEntryId: z.string().optional(),
	semanticName: z.string().optional(),
	rawComponentId: z.string().optional(),
	reason: z.string(),
});

const PrddBindingOrigin = z.enum(["api", "policy", "static", "state"]);

const PrddBinding = z.object({
	origin: PrddBindingOrigin,
	ref: z.string(),
	description: z.string(),
});

const EventHook = z.object({
	trigger: z.string(),
	action: z.string(),
	target: z.string().optional(),
	params: z.record(z.string(), z.unknown()).optional(),
});

const CompositionSelection = z.discriminatedUnion("mode", [
	z.object({
		mode: z.literal("reuse-primitive"),
		primitiveId: z.string(),
		variant: z.string().optional(),
	}),
	z.object({
		mode: z.literal("reuse-pattern"),
		componentPatternId: z.string(),
		variant: z.string().optional(),
	}),
	z.object({
		mode: z.literal("propose-pattern"),
		proposedComponentPatternId: z.string(),
		variant: z.string().optional(),
	}),
	z.object({
		mode: z.literal("report-gap"),
		gapReportId: z.string(),
	}),
]);

const CompositionDecision = z.object({
	id: z.string(),
	mode: CompositionMode,
	sourceRef: z.object({
		screenId: z.string(),
		areaId: z.string(),
		componentRow: z.number().optional(),
		componentEntryId: z.string().optional(),
		semanticName: z.string().optional(),
		rawComponentId: z.string().optional(),
	}),
	sourceRefs: z.array(CompositionSourceRef),
	target: z.object({
		areaId: z.string(),
		order: z.number(),
		slot: z.string().optional(),
	}),
	intent: z.string(),
	rationale: z.string(),
	emphasis: DecisionEmphasis,
	policyRefs: z.array(z.string()),
	stateRefs: z.array(z.string()),
	selection: CompositionSelection,
	props: z.record(z.string(), z.unknown()),
	bindings: z.array(PrddBinding),
	hooks: z.array(EventHook),
	display: z
		.object({
			visibleWhen: z.string().optional(),
			emptyWhen: z.string().optional(),
			errorWhen: z.string().optional(),
		})
		.optional(),
	layoutPatternDraft: LayoutPatternDraft.optional(),
	designRefs: z.array(DesignReference).optional(),
});

const CompositionArea = z.object({
	areaId: z.string(),
	sourceAreaRef: z.string(),
	sourceRefs: z.array(CompositionSourceRef),
	compositionAction: CompositionAction,
	slot: z.enum(["header", "contents", "bottom"]),
	role: AreaRole,
	intent: z.string(),
	displayName: z.string().optional(),
	visualIntent: AreaVisualIntent,
	order: z.number(),
	decisionIds: z.array(z.string()),
	synthetic: z
		.object({
			reason: z.string(),
			basedOnSourceRefs: z.array(CompositionSourceRef),
		})
		.optional(),
	layoutPatternDraft: LayoutPatternDraft,
	designRefs: z.array(DesignReference),
});

const NonEmptyString = z.string().min(1);

const ProposedArchetypeScaffold = z.object({
	archetype: NonEmptyString,
	strategy: ScreenStrategy,
	requiredBlocks: z.array(ArchetypeBlockId),
	optionalBlocks: z.array(ArchetypeBlockId),
	allowedSyntheticBlocks: z.array(ArchetypeBlockId),
	rationale: NonEmptyString,
});

const ArchetypeChoice = z
	.object({
		source: z.enum(["catalog", "proposed"]),
		archetype: NonEmptyString,
		rationale: NonEmptyString,
		proposedScaffold: ProposedArchetypeScaffold.optional(),
	})
	.refine((value) => value.source !== "proposed" || value.proposedScaffold !== undefined, {
		message: "archetypeChoice.proposedScaffold is required when source=proposed",
		path: ["proposedScaffold"],
	});

const CompositionScreen = z.object({
	screenId: z.string(),
	intent: z.string(),
	primaryUserGoal: z.string(),
	strategy: ScreenStrategy,
	archetype: z.union([ScreenArchetype, NonEmptyString]),
	archetypeChoice: ArchetypeChoice,
	completeness: z.object({
		requiredBlocks: z.array(ArchetypeBlockId),
		presentBlocks: z.array(ArchetypeBlockId),
		syntheticBlocks: z.array(ArchetypeBlockId),
		missingBlocks: z.array(ArchetypeBlockId),
		omittedBlocks: z.array(
			z.object({
				blockId: ArchetypeBlockId,
				reason: z.string(),
			}),
		),
	}),
	stateRefs: z.array(z.string()),
	flowRefs: z.array(z.string()),
	policyRefs: z.array(z.string()),
	designRefs: z.array(DesignReference),
	layoutPatternDraft: LayoutPatternDraft,
});

const ComponentPatternStatus = z.enum(["registered", "proposed"]);

const ComponentPatternNode: z.ZodType<unknown> = z.lazy(() =>
	z.object({
		kind: z.enum(["primitive", "componentPattern", "slot"]),
		ref: z.string().optional(),
		slotName: z.string().optional(),
		props: z.record(z.string(), z.unknown()).optional(),
		children: z.array(ComponentPatternNode).optional(),
	}),
);

const ComponentPropContract = z
	.object({
		type: z.enum(["array", "boolean", "enum", "node", "number", "string"]),
		role: z.string().optional(),
		required: z.boolean().optional(),
		values: z.array(z.string()).optional(),
		defaultValue: z.unknown().optional(),
		description: z.string().optional(),
		aiWritable: z.boolean().optional(),
		tokenRole: z.string().optional(),
	})
	.passthrough();

const ComponentPattern = z.object({
	id: z.string(),
	name: z.string(),
	status: ComponentPatternStatus,
	version: z.string(),
	intent: z.string(),
	rationale: z.string(),
	props: z.array(
		z.object({
			name: z.string(),
			contract: ComponentPropContract,
			required: z.boolean(),
			description: z.string(),
		}),
	),
	slots: z.array(
		z.object({
			name: z.string(),
			accepts: z.enum(["primitive", "componentPattern", "any"]),
			cardinality: z.enum(["one", "many"]),
			description: z.string(),
		}),
	),
	variants: z.array(
		z.object({
			name: z.string(),
			variantTokens: z.record(z.string(), z.string()),
			description: z.string(),
		}),
	),
	composition: ComponentPatternNode,
	tokensUsed: z.array(
		z.object({
			path: z.string(),
			role: z.string(),
			tokenRef: z.string(),
		}),
	),
	proposedBy: z
		.object({
			by: z.literal("llm"),
			model: z.string(),
			screen: z.string(),
			timestamp: z.string(),
		})
		.optional(),
	promotedFrom: z.string().optional(),
	usedInScreens: z.array(z.string()).optional(),
});

const GapReport = z.object({
	id: z.string(),
	kind: z.literal("gap-report"),
	status: z.enum(["open", "in-progress", "resolved", "rejected"]),
	detectedIn: z.object({
		screen: z.string(),
		areaId: z.string(),
		componentRow: z.number(),
	}),
	prddEvidence: z.object({
		intent: z.string(),
		displayText: z.string(),
		bindings: z.array(PrddBinding),
		policyCitations: z.array(z.string()),
	}),
	consideredPrimitives: z.array(z.object({ primitiveId: z.string(), rejectReason: z.string() })),
	consideredComponentPatterns: z.array(
		z.object({ componentPatternId: z.string(), rejectReason: z.string() }),
	),
	suggestedPrimitive: z.object({
		name: z.string(),
		description: z.string(),
		props: z.array(
			z.object({
				name: z.string(),
				contractHint: z.string(),
				required: z.boolean(),
			}),
		),
		variantsHint: z.array(z.string()),
		tokensUsedHint: z.array(z.string()),
	}),
	resolution: z
		.object({
			resolvedBy: z.string(),
			resolvedAt: z.string(),
			primitiveId: z.string(),
			notes: z.string(),
		})
		.optional(),
});

export const CompositionOutputSchema = z.object({
	kind: z.literal("composition-output"),
	schemaVersion: z.string(),
	source: z.object({
		screenId: z.string(),
		registeredSchemaVersion: z.string(),
		catalogDeckVersion: z.string(),
		designDeckVersion: z.string(),
		layoutPatternStoreDeckVersion: z.string(),
	}),
	screen: CompositionScreen,
	areas: z.array(CompositionArea),
	decisions: z.array(CompositionDecision),
	proposedComponentPatterns: z.array(ComponentPattern),
	gapReports: z.array(GapReport),
	warnings: z.array(
		z.object({
			sourceRef: z
				.object({
					screenId: z.string(),
					areaId: z.string(),
					componentRow: z.number().optional(),
					componentEntryId: z.string().optional(),
					semanticName: z.string().optional(),
					rawComponentId: z.string().optional(),
				})
				.optional(),
			message: z.string(),
		}),
	),
});

export type CompositionOutputZ = z.infer<typeof CompositionOutputSchema>;

/** Claude Agent SDK structured output에 넘길 JSON Schema. */
export function compositionOutputJsonSchema(): Record<string, unknown> {
	return z.toJSONSchema(CompositionOutputSchema) as Record<string, unknown>;
}
