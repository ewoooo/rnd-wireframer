import { describe, expect, it } from "vitest";
import {
	layoutPatternCatalogEntrySchema,
	layoutPatternCatalogSchema,
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

	it("accepts layout pattern catalog entries with componentID and prop contracts", () => {
		const catalog = layoutPatternCatalogSchema.parse({
			patterns: [
				{
					id: "layout.area.fieldStack",
					target: "area",
					name: "Field Stack",
					componentID: "PageStackAreaPattern",
					props: {
						componentGap: {
							type: "number",
							default: 12,
						},
						gap: {
							type: "number",
							default: 12,
						},
						titleGap: {
							type: "number",
							default: 8,
						},
						titleMode: {
							type: "enum",
							values: ["hidden", "none", "visible"],
							default: "visible",
						},
					},
					children: {
						accepts: "component",
						min: 1,
					},
					status: "draft",
				},
			],
		});

		expect(catalog.patterns[0]?.componentID).toBe("PageStackAreaPattern");
		expect(catalog.patterns[0]?.props?.componentGap?.default).toBe(12);
		expect(catalog.patterns[0]?.props?.titleGap?.default).toBe(8);
	});

	it("rejects layout pattern catalog entries with target/layout mismatches", () => {
		expect(() =>
			layoutPatternCatalogEntrySchema.parse({
				id: "layout.region.fieldStack",
				target: "area",
				name: "Field Stack",
				componentID: "PageStackAreaPattern",
			}),
		).toThrow(/layout\.area\./);
	});

	it("rejects enum prop contracts without values", () => {
		expect(() =>
			layoutPatternCatalogEntrySchema.parse({
				id: "layout.area.badEnum",
				target: "area",
				name: "Bad enum",
				componentID: "PageStackAreaPattern",
				props: {
					titleMode: {
						type: "enum",
					},
				},
			}),
		).toThrow(/enum props must declare values/);
	});
});
