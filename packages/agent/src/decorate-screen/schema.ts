import { z } from "zod";

/**
 * Schema E (DecoratedOutput) Zod 미러.
 * `@cx/types/decorated-output.ts` 의 TypeScript interface와 일치.
 *
 * 구조적 트리 불변 (SPEC §1.4) 을 타입으로 강제 — composition/areas/decisions 트리 필드는
 * 이 스키마에 존재하지 않는다. LLM 이 그쪽으로 출력하면 Zod parse 가 실패한다.
 */

const LayoutPatternDraft = z.object({
	layoutPatternId: z.string(),
	variant: z.string().optional(),
	reasons: z.array(z.string()),
	confidence: z.enum(["high", "medium", "low"]),
});

const DesignReference = z.object({
	document: z.enum([
		"COMPOSITION_LAYERS.md",
		"DESIGN_FOUNDATION.md",
		"LAYOUT_SPACING_CONTRACT.md",
		"SECTION_PATTERNS.md",
		"SCREEN_PATTERN_SUMMARY.md",
		"COMPONENT_INVENTORY.md",
		"INTERACTION_PATTERNS.md",
		"VISUAL_FOUNDATION_OBSERVATIONS.md",
	]),
	section: z.string().optional(),
	reason: z.string(),
});

const LayoutPatternVerification = z.object({
	verdict: z.enum(["accepted", "variant-adjusted", "overridden"]),
	finalLayoutPattern: z.object({
		layoutPatternId: z.string(),
		variant: z.string().optional(),
	}),
	originalDraft: LayoutPatternDraft.optional(),
	reasons: z.array(z.string()),
	designRefs: z.array(DesignReference).optional(),
});

export const DecoratedOutputSchema = z.object({
	kind: z.literal("decorated-output"),
	schemaVersion: z.string(),
	source: z.object({
		composedScreenId: z.string(),
		composedSchemaVersion: z.string(),
		decorateModel: z.string(),
	}),
	screen: LayoutPatternVerification,
	areas: z.record(z.string(), LayoutPatternVerification),
	decisions: z.record(z.string(), LayoutPatternVerification),
});

export type DecoratedOutputZ = z.infer<typeof DecoratedOutputSchema>;

export function decoratedOutputJsonSchema(): Record<string, unknown> {
	return z.toJSONSchema(DecoratedOutputSchema) as Record<string, unknown>;
}
