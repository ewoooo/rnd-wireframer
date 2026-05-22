import { describe, expect, it } from "vitest";

import { composePrddScreen } from "../compose/compose-prdd";
import { materializePrddScreenToTables } from "../database/prdd-to-database-tables";
import { decoratePrddScreen } from "../decorate/decorate-prdd";
import { parsePrddMarkdown } from "../register/prdd-parser";
import { registerPrddDocument } from "../register/register-prdd";

const SAMPLE = `---
화면 ID: NOVA-PRDD-PG-011-5
화면 명: 담기 전 유효성 재검증
화면 설명: 재검증
화면 경로: 담기 전 유효성 재검증
구현 유형: PG
관련 정책 그룹: PG-PRDD-SAVE-001
관련 유즈케이스: -
관련 기능: -
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 담기 실행 영역 | vertical | 항상 | 유형 | 1 | 1 | 1 | 영역 전체 숨김 |
| 999 | dynamic | 화면 하단 액션 영역 | vertical | 항상 | 유형 | 1 | 1 | - | 기본값 표시 |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 상단 네비 | AppBar | - | onClick | navigate | NOVA-PRDD-PG-010-0 | title: 담기 전 | - | - |
| 1 | 1 | CalloutRevalidation | 재검증 안내 | Callout | - | - | - | - | title: 담기 가능 여부 재확인 | - | [정책:PI-PRDD-SAVE-001-04] 재검증 |
| 999 | 1 | ActionButton | 담기 실행 | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-012-0 | main: 담기 실행 | - | [정책:PI-PRDD-SAVE-001-04] 재검증 |
`;

describe("PRDD pipeline e2e (parse → register → compose → decorate → tables)", () => {
	const parsed = parsePrddMarkdown(SAMPLE);
	const registered = registerPrddDocument(parsed);
	const composed = composePrddScreen(registered);
	const decorated = decoratePrddScreen(composed);
	const tables = materializePrddScreenToTables(decorated, {
		now: () => "2026-05-22T00:00:00.000Z",
		screenVariantId: "main",
	});

	it("flows through all 5 stages without warnings", () => {
		expect(parsed.warnings).toEqual([]);
		expect(registered.warnings).toEqual([]);
		expect(composed.warnings).toEqual([]);
		expect(decorated.warnings).toEqual([]);
		expect(tables.warnings).toEqual([]);
	});

	it("decorated screen has region patterns at each slot", () => {
		expect(decorated.header.pattern.id).toBe("region-header");
		expect(decorated.contents.pattern.id).toBe("region-contents");
		expect(decorated.bottom.pattern.id).toBe("region-bottom");
	});

	it("decorated area has area pattern", () => {
		expect(decorated.areas).toHaveLength(1);
		const area = decorated.areas[0];
		expect(area?.pattern.id).toMatch(/^area-/);
		expect(area?.key).toBe(1);
	});

	it("DB screen row has 3 regions with correct child kinds", () => {
		expect(tables.screen.screen.regions.header.children).toEqual([
			{ kind: "composite", id: "NOVA-PRDD-PG-011-5__a0-1" },
		]);
		expect(tables.screen.screen.regions.contents.children).toEqual([
			{ kind: "area", id: "NOVA-PRDD-PG-011-5__area1" },
		]);
		expect(tables.screen.screen.regions.bottom.children).toEqual([
			{ kind: "composite", id: "NOVA-PRDD-PG-011-5__a999-1" },
		]);
	});

	it("DB area row preserves PRDD metadata", () => {
		expect(tables.areas).toHaveLength(1);
		const areaRow = tables.areas[0];
		expect(areaRow?.type).toBe("Area");
		expect(areaRow?.key).toBe(1);
		expect(areaRow?.props.areaType).toBe("dynamic");
		expect(areaRow?.props.layout).toBe("vertical");
		expect(areaRow?.props.errorPolicy).toBe("영역 전체 숨김");
		expect(areaRow?.props.policyAnchors).toEqual(["PI-PRDD-SAVE-001-04"]);
		expect(areaRow?.children).toEqual([
			{ kind: "composite", id: "NOVA-PRDD-PG-011-5__a1-1" },
		]);
	});

	it("DB component rows include header/area/bottom components", () => {
		const ids = tables.components.map((c) => c.id);
		expect(ids).toContain("NOVA-PRDD-PG-011-5__a0-1");
		expect(ids).toContain("NOVA-PRDD-PG-011-5__a1-1");
		expect(ids).toContain("NOVA-PRDD-PG-011-5__a999-1");
		expect(tables.components).toHaveLength(3);
	});
});
