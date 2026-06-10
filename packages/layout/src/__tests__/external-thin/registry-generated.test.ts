import { describe, expect, it } from "vitest";
// 축4: registry = 실제 React component surface. 모든 export는 렌더 가능한 함수형 component.
// (T8에서 registry.generated.ts 생성 전까지 RED)
import * as registry from "../../registry.generated";

describe("external-thin: registry.generated = 실제 component surface", () => {
	const exportsList = Object.entries(registry).filter(([key]) => key !== "default");

	it("registry가 비어 있지 않다", () => {
		expect(exportsList.length).toBeGreaterThan(0);
	});

	it("모든 export가 함수형 React component다", () => {
		const nonComponent = exportsList
			.filter(([, value]) => typeof value !== "function")
			.map(([key]) => key);
		expect(nonComponent).toEqual([]);
	});

	it("composite behavior dedup이 적용돼 49개보다 적다(중복 제거)", () => {
		// 49 composite + area/region/screen canonical → 전체 entry(83)보다 훨씬 적어야 한다.
		expect(exportsList.length).toBeLessThan(60);
	});
});
