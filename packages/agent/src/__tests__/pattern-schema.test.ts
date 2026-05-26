import { describe, expect, it } from "vitest";
import { patternSchema, patternStoreSchema } from "../pattern/pattern-schema";

describe("pattern schema", () => {
	it("normalizes catalog layout patterns into variant-based pattern contracts", () => {
		const store = patternStoreSchema.parse({
			patterns: [
				{
					id: "bottom-action-region",
					target: "region",
					name: "Bottom action region",
					description: "Pinned bottom CTA layout.",
					layout: {
						direction: "vertical",
						gap: 12,
						layoutProps: { paddingX: 20 },
					},
					match: {
						areas: { anyOf: ["screen-1-bottom-actions"] },
						priority: 90,
					},
				},
			],
		});

		expect(store.patterns[0]).toEqual({
			id: "bottom-action-region",
			target: "region",
			name: "Bottom action region",
			description: "Pinned bottom CTA layout.",
			defaultVariant: "default",
			resolution: {
				areaPatterns: { anyOf: ["screen-1-bottom-actions"] },
				componentTypes: undefined,
				compositePatterns: undefined,
				idPatterns: undefined,
				nameKeywords: undefined,
				priority: 90,
			},
			variants: {
				default: {
					direction: "vertical",
					gap: 12,
					layoutProps: { paddingX: 20 },
				},
			},
		});
	});

	it("rejects normalized patterns when defaultVariant does not exist in variants", () => {
		expect(() =>
			patternSchema.parse({
				id: "bad-pattern",
				target: "area",
				name: "Bad pattern",
				defaultVariant: "compact",
				variants: {
					default: {},
				},
			}),
		).toThrow();
	});
});
