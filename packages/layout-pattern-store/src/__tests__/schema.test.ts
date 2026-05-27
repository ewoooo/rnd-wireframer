import { describe, expect, it } from "vitest";
import {
	normalizedPatternStoreSchema,
	patternSchema,
	patternStoreSchema,
} from "../internal/schema";

describe("@cx/layout-pattern-store schema", () => {
	it("normalizes raw catalog records into normalized pattern store shape", () => {
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

	it("rejects invalid ids, empty variant maps, and missing default variants", () => {
		expect(() =>
			patternSchema.parse({
				id: "Bad Pattern",
				target: "area",
				name: "Bad pattern",
				defaultVariant: "default",
				variants: { default: {} },
			}),
		).toThrow(/kebab-case/);

		expect(() =>
			patternSchema.parse({
				id: "empty-variants",
				target: "area",
				name: "Empty variants",
				defaultVariant: "default",
				variants: {},
			}),
		).toThrow(/at least one variant/);

		expect(() =>
			patternSchema.parse({
				id: "missing-default",
				target: "area",
				name: "Missing default",
				defaultVariant: "compact",
				variants: { default: {} },
			}),
		).toThrow(/must exist in variants/);
	});

	it("rejects empty matcher arrays and duplicate pattern ids at store level", () => {
		expect(() =>
			patternStoreSchema.parse({
				patterns: [
					{
						id: "empty-matcher",
						target: "area",
						name: "Empty matcher",
						match: { componentTypes: { anyOf: [] } },
						layout: {},
					},
				],
			}),
		).toThrow();

		expect(() =>
			normalizedPatternStoreSchema.parse({
				patterns: [
					{
						id: "duplicate-area",
						target: "area",
						name: "Duplicate area",
						defaultVariant: "default",
						variants: { default: {} },
					},
					{
						id: "duplicate-area",
						target: "area",
						name: "Duplicate area again",
						defaultVariant: "default",
						variants: { default: {} },
					},
				],
			}),
		).toThrow(/duplicate pattern id/);
	});
});
