import { describe, expect, it } from "vitest";
import type { InferenceReference, ReferenceCatalogObject } from "../index";
import { SSOT_OBJECT_SCHEMA_VERSION } from "../index";

describe("InferenceReference union", () => {
	it("ReferenceCatalogObject를 InferenceReference로 받는다", () => {
		const obj: ReferenceCatalogObject = {
			kind: "reference-catalog",
			id: "screen.index",
			owner: "@cx/agent",
			sourceRef: "docs/skills/references/screens",
			schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
			data: { category: "screen", mode: "index", documents: [] },
		};
		const asRef: InferenceReference = obj;
		expect(asRef.kind).toBe("reference-catalog");
	});
});
