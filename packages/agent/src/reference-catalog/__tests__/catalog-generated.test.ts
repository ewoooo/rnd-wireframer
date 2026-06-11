import { describe, expect, it } from "vitest";
import { collect } from "../../../../../scripts/sync-reference-catalog/index";
import { referenceAreaCatalog } from "../../../docs/skills/references/areas/catalog.generated";
import { referenceScreenCatalog } from "../../../docs/skills/references/screens/catalog.generated";
import { REFERENCE_CATEGORIES } from "../categories";

describe("reference catalog.generated 무결성", () => {
	const catalogs = {
		area: referenceAreaCatalog,
		screen: referenceScreenCatalog,
	};

	it("카탈로그가 비어 있지 않고 id가 고유하다", () => {
		for (const catalog of Object.values(catalogs)) {
			expect(catalog.length).toBeGreaterThan(0);
			const ids = catalog.map((e) => e.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it("모든 엔트리가 sourceRef를 가진다", () => {
		for (const catalog of Object.values(catalogs)) {
			expect(catalog.every((e) => e.sourceRef.startsWith("../docs/"))).toBe(true);
		}
	});

	it("커밋된 생성물이 소스 .md 재수집 결과와 일치한다 (drift 가드)", () => {
		// 텍스트가 아니라 파싱된 데이터를 비교 — biome 포맷 차이에 영향받지 않는다.
		expect(referenceAreaCatalog).toEqual(collect(REFERENCE_CATEGORIES.area));
		expect(referenceScreenCatalog).toEqual(collect(REFERENCE_CATEGORIES.screen));
	});
});
