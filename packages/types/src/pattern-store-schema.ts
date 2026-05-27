import { z } from "zod";
import type { PropValue } from "./database-tables";
import type {
	AreaPattern,
	AreaVariant,
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	Pattern,
	PatternResolutionSignals,
	RegionPattern,
	RegionVariant,
	ScreenPattern,
	ScreenVariant,
} from "./pattern-store";

export type {
	AreaPattern,
	AreaVariant,
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	Pattern,
	PatternResolutionSignals,
	RegionPattern,
	RegionVariant,
	ScreenPattern,
	ScreenVariant,
};

const propValueSchema: z.ZodType<PropValue> = z.lazy(() =>
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

const propsSchema: z.ZodType<Record<string, PropValue>> = z.record(z.string(), propValueSchema);

const childWrapSchema = z.object({
	kind: z.literal("page-stack"),
	appliesTo: z.array(z.enum(["component", "area"])).optional(),
	divider: z.object({ type: z.enum(["contents", "section"]) }).optional(),
	itemPaddingX: z.number().optional(),
	itemTemplate: z.enum(["card-0", "default-20", "plain"]).optional(),
	paddingY: z.number().optional(),
	sectionPaddingX: z.number().optional(),
	sectionGap: z.number().optional(),
	slotInsetX: z.number().optional(),
	titleMode: z.enum(["hidden", "none", "visible"]).optional(),
}) satisfies z.ZodType<ChildWrapPreset>;

const childrenLayoutSchema = z.object({
	childOrder: z.enum(["explicit", "repeat"]).optional(),
	childWrap: childWrapSchema.optional(),
	direction: z.enum(["horizontal", "vertical"]).optional(),
	gap: z.number().optional(),
	paddingX: z.number().optional(),
	paddingY: z.number().optional(),
	layoutProps: propsSchema.optional(),
}) satisfies z.ZodType<ChildrenLayoutPreset>;

const regionVariantSchema = childrenLayoutSchema;
const areaVariantSchema = childrenLayoutSchema;
const compositeVariantSchema = childrenLayoutSchema;
const screenVariantSchema = childrenLayoutSchema;

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
		componentTypes: setMatcherSchema,
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

export const screenPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("screen"),
		variants: z.record(z.string(), screenVariantSchema),
	})
	.superRefine(refineDefaultVariant);

export const patternSchema = z.discriminatedUnion("target", [
	screenPatternSchema,
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

const screenCatalogPatternSchema = z.object({
	...catalogBaseFields,
	target: z.literal("screen"),
	layout: screenVariantSchema.optional(),
});

const catalogPatternSchema = z.discriminatedUnion("target", [
	screenCatalogPatternSchema,
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
	return {
		id: pattern.id,
		target: pattern.target,
		name: pattern.name,
		description: pattern.description,
		defaultVariant,
		resolution: normalizeCatalogMatch(pattern.match),
		variants: {
			[defaultVariant]: pattern.layout ?? {},
		},
	} as Pattern;
}

function normalizeCatalogMatch(match: CatalogMatch): PatternResolutionSignals | undefined {
	if (!match) return undefined;
	return {
		areaPatterns: match.areas,
		compositePatterns: match.composites,
		componentTypes: match.componentTypes,
		nameKeywords: match.keywords,
		idPatterns: match.ids,
		priority: match.priority,
	};
}

export const patternCatalogSchema = z.object({
	patterns: z.array(catalogPatternSchema),
});

export type CatalogPattern = z.infer<typeof catalogPatternSchema>;
export type CatalogMatch = z.infer<typeof catalogMatchSchema>;
