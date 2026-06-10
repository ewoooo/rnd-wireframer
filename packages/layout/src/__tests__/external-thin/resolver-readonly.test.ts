import { describe, expect, it } from "vitest";
// 축5: resolver = catalog read-only API. external resolver와 동형, mutation/component 해석 없음.
// (T9에서 resolver.ts 작성 전까지 RED)
import * as resolver from "../../resolver";

const READ_API = [
	"getLayoutCatalogEntry",
	"getLayoutCatalogIds",
	"getLayoutCatalogStatus",
	"listLayoutCatalog",
	"resolveLayoutCatalogForInference",
] as const;

// resolver가 노출하면 안 되는 것: mutation, component 해석(renderer 책임), store 로딩.
const FORBIDDEN = [
	"createCandidate",
	"createLayoutPattern",
	"updateLayoutPattern",
	"deleteLayoutPattern",
	"loadPatternStore",
	"resolveLayoutComponent",
	"listLayoutComponents",
] as const;

describe("external-thin: resolver read-only", () => {
	it("read API를 모두 노출한다", () => {
		for (const fn of READ_API) {
			expect(typeof (resolver as Record<string, unknown>)[fn], fn).toBe("function");
		}
	});

	it("mutation / component 해석 / store API를 노출하지 않는다", () => {
		const leaked = FORBIDDEN.filter((fn) => fn in resolver);
		expect(leaked).toEqual([]);
	});

	it("getLayoutCatalogEntry / listLayoutCatalog 동작", () => {
		const ids = resolver.getLayoutCatalogIds();
		expect(ids.length).toBeGreaterThan(0);
		const entry = resolver.getLayoutCatalogEntry(ids[0]);
		expect(entry?.id).toBe(ids[0]);
		const areas = resolver.listLayoutCatalog({ target: "area" });
		expect(areas.every((e) => e.target === "area")).toBe(true);
	});
});
