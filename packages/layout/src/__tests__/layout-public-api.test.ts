import {
	createCandidate,
	getEntry,
	listCatalog,
	listCatalogIds,
	listPatterns,
	resolveLayoutCatalogForInference,
} from "@cx/layout/catalog";
import { listLayoutPatternComponents } from "@cx/layout/components";
import { createLayoutPattern } from "@cx/layout/mutations";
import { resolveCompositePatternByComponentType } from "@cx/layout/resolver";
import type { PatternStore } from "@cx/layout/types";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

describe("@cx/layout public API", () => {
	it("keeps catalog, resolver, mutations, and types on explicit public subpaths", () => {
		expect(Object.keys(packageJson.exports)).toContain("./catalog");
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

	it("exposes the standard catalog-driven resolution facade", () => {
		const ids = listCatalogIds({ target: "area" });
		const entries = listCatalog({ target: "area" });
		const listStack = getEntry("layout.area.listStack", { target: "area" });

		expect(ids).toContain("layout.area.listStack");
		expect(entries.length).toBe(ids.length);
		expect(listStack?.id).toBe("layout.area.listStack");
		expect(listStack?.target).toBe("area");
		expect(listCatalogIds({ status: "draft" }).length).toBeGreaterThan(0);

		const created = createCandidate({
			entry: {
				id: "layout.area.generatedFacadeList",
				target: "area",
				name: "Generated facade list",
				componentID: "GeneratedFacadeListArea",
				children: { accepts: "component" },
				props: {
					gap: { type: "number" },
				},
				status: "draft",
			},
		});
		expect(created.ok).toBe(true);
		if (!created.ok) throw new Error("layout candidate create failed");
		expect(created.pattern?.id).toBe("generated-facade-list");
		expect(getEntry("layout.area.generatedFacadeList")).toBeUndefined();
	});

	it("resolves the layout catalog as an inference SSOT object", () => {
		const resolved = resolveLayoutCatalogForInference();

		expect(resolved).toMatchObject({
			kind: "layout-catalog",
			id: "default",
			owner: "@cx/layout",
			sourceRef: "catalog",
			schemaVersion: "ssot-object.v1",
		});
		expect(resolved.data.screen.length).toBeGreaterThan(0);
		expect(resolved.data.region.length).toBeGreaterThan(0);
		expect(resolved.data.area.length).toBeGreaterThan(0);
		expect(resolved.data.composite.length).toBeGreaterThan(0);
	});

	it("exposes shared divider contracts for PageStack-backed area layouts", () => {
		const pageStackAreaLayoutIds = [
			"layout.area.accordionList",
			"layout.area.authMethodList",
			"layout.area.authCodeEntry",
			"layout.area.actionStack",
			"layout.area.productDisclosureAccordion",
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
