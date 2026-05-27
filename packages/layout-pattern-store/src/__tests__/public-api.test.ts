import { listPatterns } from "@cx/layout-pattern-store";
import { createLayoutPattern } from "@cx/layout-pattern-store/mutations";
import { resolveCompositePatternByComponentType } from "@cx/layout-pattern-store/resolver";
import type { PatternStore } from "@cx/layout-pattern-store/types";
import { describe, expect, it } from "vitest";

describe("@cx/layout-pattern-store public API", () => {
	it("keeps catalog, resolver, mutations, and types on explicit public subpaths", () => {
		expect(listPatterns("screen").length).toBeGreaterThan(0);
		expect(resolveCompositePatternByComponentType).toBeTypeOf("function");

		const store: PatternStore = { patterns: [] };
		const created = createLayoutPattern(store, {
			id: "api-test-area",
			target: "area",
			name: "API test area",
			defaultVariant: "default",
			variants: { default: {} },
		});
		expect(created.ok).toBe(true);
	});
});
