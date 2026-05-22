import { z } from "zod";

export interface PatternPropBinding {
	bind: string;
	default?: string | number | boolean | null;
}

export type PatternPropValue =
	| string
	| number
	| boolean
	| null
	| PatternPropValue[]
	| { [key: string]: PatternPropValue }
	| PatternPropBinding;

const propValueSchema: z.ZodType<PatternPropValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(propValueSchema),
		z.record(z.string(), propValueSchema),
		z.object({
			bind: z.string(),
			default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
		}),
	]),
);

const propsSchema: z.ZodType<Record<string, PatternPropValue>> = z.record(
	z.string(),
	propValueSchema,
);

const pageStackSchema = z.object({
	enabled: z.boolean(),
	divider: z.object({ type: z.enum(["contents", "section"]) }).optional(),
	itemPaddingX: z.number().optional(),
	paddingY: z.number().optional(),
	sectionPaddingX: z.number().optional(),
});

const screenRegionSchema = z.object({
	pageStack: pageStackSchema.optional(),
	props: propsSchema.optional(),
});

const screenVariantSchema = z.object({
	regions: z
		.object({
			header: screenRegionSchema.optional(),
			contents: screenRegionSchema.optional(),
			bottom: screenRegionSchema.optional(),
		})
		.optional(),
});

const organismVariantSchema = z.object({
	compositeOrder: z.literal("explicit").optional(),
	props: propsSchema.optional(),
});

const compositeVariantSchema = z.object({
	type: z.string().optional(),
	props: propsSchema.optional(),
});

const setMatcherSchema = z
	.object({
		anyOf: z.array(z.string()).optional(),
		allOf: z.array(z.string()).optional(),
		noneOf: z.array(z.string()).optional(),
	})
	.optional();

const resolutionSchema = z
	.object({
		organismPatterns: setMatcherSchema,
		compositePatterns: setMatcherSchema,
		compositeTypes: setMatcherSchema,
		nameKeywords: z.array(z.string()).optional(),
		idPatterns: z.array(z.string()).optional(),
		priority: z.number().optional(),
	})
	.optional();

const guidanceSchema = z
	.object({
		keywords: z.array(z.string()).optional(),
		rules: z.array(z.string()).optional(),
	})
	.optional();

const examplesSchema = z.array(z.record(z.string(), z.unknown())).optional();

const chromeSlotSchema = z.object({
	compositePattern: z.string().min(1),
});

const chromeSchema = z
	.object({
		header: z.array(chromeSlotSchema).optional(),
		bottom: z.array(chromeSlotSchema).optional(),
	})
	.optional();

const screenExpectsSchema = z
	.object({
		contents: z
			.object({
				organismPatterns: z.array(z.string()).optional(),
			})
			.optional(),
	})
	.optional();

const organismExpectsSchema = z
	.object({
		composites: z
			.object({
				compositePatterns: z.array(z.string()).optional(),
				types: z.array(z.string()).optional(),
			})
			.optional(),
	})
	.optional();

const baseFields = {
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	defaultVariant: z.string().min(1),
	resolution: resolutionSchema,
	guidance: guidanceSchema,
	examples: examplesSchema,
};

function refineDefaultVariant<T extends { defaultVariant: string; variants: Record<string, unknown> }>(
	value: T,
	ctx: z.RefinementCtx,
) {
	if (value.variants[value.defaultVariant] === undefined) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `defaultVariant '${value.defaultVariant}' must exist in variants`,
			path: ["defaultVariant"],
		});
	}
}

export const screenPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("screen"),
		variants: z.record(z.string(), screenVariantSchema),
		chrome: chromeSchema,
		expects: screenExpectsSchema,
	})
	.superRefine(refineDefaultVariant);

export const organismPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("organism"),
		variants: z.record(z.string(), organismVariantSchema),
		expects: organismExpectsSchema,
	})
	.superRefine(refineDefaultVariant);

export const compositePatternSchema = z
	.object({
		...baseFields,
		target: z.literal("composite"),
		variants: z.record(z.string(), compositeVariantSchema),
	})
	.superRefine(refineDefaultVariant);

export const patternSchema = z.discriminatedUnion("target", [
	screenPatternSchema,
	organismPatternSchema,
	compositePatternSchema,
]);

export const patternStoreSchema = z.object({
	patterns: z.array(patternSchema),
});

export type Pattern = z.infer<typeof patternSchema>;
export type ScreenPattern = z.infer<typeof screenPatternSchema>;
export type OrganismPattern = z.infer<typeof organismPatternSchema>;
export type CompositePattern = z.infer<typeof compositePatternSchema>;
export type ScreenVariant = z.infer<typeof screenVariantSchema>;
export type OrganismVariant = z.infer<typeof organismVariantSchema>;
export type CompositeVariant = z.infer<typeof compositeVariantSchema>;
export type ScreenRegion = z.infer<typeof screenRegionSchema>;
export type PageStackPattern = z.infer<typeof pageStackSchema>;
export type PatternResolutionSignals = z.infer<typeof resolutionSchema>;
export type PatternChromeSlot = z.infer<typeof chromeSlotSchema>;
