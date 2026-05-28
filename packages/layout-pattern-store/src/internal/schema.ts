import { z } from "zod";
import type {
	AreaPattern,
	AreaVariant,
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	LayoutPatternChildrenContract,
	LayoutPatternPropContract,
	Pattern,
	PatternResolutionSignals,
	PatternStore,
	PropValue,
	RegionPattern,
	RegionVariant,
	ScreenPattern,
	ScreenVariant,
} from "../public/types";

export type {
	AreaPattern,
	AreaVariant,
	ChildrenLayoutPreset,
	ChildWrapPreset,
	CompositePattern,
	CompositeVariant,
	LayoutPatternChildrenContract,
	LayoutPatternPropContract,
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
const patternTargetSchema = z.enum(["screen", "region", "area", "composite"]);

const patternIdSchema = z
	.string()
	.min(1)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "pattern id must be lowercase kebab-case");

const variantIdSchema = z.string().min(1);
const nonEmptyStringArraySchema = z.array(z.string().min(1)).min(1);

const layoutPatternPropContractSchema = z
	.object({
		type: z.enum(["array", "boolean", "enum", "node", "number", "object", "string"]),
		aiWritable: z.boolean().optional(),
		default: propValueSchema.optional(),
		description: z.string().optional(),
		required: z.boolean().optional(),
		values: nonEmptyStringArraySchema.optional(),
	})
	.superRefine((contract, ctx) => {
		if (contract.type === "enum" && !contract.values) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "enum props must declare values",
				path: ["values"],
			});
		}
		if (contract.type !== "enum" && contract.values) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "values can only be declared for enum props",
				path: ["values"],
			});
		}
	}) satisfies z.ZodType<LayoutPatternPropContract>;

const layoutPatternChildrenContractSchema = z
	.object({
		accepts: z.enum(["any", "area", "area-or-component", "component", "none"]),
		max: z.number().int().nonnegative().optional(),
		min: z.number().int().nonnegative().optional(),
	})
	.superRefine((contract, ctx) => {
		if (contract.max !== undefined && contract.min !== undefined && contract.max < contract.min) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "children.max must be greater than or equal to children.min",
				path: ["max"],
			});
		}
	}) satisfies z.ZodType<LayoutPatternChildrenContract>;

export const layoutPatternCatalogEntrySchema = z
	.object({
		layoutId: z
			.string()
			.regex(/^layout\.(screen|region|area|composite)\.[A-Za-z0-9][A-Za-z0-9.-]*$/),
		target: patternTargetSchema,
		name: z.string().min(1),
		componentID: z.string().min(1),
		children: layoutPatternChildrenContractSchema.optional(),
		description: z.string().optional(),
		props: z.record(z.string(), layoutPatternPropContractSchema).optional(),
		status: z.enum(["deprecated", "draft", "ready"]).optional(),
	})
	.superRefine((entry, ctx) => {
		const expectedPrefix = `layout.${entry.target}.`;
		if (!entry.layoutId.startsWith(expectedPrefix)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `layoutId for target '${entry.target}' must start with '${expectedPrefix}'`,
				path: ["layoutId"],
			});
		}
	});

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

const childrenLayoutSchema: z.ZodType<ChildrenLayoutPreset> = z.object({
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
		anyOf: nonEmptyStringArraySchema.optional(),
		allOf: nonEmptyStringArraySchema.optional(),
		noneOf: nonEmptyStringArraySchema.optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "matcher must include at least one of anyOf, allOf, or noneOf",
	})
	.optional();

const resolutionSchema = z
	.object({
		areaPatterns: setMatcherSchema,
		compositePatterns: setMatcherSchema,
		componentTypes: setMatcherSchema,
		nameKeywords: nonEmptyStringArraySchema.optional(),
		idPatterns: nonEmptyStringArraySchema.optional(),
		priority: z.number().optional(),
	})
	.refine((value) => Object.values(value).some((entry) => entry !== undefined), {
		message: "resolution must include at least one signal",
	})
	.optional();

const baseFields = {
	id: patternIdSchema,
	name: z.string().min(1),
	description: z.string().optional(),
	defaultVariant: variantIdSchema,
	resolution: resolutionSchema,
};

const variantRecord = <T extends z.ZodType<ChildrenLayoutPreset>>(schema: T) =>
	z.record(variantIdSchema, schema).refine((variants) => Object.keys(variants).length > 0, {
		message: "variants must include at least one variant",
	});

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
		variants: variantRecord(regionVariantSchema),
	})
	.superRefine(refineDefaultVariant);

export const areaPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("area"),
		variants: variantRecord(areaVariantSchema),
	})
	.superRefine(refineDefaultVariant);

export const compositePatternSchema = z
	.object({
		...baseFields,
		target: z.literal("composite"),
		variants: variantRecord(compositeVariantSchema),
	})
	.superRefine(refineDefaultVariant);

export const screenPatternSchema = z
	.object({
		...baseFields,
		target: z.literal("screen"),
		variants: variantRecord(screenVariantSchema),
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
	id: patternIdSchema,
	name: z.string().min(1),
	description: z.string().optional(),
	variant: variantIdSchema.optional(),
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

export const normalizedPatternStoreSchema: z.ZodType<PatternStore> = z
	.object({
		patterns: z.array(patternSchema),
	})
	.superRefine(refineUniquePatternIds);

export const patternStoreSchema = z
	.object({
		patterns: z.array(catalogPatternSchema),
	})
	.superRefine(refineUniquePatternIds)
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

export const layoutPatternCatalogSchema = z
	.object({
		patterns: z.array(layoutPatternCatalogEntrySchema),
	})
	.superRefine(refineUniqueLayoutIds);

export type CatalogPattern = z.infer<typeof catalogPatternSchema>;
export type CatalogMatch = z.infer<typeof catalogMatchSchema>;

function refineUniquePatternIds<T extends { patterns: Array<{ id: string }> }>(
	store: T,
	ctx: z.RefinementCtx,
) {
	const seen = new Set<string>();
	for (const [index, pattern] of store.patterns.entries()) {
		if (!seen.has(pattern.id)) {
			seen.add(pattern.id);
			continue;
		}
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `duplicate pattern id '${pattern.id}'`,
			path: ["patterns", index, "id"],
		});
	}
}

function refineUniqueLayoutIds<T extends { patterns: Array<{ layoutId: string }> }>(
	store: T,
	ctx: z.RefinementCtx,
) {
	const seen = new Set<string>();
	for (const [index, pattern] of store.patterns.entries()) {
		if (!seen.has(pattern.layoutId)) {
			seen.add(pattern.layoutId);
			continue;
		}
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `duplicate layout id '${pattern.layoutId}'`,
			path: ["patterns", index, "layoutId"],
		});
	}
}
