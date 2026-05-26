import { z } from "zod";
import {
	DESIGN_REFERENCE_PATHS,
	DESIGN_REVIEW_STAGE,
	REGION_SLOTS,
} from "./design-review-contracts";

const designReferencePathSchema = z.enum(DESIGN_REFERENCE_PATHS);

const designReferenceSchema = z.object({
	path: designReferencePathSchema,
	section: z.string().min(1).optional(),
	rationale: z.string().min(1),
});

const operationBaseSchema = z.object({
	id: z.string().min(1),
	priority: z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
	confidence: z.number().min(0).max(1).optional(),
	rationale: z.string().min(1),
	designReferences: z.array(designReferenceSchema).min(1),
});

const patternRefSchema = z.object({
	id: z.string().min(1),
	variant: z.string().min(1).default("default"),
});

const regionSlotSchema = z.enum(REGION_SLOTS);

const componentLocationSchema = z
	.object({
		areaId: z.string().min(1).optional(),
		componentId: z.string().min(1).optional(),
		compositeId: z.string().min(1).optional(),
		screenId: z.string().min(1).optional(),
		screenRegion: regionSlotSchema.optional(),
	})
	.refine(
		(value) =>
			Boolean(value.areaId || value.componentId || value.compositeId || value.screenRegion),
		"location must include areaId, componentId, compositeId, or screenRegion",
	);

const componentDestinationSchema = componentLocationSchema.extend({
	order: z.number().int().min(0).optional(),
	placement: z.enum(["first", "last", "before", "after", "replace"]).default("last"),
	relativeToComponentId: z.string().min(1).optional(),
});

const propValueSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(propValueSchema),
		z.record(z.string(), propValueSchema),
		z.object({
			bind: z.string().min(1),
			default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
		}),
	]),
);

const displaySchema = z.object({
	when: z
		.union([
			z.boolean(),
			z.object({
				bind: z.string().min(1),
				default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
			}),
		])
		.optional(),
	stateRole: z
		.enum(["base", "loading", "empty", "error", "success", "disabled", "expanded"])
		.optional(),
});

const componentDraftSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	type: z.string().min(1),
	description: z.string().min(1).optional(),
	props: z.record(z.string(), propValueSchema).default({}),
	hooks: z
		.array(
			z.object({
				trigger: z.string().min(1),
				action: z.string().min(1),
				target: z.string().min(1).optional(),
				params: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.default([]),
	pattern: patternRefSchema.optional(),
});

const patternTargetSchema = z.enum(["screen", "region", "area", "composite"]);

const setMatcherSchema = z
	.object({
		anyOf: z.array(z.string()).optional(),
		allOf: z.array(z.string()).optional(),
		noneOf: z.array(z.string()).optional(),
	})
	.optional();

const patternResolutionSchema = z
	.object({
		areaPatterns: setMatcherSchema,
		compositePatterns: setMatcherSchema,
		componentTypes: setMatcherSchema,
		nameKeywords: z.array(z.string()).optional(),
		idPatterns: z.array(z.string()).optional(),
		priority: z.number().optional(),
	})
	.optional();

const patternVariantSchema = z.object({
	childOrder: z.literal("explicit").optional(),
	direction: z.enum(["horizontal", "vertical"]).optional(),
	gap: z.number().optional(),
	paddingX: z.number().optional(),
	paddingY: z.number().optional(),
	layoutProps: z.record(z.string(), propValueSchema).optional(),
	childWrap: z
		.object({
			kind: z.literal("page-stack"),
			appliesTo: z.array(z.enum(["component", "area"])).optional(),
			divider: z.object({ type: z.enum(["contents", "section"]) }).optional(),
			itemPaddingX: z.number().optional(),
			paddingY: z.number().optional(),
			sectionPaddingX: z.number().optional(),
		})
		.optional(),
});

const patternDraftSchema = z
	.object({
		id: z.string().min(1),
		target: patternTargetSchema,
		name: z.string().min(1),
		description: z.string().min(1),
		defaultVariant: z.string().min(1).default("default"),
		variants: z.record(z.string(), patternVariantSchema),
		resolution: patternResolutionSchema,
	})
	.superRefine((value, ctx) => {
		if (value.variants[value.defaultVariant] !== undefined) return;
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `defaultVariant '${value.defaultVariant}' must exist in variants`,
			path: ["defaultVariant"],
		});
	});

export const moveComponentOperationSchema = operationBaseSchema.extend({
	operation: z.literal("moveComponent"),
	componentId: z.string().min(1),
	from: componentLocationSchema,
	to: componentDestinationSchema,
});

export const updatePatternOperationSchema = operationBaseSchema.extend({
	operation: z.literal("updatePattern"),
	target: z.object({
		level: z.enum(["screen", "region", "area", "component", "composite"]),
		id: z.string().min(1),
		screenId: z.string().min(1).optional(),
		screenRegion: regionSlotSchema.optional(),
	}),
	pattern: patternRefSchema,
});

export const createNewPatternOperationSchema = operationBaseSchema.extend({
	operation: z.literal("createNewPattern"),
	pattern: patternDraftSchema,
	applyTo: z
		.array(
			z.object({
				level: z.enum(["screen", "region", "area", "component", "composite"]),
				id: z.string().min(1),
				variant: z.string().min(1).optional(),
			}),
		)
		.default([]),
});

export const createComponentOperationSchema = operationBaseSchema.extend({
	operation: z.literal("createComponent"),
	component: componentDraftSchema,
	insertInto: componentDestinationSchema,
	source: z.enum(["placeholder", "tree-context", "design-pattern"]).default("tree-context"),
});

export const createCompositeOperationSchema = operationBaseSchema.extend({
	operation: z.literal("createComposite"),
	composite: z.object({
		id: z.string().min(1),
		name: z.string().min(1),
		description: z.string().min(1).optional(),
		componentIds: z.array(z.string().min(1)).min(2),
		pattern: patternRefSchema,
	}),
	replace: z
		.object({
			areaId: z.string().min(1).optional(),
			componentIds: z.array(z.string().min(1)).min(1),
		})
		.optional(),
});

export const setDisplayOperationSchema = operationBaseSchema.extend({
	operation: z.literal("setDisplay"),
	componentId: z.string().min(1),
	display: displaySchema,
});

export const updateComponentPropsOperationSchema = operationBaseSchema.extend({
	operation: z.literal("updateComponentProps"),
	componentId: z.string().min(1),
	props: z.record(z.string(), propValueSchema),
	mode: z.enum(["merge", "replace"]).default("merge"),
});

export const designReviewOperationSchema = z.discriminatedUnion("operation", [
	moveComponentOperationSchema,
	updatePatternOperationSchema,
	createNewPatternOperationSchema,
	createComponentOperationSchema,
	createCompositeOperationSchema,
	setDisplayOperationSchema,
	updateComponentPropsOperationSchema,
]);

export const designReviewSchema = z.object({
	version: z.literal(DESIGN_REVIEW_STAGE.version).default(DESIGN_REVIEW_STAGE.version),
	reviewer: z.string().min(1).default(DESIGN_REVIEW_STAGE.defaultReviewer),
	scope: z.object({
		treeStage: z
			.enum(["composed", "decorated", "materialized"])
			.default(DESIGN_REVIEW_STAGE.defaultTreeStage),
		screenIds: z.array(z.string().min(1)).default([]),
	}),
	findings: z
		.array(
			z.object({
				id: z.string().min(1),
				severity: z.enum(["error", "warning", "suggestion"]).default("suggestion"),
				title: z.string().min(1),
				description: z.string().min(1),
				affectedNodeIds: z.array(z.string().min(1)).default([]),
				designReferences: z.array(designReferenceSchema).min(1),
			}),
		)
		.default([]),
	operations: z.array(designReviewOperationSchema).default([]),
	warnings: z.array(z.string()).default([]),
});

export type DesignReferencePath = (typeof DESIGN_REFERENCE_PATHS)[number];
export type DesignReference = z.infer<typeof designReferenceSchema>;
export type DesignReviewOperation = z.infer<typeof designReviewOperationSchema>;
export type DesignReview = z.infer<typeof designReviewSchema>;

export function parseDesignReview(value: unknown): DesignReview {
	return designReviewSchema.parse(value);
}
