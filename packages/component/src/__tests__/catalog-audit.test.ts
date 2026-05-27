import { describe, expect, it } from "vitest";
import { auditComponentCatalog } from "../catalog";

describe("@cx/components catalog audit", () => {
	it("variantTokens keys must be in enum values, and roles must be known", () => {
		const issues = auditComponentCatalog();
		expect(issues).toEqual([]);
	});
});
