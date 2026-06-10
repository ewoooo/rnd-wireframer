import { describe, expect, it } from "vitest";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentCatalogSource,
	ComponentCatalogStatus,
	ComponentPropContract,
} from "../index";
import { isTokenRole } from "../index";

describe("component-catalog contract", () => {
	it("kiki source union을 받아들이고 엔트리 shape이 성립한다", () => {
		const source: ComponentCatalogSource = "kiki-barrel";
		const prop: ComponentPropContract = { type: "enum", role: "styleVariant", values: ["a"], required: false };
		const entry: ComponentCatalogEntry = {
			type: "kiki.AppBar",
			source,
			label: "[kiki] AppBar",
			version: "0.0.0",
			props: { variant: prop },
		};
		const catalog: ComponentCatalog = { [entry.type]: entry };
		expect(catalog["kiki.AppBar"]?.source).toBe("kiki-barrel");
	});

	it("status는 stable|candidate 두 값", () => {
		const stable: ComponentCatalogStatus = "stable";
		const candidate: ComponentCatalogStatus = "candidate";
		expect([stable, candidate]).toEqual(["stable", "candidate"]);
	});

	it("isTokenRole가 재노출된다", () => {
		expect(isTokenRole("spacing")).toBe(true);
		expect(isTokenRole("nope")).toBe(false);
	});
});
