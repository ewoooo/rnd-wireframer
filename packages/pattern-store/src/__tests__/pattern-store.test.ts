import { componentCatalog } from "@cx/components/catalog";
import type { ComponentCatalogEntry } from "@cx/types/component-catalog";
import { isRecord } from "@cx/types/guards";
import { patternSchema, patternStoreSchema } from "@cx/types/pattern-store-schema";
import { describe, expect, it } from "vitest";
import { listPatternSummaries, listPatterns, loadPatternStore } from "../store";

describe("@cx/pattern-store", () => {
	it("loads normalized pattern store data", () => {
		const store = loadPatternStore();
		expect(store.patterns.length).toBeGreaterThan(0);
		expect(listPatterns("screen").length).toBeGreaterThan(0);
		expect(listPatterns("region").length).toBeGreaterThan(0);
		expect(listPatterns("area").length).toBeGreaterThan(0);
		expect(listPatterns("composite").length).toBeGreaterThan(0);
	});

	it("normalizes catalog layout patterns into variant-based contracts", () => {
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

	it("does not contain duplicate pattern ids", () => {
		const ids = loadPatternStore().patterns.map((pattern) => pattern.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("keeps screen pattern region references resolvable", () => {
		const regionIds = new Set(listPatterns("region").map((pattern) => pattern.id));
		const missing: string[] = [];

		for (const pattern of listPatterns("screen")) {
			const layoutProps = pattern.variants[pattern.defaultVariant]?.layoutProps ?? {};
			for (const key of ["contentSubtypePatterns", "variants"] as const) {
				const entries = Array.isArray(layoutProps[key]) ? layoutProps[key] : [];
				for (const entry of entries) {
					if (!isRecord(entry)) continue;
					const id = readString(entry, "regionPatternId") ?? readString(entry, "contentsPattern");
					if (typeof id === "string" && !regionIds.has(id)) missing.push(id);
				}
			}
		}

		expect(missing).toEqual([]);
	});

	it("derives pattern summaries from canonical catalog data", () => {
		const patternIds = new Set(loadPatternStore().patterns.map((pattern) => pattern.id));
		const summaries = listPatternSummaries();
		const summaryIds = summaries.map((pattern) => pattern.id);
		const missing = summaryIds.filter((id) => !patternIds.has(id));
		expect(missing).toEqual([]);
		expect(summaryIds).toHaveLength(patternIds.size);
		expect(summaries[0]).toHaveProperty("variants");
	});

	it("uses component matcher signals that are catalog-backed or documented figma-only gaps", () => {
		const catalogSignals = new Set<string>();
		for (const entry of Object.values(componentCatalog) as ComponentCatalogEntry[]) {
			catalogSignals.add(entry.type);
			catalogSignals.add(entry.type.toLowerCase());
			if (entry.kind) catalogSignals.add(entry.kind);
			for (const alias of entry.aliases ?? []) {
				catalogSignals.add(alias);
				catalogSignals.add(alias.toLowerCase());
			}
		}

		const figmaOnlySignals = new Set(["price-text", "product-list-group"]);
		const missing: string[] = [];
		for (const pattern of [...listPatterns("area"), ...listPatterns("composite")]) {
			const matchers = pattern.resolution?.componentTypes;
			for (const key of ["allOf", "anyOf", "noneOf"] as const) {
				for (const signal of matchers?.[key] ?? []) {
					if (catalogSignals.has(signal) || catalogSignals.has(signal.toLowerCase())) continue;
					if (figmaOnlySignals.has(signal)) continue;
					missing.push(`${pattern.id}:${key}:${signal}`);
				}
			}
		}

		expect(missing).toEqual([]);
	});
});
function readString(value: Record<string, unknown>, key: string): string | undefined {
	const field = value[key];
	return typeof field === "string" ? field : undefined;
}
