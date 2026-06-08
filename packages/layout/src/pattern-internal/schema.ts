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
		description: z.string().optional(),
		required: z.boolean().optional(),
		values: nonEmptyStringArraySchema.optional(),
	})
	.strict()
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
		accepts: z.enum(["any", "area", "area-or-component", "component", "none", "region"]),
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
		id: z.string().regex(/^layout\.(screen|region|area|composite)\.[A-Za-z0-9][A-Za-z0-9.-]*$/),
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
		if (!entry.id.startsWith(expectedPrefix)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `id for target '${entry.target}' must start with '${expectedPrefix}'`,
				path: ["id"],
			});
		}
	});

const childWrapSchema = z.object({
	kind: z.literal("page-stack"),
	appliesTo: z.array(z.enum(["component", "area"])).optional(),
	divider: z.enum(["contents", "none", "section"]).optional(),
	itemPaddingX: z.number().optional(),
	itemTemplate: z.enum(["card-0", "default-20", "plain"]).optional(),
	paddingY: z.number().optional(),
	sectionPaddingX: z.number().optional(),
	sectionGap: z.number().optional(),
	slotInsetX: z.number().optional(),
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

const catalogPatternSchema = layoutPatternCatalogEntrySchema;

export const normalizedPatternStoreSchema: z.ZodType<PatternStore> = z
	.object({
		patterns: z.array(patternSchema),
	})
	.superRefine(refineUniquePatternIds);

export const patternStoreSchema = z
	.object({
		patterns: z.array(catalogPatternSchema),
	})
	.superRefine(refineUniqueCatalogPatternIds)
	.transform((store) => ({
		patterns: store.patterns.map(normalizeLayoutPatternCatalogEntry),
	}));

function normalizeLayoutPatternCatalogEntry(
	pattern: z.infer<typeof layoutPatternCatalogEntrySchema>,
): Pattern {
	const id = layoutPatternIdToPatternId(pattern.id);

	return {
		id,
		target: pattern.target,
		name: pattern.name,
		description: pattern.description,
		defaultVariant: "default",
		variants: {
			default: {},
		},
	} as Pattern;
}

function refineUniqueCatalogPatternIds<T extends { patterns: Array<{ id?: string }> }>(
	store: T,
	ctx: z.RefinementCtx,
) {
	const seen = new Set<string>();
	for (const [index, pattern] of store.patterns.entries()) {
		const id = pattern.id?.startsWith("layout.")
			? layoutPatternIdToPatternId(pattern.id)
			: pattern.id;
		if (!id) continue;
		if (!seen.has(id)) {
			seen.add(id);
			continue;
		}
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `duplicate pattern id '${id}'`,
			path: ["patterns", index, "id"],
		});
	}
}

function layoutPatternIdToPatternId(id: string): string {
	return id
		.replace(/^layout\.(screen|region|area|composite)\./, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase();
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

function refineUniqueLayoutIds<T extends { patterns: Array<{ id: string }> }>(
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
			message: `duplicate layout id '${pattern.id}'`,
			path: ["patterns", index, "id"],
		});
	}
}
