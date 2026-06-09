import { describe, expect, it } from "vitest";
import { canonicalizeLayoutId } from "../canonicalize-layout";

describe("canonicalizeLayoutId", () => {
	it("passes an already-qualified id through unchanged", () => {
		expect(canonicalizeLayoutId("layout.area.fieldStack")).toBe("layout.area.fieldStack");
	});

	it("returns undefined for a bare id with no alias entry", () => {
		expect(canonicalizeLayoutId("field-stack")).toBeUndefined();
	});

	it("does not fuzzy-convert (no prefix strip, no kebab folding)", () => {
		expect(canonicalizeLayoutId("fieldStack")).toBeUndefined();
		expect(canonicalizeLayoutId("layout.area.field-stack")).toBe("layout.area.field-stack");
	});
});
