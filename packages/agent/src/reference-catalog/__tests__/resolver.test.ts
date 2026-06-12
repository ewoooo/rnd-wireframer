import { describe, expect, it } from "vitest";
import { resolveReferenceForInference } from "../catalog";

describe("resolveReferenceForInference", () => {
	it("index 모드는 frontmatter만 반환하고 body는 없다", () => {
		const obj = resolveReferenceForInference("screen", "index");
		expect(obj.kind).toBe("reference-catalog");
		expect(obj.data.category).toBe("screen");
		expect(obj.data.mode).toBe("index");
		expect(obj.data.documents.length).toBeGreaterThan(0);
		expect(obj.data.documents.every((d) => d.body === undefined)).toBe(true);
		expect(obj.data.documents[0].id).toBeTruthy();
	});

	it("catalog 모드는 body를 채운다", () => {
		const obj = resolveReferenceForInference("screen", "catalog");
		expect(obj.data.mode).toBe("catalog");
		expect(obj.data.documents.every((d) => typeof d.body === "string" && d.body.length > 0)).toBe(
			true,
		);
	});

	it("area category도 index/catalog 조회가 가능하다", () => {
		const index = resolveReferenceForInference("area", "index");
		const catalog = resolveReferenceForInference("area", "catalog");
		expect(index.data.category).toBe("area");
		expect(index.data.documents.every((d) => d.body === undefined)).toBe(true);
		expect(catalog.data.documents.some((d) => d.id === "area-form-address")).toBe(true);
		expect(
			catalog.data.documents.every((d) => typeof d.body === "string" && d.body.length > 0),
		).toBe(true);
	});

	it("미등록 category는 throw한다", () => {
		expect(() => resolveReferenceForInference("nope", "index")).toThrow(
			/Unknown reference category/,
		);
	});
});
