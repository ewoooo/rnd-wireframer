import { z } from "zod";
import type {
	LayoutCatalogMeta,
	LayoutPatternChildrenContract,
	LayoutPatternPropContract,
} from "../../packages/layout/src/catalog-types";

// Ported from packages/layout/src/pattern-internal/schema.ts — entry/prop/children only.
// Dropped: defaults, variants, store, componentID, usedFor (component-land / legacy concerns).

const patternTargetSchema = z.enum(["screen", "region", "area", "composite"]);

const patternIdRe = /^layout\.(screen|region|area|composite)\.[A-Za-z0-9][A-Za-z0-9.-]*$/;

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
	.strict()
	.superRefine((contract, ctx) => {
		if (contract.max !== undefined && contract.min !== undefined && contract.max < contract.min) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "children.max must be greater than or equal to children.min",
				path: ["max"],
			});
		}
	}) satisfies z.ZodType<LayoutPatternChildrenContract>;

export const layoutCatalogMetaSchema = z
	.object({
		id: z.string().regex(patternIdRe, "id must be a qualified layout id (layout.<target>.<name>)"),
		target: patternTargetSchema,
		name: z.string().min(1),
		props: z.record(z.string(), layoutPatternPropContractSchema).optional(),
		children: layoutPatternChildrenContractSchema.optional(),
		description: z.string().optional(),
		status: z.enum(["stable", "draft", "deprecated"]).optional(),
	})
	.strict()
	.superRefine((entry, ctx) => {
		const expectedPrefix = `layout.${entry.target}.`;
		if (!entry.id.startsWith(expectedPrefix)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `id for target '${entry.target}' must start with '${expectedPrefix}'`,
				path: ["id"],
			});
		}
	}) satisfies z.ZodType<LayoutCatalogMeta>;

export type LayoutCatalogMetaInput = z.infer<typeof layoutCatalogMetaSchema>;
