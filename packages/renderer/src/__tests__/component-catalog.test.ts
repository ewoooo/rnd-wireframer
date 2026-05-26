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
		expect(getComponentCatalogEntry("button")?.type).toBe("Button");
		expect(getComponentCatalogEntry("checkbox")).toMatchObject({
			type: "Checkbox",
			kind: "checkbox",
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
			expect.arrayContaining(["ActionButton", "Button", "HeaderBase", "ListCell", "TextField"]),
		);
	});
});
