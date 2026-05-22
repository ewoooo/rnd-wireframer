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

const childWrapSchema = z
	.object({
		kind: z.literal("page-stack"),
		appliesTo: z.array(z.enum(["composite", "area"])).optional(),
		divider: z.object({ type: z.enum(["contents", "section"]) }).optional(),
		itemPaddingX: z.number().optional(),
		paddingY: z.number().optional(),
		sectionPaddingX: z.number().optional(),
	})
	.optional();

const childrenLayoutSchema = z.object({
	childOrder: z.literal("explicit").optional(),
	childWrap: childWrapSchema,
	direction: z.enum(["horizontal", "vertical"]).optional(),
	gap: z.number().optional(),
	paddingX: z.number().optional(),
	paddingY: z.number().optional(),
	props: propsSchema.optional(),
});

const regionVariantSchema = childrenLayoutSchema;
const areaVariantSchema = childrenLayoutSchema;
const compositeVariantSchema = childrenLayoutSchema;

const setMatcherSchema = z
	.object({
		anyOf: z.array(z.string()).optional(),
		allOf: z.array(z.string()).optional(),
		noneOf: z.array(z.string()).optional(),
	})
	.optional();

const resolutionSchema = z
	.object({
		areaPatterns: setMatcherSchema,
		compositePatterns: setMatcherSchema,
		compositeTypes: setMatcherSchema,
		nameKeywords: z.array(z.string()).optional(),
		idPatterns: z.array(z.string()).optional(),
		priority: z.number().optional(),
	})
	.optional();

const baseFields = {
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	defaultVariant: z.string().min(1),
	resolution: resolutionSchema,
};

function refineDefaultVariant<
	T extends { defaultVariant: string; variants: Record<string, unknown> },
>(value: T, ctx: z.RefinementCtx) {
	if (value.variants[value.defaultVariant] === undefined) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `defaultVariant '${value.defaultVariant}' must exist in variants`,
			path: ["defaultVariant"],
		});
	}
}

export const regionPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("region"),
		variants: z.record(z.string(), regionVariantSchema),
	})
	.superRefine(refineDefaultVariant);

export const areaPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("area"),
		variants: z.record(z.string(), areaVariantSchema),
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
	regionPatternSchema,
	areaPatternSchema,
	compositePatternSchema,
]);

const catalogMatchSchema = z
	.object({
		areas: setMatcherSchema,
		composites: setMatcherSchema,
		componentTypes: setMatcherSchema,
		keywords: z.array(z.string()).optional(),
		ids: z.array(z.string()).optional(),
		priority: z.number().optional(),
	})
	.optional();

const catalogBaseFields = {
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	variant: z.string().min(1).optional(),
	match: catalogMatchSchema,
};

const regionCatalogPatternSchema = z.object({
	...catalogBaseFields,
	target: z.literal("region"),
	layout: regionVariantSchema.optional(),
});

const areaCatalogPatternSchema = z.object({
	...catalogBaseFields,
	target: z.literal("area"),
	layout: areaVariantSchema.optional(),
});

const compositeCatalogPatternSchema = z.object({
	...catalogBaseFields,
	target: z.literal("composite"),
	layout: compositeVariantSchema.optional(),
});

const catalogPatternSchema = z.discriminatedUnion("target", [
	regionCatalogPatternSchema,
	areaCatalogPatternSchema,
	compositeCatalogPatternSchema,
]);

export const patternStoreSchema = z
	.object({
		patterns: z.array(catalogPatternSchema),
	})
	.transform((store) => ({
		patterns: store.patterns.map(normalizeCatalogPattern),
	}));

function normalizeCatalogPattern(pattern: CatalogPattern): Pattern {
	const defaultVariant = pattern.variant ?? "default";
	const base = {
		id: pattern.id,
		target: pattern.target,
		name: pattern.name,
		description: pattern.description,
		defaultVariant,
		resolution: normalizeCatalogMatch(pattern.match),
	};

	if (pattern.target === "region") {
		return {
			...base,
			target: "region",
			variants: {
				[defaultVariant]: pattern.layout ?? {},
			},
		};
	}

	if (pattern.target === "area") {
		return {
			...base,
			target: "area",
			variants: {
				[defaultVariant]: pattern.layout ?? {},
			},
		};
	}

	return {
		...base,
		target: "composite",
		variants: {
			[defaultVariant]: pattern.layout ?? {},
		},
	};
}

function normalizeCatalogMatch(match: CatalogMatch): PatternResolutionSignals {
	if (!match) return undefined;
	return {
		areaPatterns: match.areas,
		compositePatterns: match.composites,
		compositeTypes: match.componentTypes,
		nameKeywords: match.keywords,
		idPatterns: match.ids,
		priority: match.priority,
	};
}

export const patternCatalogSchema = z.object({
	patterns: z.array(catalogPatternSchema),
});

export type Pattern = z.infer<typeof patternSchema>;
export type RegionPattern = z.infer<typeof regionPatternSchema>;
export type AreaPattern = z.infer<typeof areaPatternSchema>;
export type CompositePattern = z.infer<typeof compositePatternSchema>;
export type RegionVariant = z.infer<typeof regionVariantSchema>;
export type AreaVariant = z.infer<typeof areaVariantSchema>;
export type CompositeVariant = z.infer<typeof compositeVariantSchema>;
export type ChildrenLayoutPreset = z.infer<typeof childrenLayoutSchema>;
export type ChildWrapPreset = z.infer<typeof childWrapSchema>;
export type PatternResolutionSignals = z.infer<typeof resolutionSchema>;
type CatalogPattern = z.infer<typeof catalogPatternSchema>;
type CatalogMatch = z.infer<typeof catalogMatchSchema>;
