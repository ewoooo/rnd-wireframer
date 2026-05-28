import { describe, expect, it } from "vitest";
import {
	layoutPatternCatalogEntrySchema,
	layoutPatternCatalogSchema,
	normalizedPatternStoreSchema,
	patternSchema,
	patternStoreSchema,
} from "../internal/schema";

describe("@cx/layout-pattern-store schema", () => {
	it("normalizes layout component catalog records into normalized pattern store shape", () => {
		const store = patternStoreSchema.parse({
			patterns: [
				{
					id: "layout.region.commerceDetailBottomAction",
					target: "region",
					name: "Bottom action region",
					description: "Pinned bottom CTA layout.",
					componentID: "CommerceDetailBottomActionRegion",
					props: {
						gap: { type: "number" },
						paddingX: { type: "number" },
					},
					children: { accepts: "area-or-component" },
					status: "draft",
				},
			],
		});

		expect(store.patterns[0]).toEqual({
			id: "commerce-detail-bottom-action",
			target: "region",
			name: "Bottom action region",
			description: "Pinned bottom CTA layout.",
			defaultVariant: "default",
			variants: {
				default: {},
			},
		});
	});

	it("rejects legacy catalog layout/match records", () => {
		expect(() =>
			patternStoreSchema.parse({
				patterns: [
					{
						id: "bottom-action-region",
						target: "region",
						name: "Bottom action region",
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
			}),
		).toThrow();
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

	it("rejects legacy matcher arrays and duplicate pattern ids at store level", () => {
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
					componentID: "FieldStackArea",
					props: {
						componentGap: {
							type: "number",
						},
						gap: {
							type: "number",
						},
						titleGap: {
							type: "number",
						},
						titleMode: {
							type: "enum",
							values: ["hidden", "none", "visible"],
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

		expect(catalog.patterns[0]?.componentID).toBe("FieldStackArea");
		expect(catalog.patterns[0]?.props?.componentGap?.type).toBe("number");
		expect(catalog.patterns[0]?.props?.titleGap?.type).toBe("number");
	});

	it("rejects layout pattern prop contracts with runtime defaults", () => {
		expect(() =>
			layoutPatternCatalogEntrySchema.parse({
				id: "layout.area.fieldStack",
				target: "area",
				name: "Field Stack",
				componentID: "FieldStackArea",
				props: {
					gap: {
						type: "number",
						default: 12,
					},
				},
			}),
		).toThrow(/default|Unrecognized key/);
	});

	it("rejects layout pattern catalog entries with target/layout mismatches", () => {
		expect(() =>
			layoutPatternCatalogEntrySchema.parse({
				id: "layout.region.fieldStack",
				target: "area",
				name: "Field Stack",
				componentID: "FieldStackArea",
			}),
		).toThrow(/layout\.area\./);
	});

	it("rejects enum prop contracts without values", () => {
		expect(() =>
			layoutPatternCatalogEntrySchema.parse({
				id: "layout.area.badEnum",
				target: "area",
				name: "Bad enum",
				componentID: "FieldStackArea",
				props: {
					titleMode: {
						type: "enum",
					},
				},
			}),
		).toThrow(/enum props must declare values/);
	});
});
