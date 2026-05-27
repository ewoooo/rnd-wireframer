import { describe, expect, it } from "vitest";

import {
	getComponentCatalogEntry,
	getComponentCatalogTypes,
	getComponentPropContract,
} from "../component-catalog";

describe("@cx/renderer component-catalog", () => {
	it("exposes safe generation props for component implementations", () => {
		const button = getComponentCatalogEntry("Button");

		expect(button?.source).toBe("react-component");
		expect(button?.props.label.required).toBe(true);
		expect(button?.props.variant.values).toEqual(["primary", "secondary", "solid"]);
		expect(button?.props.rightIcon.aiWritable).toBe(false);
	});

	it("resolves renderer composite aliases", () => {
		expect(getComponentCatalogEntry("section-message")?.type).toBe("SectionMessage");
		expect(getComponentCatalogEntry("text-field")?.type).toBe("TextField");
		expect(getComponentCatalogEntry("search-bar")).toMatchObject({
			type: "SearchBar",
			kind: "search-bar",
		});
		expect(getComponentCatalogEntry("button")?.type).toBe("Button");
		expect(getComponentCatalogEntry("checkbox")).toMatchObject({
			type: "Checkbox",
			kind: "checkbox",
		});
		expect(getComponentCatalogEntry("product-info")).toMatchObject({
			type: "ProductInfo",
			kind: "product-info",
		});
		expect(getComponentCatalogEntry("thumbnail-large")).toMatchObject({
			type: "ThumbnailLarge",
			kind: "thumbnail-large",
		});
		expect(getComponentCatalogEntry("option-card")).toMatchObject({
			type: "OptionCard",
			kind: "option-card",
		});
		expect(getComponentCatalogEntry("banner-indicator")).toMatchObject({
			type: "BannerIndicaterMedium",
			kind: "banner-indicator",
		});
		expect(getComponentCatalogEntry("footer")).toMatchObject({
			type: "Footer",
			kind: "footer",
		});
		expect(getComponentCatalogEntry("filter-sorting")).toMatchObject({
			type: "FilterSorting",
			kind: "filter-sorting",
		});
		expect(getComponentCatalogEntry("legal-text")).toMatchObject({
			type: "LegalText",
			kind: "legal-text",
		});
		expect(getComponentCatalogEntry("map")).toMatchObject({
			type: "MapBlock",
			kind: "map",
		});
		expect(getComponentCatalogEntry("list-product-horizontal")).toMatchObject({
			type: "ListProductHorizontal",
			kind: "product-card",
		});
		expect(getComponentCatalogEntry("list-product-row")).toMatchObject({
			type: "ListProductRow",
			kind: "product-card",
		});
		expect(getComponentCatalogEntry("store-card")).toMatchObject({
			type: "StoreCard",
			kind: "store-card",
		});
		expect(getComponentCatalogEntry("ButtonTextUnderline")).toMatchObject({
			type: "TextButton",
			kind: "text-link",
		});
		expect(getComponentCatalogEntry("ButtonMore")).toMatchObject({
			type: "TextButton",
			kind: "text-link",
		});
		expect(getComponentCatalogEntry("ButtonMoreProduct")).toMatchObject({
			type: "TextButton",
			kind: "text-link",
		});
		expect(getComponentCatalogEntry("TitleSection")).toMatchObject({
			type: "TitleSection",
			kind: "title-section",
		});
		expect(getComponentCatalogEntry("AccordionPriceInfo")).toMatchObject({
			type: "AccordionPriceInfo",
			kind: "accordion-info",
		});
		expect(getComponentCatalogEntry("CardText")).toMatchObject({
			type: "CardContentsFilled",
			kind: "card-contents",
		});
	});

	it("exposes prop contracts for compose-time inference", () => {
		expect(getComponentPropContract("TextField", "helperText")).toMatchObject({
			type: "string",
			role: "description",
		});
		expect(getComponentPropContract("SectionMessage", "variant")?.values).toContain("negative");
	});

	it("includes package components and renderer composites", () => {
		expect(getComponentCatalogTypes()).toEqual(
			expect.arrayContaining([
				"ActionButton",
				"Button",
				"CardSummary",
				"FilterSorting",
				"HeaderBase",
				"ListProductHorizontal",
				"ListProductRow",
				"ListCell",
				"MapBlock",
				"OptionCard",
				"ProductInfo",
				"SearchBar",
				"StoreCard",
				"TextField",
				"TitleSection",
				"ThumbnailLarge",
			]),
		);
	});
});
