import { listPatterns } from "@cx/layout-pattern-store";
import { listLayoutPatternComponents } from "@cx/layout-pattern-store/components";
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

	it("exposes shared divider contracts for PageStack-backed area layouts", () => {
		const pageStackAreaLayoutIds = [
			"layout.area.accordionList",
			"layout.area.authMethodList",
			"layout.area.authCodeEntry",
			"layout.area.actionStack",
			"layout.area.productDisclosureAccordion",
			"layout.area.priceAccordionStackArea",
			"layout.area.plainInfoTextListArea",
		] as const;
		const entriesByLayoutId = new Map(
			listLayoutPatternComponents().map((entry) => [entry.layoutId, entry]),
		);

		for (const layoutId of pageStackAreaLayoutIds) {
			const props = entriesByLayoutId.get(layoutId)?.pattern.props;
			expect(props?.divider, layoutId).toBeDefined();
			expect(props?.divider?.type, layoutId).toBe("enum");
			expect(props?.divider?.values, layoutId).toEqual(["contents", "none", "section"]);
			expect(props?.sectionDivider, layoutId).toBeUndefined();
		}
	});
});
