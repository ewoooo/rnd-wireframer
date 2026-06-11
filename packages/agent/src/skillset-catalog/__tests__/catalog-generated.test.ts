import { describe, expect, it } from "vitest";
import { collect } from "../../../../../scripts/sync-skillset-catalog/index";
import { AGENT_SKILLSET_CATALOG } from "../catalog.generated";

describe("skillset catalog.generated 무결성", () => {
	it("카탈로그가 비어 있지 않고 모든 task가 documents를 가진다", () => {
		const tasks = Object.keys(AGENT_SKILLSET_CATALOG);
		expect(tasks.length).toBeGreaterThan(0);
		for (const task of tasks) {
			expect(
				AGENT_SKILLSET_CATALOG[task as keyof typeof AGENT_SKILLSET_CATALOG].documents.length,
			).toBeGreaterThan(0);
		}
	});

	it("모든 document가 ../docs/ 상대경로 sourceRef를 가진다", () => {
		for (const entry of Object.values(AGENT_SKILLSET_CATALOG)) {
			expect(entry.documents.every((d) => d.sourceRef.startsWith("../docs/"))).toBe(true);
		}
	});

	it("커밋된 생성물이 소스 매니페스트 재수집 결과와 일치한다 (drift 가드)", () => {
		// 텍스트가 아니라 파싱된 데이터를 비교 — biome 포맷 차이에 영향받지 않는다.
		expect(AGENT_SKILLSET_CATALOG).toEqual(collect());
	});
});
