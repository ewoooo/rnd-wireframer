import { resolveTokenCatalogForInference, Spacing20 } from "@cx/tokens";
import { describe, expect, it } from "vitest";

describe("@cx/tokens public API", () => {
	it("resolves tokens as an inference SSOT object", () => {
		const catalog = resolveTokenCatalogForInference();

		expect(catalog).toMatchObject({
			kind: "token-catalog",
			id: "default",
			owner: "@cx/tokens",
			sourceRef: "generated/tokens",
			schemaVersion: "ssot-object.v1",
			data: {
				tailwindKeys: expect.arrayContaining(["cx-20"]),
			},
		});
		expect(catalog.data.variables.Spacing20).toBe(Spacing20);
	});
});
