import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildCatalogDeck } from "../deck/build-catalog-deck";
import { buildDesignDeck } from "../deck/build-design-deck";
import { buildLayoutPatternStoreDeck } from "../deck/build-layout-pattern-store-deck";

const ROOT = resolve(__dirname, "..", "..", "..", "..");

describe("deck builders", () => {
	it("buildCatalogDeck produces primitives + empty componentPatterns by default", async () => {
		const deck = await buildCatalogDeck({ version: "test" });
		expect(deck.version).toBe("test");
		expect(deck.primitives.length).toBeGreaterThan(0);
		expect(deck.componentPatterns.registered).toEqual([]);
		expect(deck.componentPatterns.proposed).toEqual([]);

		// 모든 primitive 카드가 필수 필드를 가진다
		for (const card of deck.primitives) {
			expect(card.id).toBeTruthy();
			expect(card.name).toBeTruthy();
			expect(Array.isArray(card.props)).toBe(true);
			expect(Array.isArray(card.variants)).toBe(true);
			expect(Array.isArray(card.tokensExpected)).toBe(true);
		}
	});

	it("buildDesignDeck whitelists 8개 design docs", async () => {
		const deck = await buildDesignDeck({
			docsRoot: resolve(ROOT, "docs", "design"),
			version: "test",
		});
		expect(deck.documents.length).toBe(8);
		const ids = deck.documents.map((d) => d.id).sort();
		expect(ids).toEqual([
			"COMPONENT_INVENTORY.md",
			"COMPOSITION_LAYERS.md",
			"DESIGN_FOUNDATION.md",
			"INTERACTION_PATTERNS.md",
			"LAYOUT_SPACING_CONTRACT.md",
			"SCREEN_PATTERN_SUMMARY.md",
			"SECTION_PATTERNS.md",
			"VISUAL_FOUNDATION_OBSERVATIONS.md",
		]);
		for (const doc of deck.documents) {
			expect(doc.title).toBeTruthy();
			expect(Array.isArray(doc.rules)).toBe(true);
			expect(doc.rules.length).toBeGreaterThan(0);
			for (const rule of doc.rules) {
				expect(rule.id).toBeTruthy();
				expect(rule.section).toBeTruthy();
				expect(rule.summary).toBeTruthy();
				expect(rule.appliesTo.length).toBeGreaterThan(0);
			}
		}
	});

	it("buildDesignDeck handles missing dir gracefully", async () => {
		const deck = await buildDesignDeck({
			docsRoot: resolve(ROOT, "nonexistent-dir"),
			version: "test",
		});
		expect(deck.documents).toEqual([]);
	});

	it("buildLayoutPatternStoreDeck excludes pattern-index by default", async () => {
		const deck = await buildLayoutPatternStoreDeck({
			patternStoreRoot: resolve(ROOT, "database", "pattern-store"),
			version: "test",
		});
		expect(deck.patterns.length).toBeGreaterThan(0);
		const ids = deck.patterns.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length); // dedupe 동작
		for (const card of deck.patterns) {
			expect(card.id).toBeTruthy();
			expect(card.variants.length).toBeGreaterThan(0);
			expect(card.appliesTo.length).toBeGreaterThan(0);
		}
	});

	it("buildLayoutPatternStoreDeck maps target → appliesTo", async () => {
		const deck = await buildLayoutPatternStoreDeck({
			patternStoreRoot: resolve(ROOT, "database", "pattern-store"),
			version: "test",
		});
		const screenPatterns = deck.patterns.filter((p) => p.appliesTo.includes("screen"));
		const areaPatterns = deck.patterns.filter((p) => p.appliesTo.includes("area"));
		expect(screenPatterns.length).toBeGreaterThan(0);
		expect(areaPatterns.length).toBeGreaterThan(0);
	});
});
