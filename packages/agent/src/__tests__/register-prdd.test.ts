import { describe, expect, it } from "vitest";

import { parsePrddMarkdown } from "../register/prdd-parser";
import { registerPrddDocument } from "../register/register-prdd";

const SAMPLE = `---
화면 ID: NOVA-PRDD-PG-011-5
화면 명: 담기 전 유효성 재검증
화면 설명: 재검증 케이스
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
| 1 | dynamic | 담기 실행·상태 저장 영역 | vertical | 항상 | 유형 | 1 | 1 | 1 | 영역 전체 숨김 |
| 2 | dynamic | 재고·수량 영역 | vertical | 항상 | 유형, 개수 | 0 | N | 2 | 오류 항목 미노출 |
| 999 | dynamic | 화면 하단 액션 영역 | vertical | 항상 | 유형 | 1 | 1 | - | 기본값 표시 |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 상단 네비 | AppBar | - | onClick | navigate | NOVA-PRDD-PG-010-0 | title: 담기 전 | - (static) | - |
| 1 | 1 | CalloutRevalidation | 재검증 안내 | Callout | - | - | - | - | title: 담기 가능 여부 재확인 | (api:FN-PRDD-SAVE-001) | [정책:PI-PRDD-SAVE-001-04] 재검증 |
| 1 | 2 | ButtonSaveCtaSelect | CTA | Button | primary | onClick | apiCall | - | label: 담기 | - | [정책:PI-PRDD-SAVE-001-05] CTA |
| 2 | 1 | ListTextStockOption | 재고 | ListText | on | - | - | - | title: 옵션 재고 | (api:FN-PRDD-INVENTORY-001) | [정책:PI-PRDD-STOCK-001-01] 재고 |
| 2 | 2 | ListTextQuantityLimit | 수량 | ListText | on | - | - | - | title: 구매 가능 수량 | - | [정책:PI-PRDD-STOCK-001-01] 재고 |
| 999 | 1 | ActionButton | 담기 실행 | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-012-0 | main: 담기 실행 | - | [정책:PI-PRDD-SAVE-001-04] 재검증 |
`;

describe("registerPrddDocument", () => {
	const parsed = parsePrddMarkdown(SAMPLE);
	const result = registerPrddDocument(parsed);

	it("classifies 영역=0 into header region", () => {
		expect(result.screen.header?.slot).toBe("header");
		expect(result.screen.header?.children).toHaveLength(1);
		expect(result.screen.header?.children[0]?.component?.type).toBe("AppBar");
	});

	it("classifies 영역>=999 into bottom region", () => {
		expect(result.screen.bottom?.slot).toBe("bottom");
		expect(result.screen.bottom?.children).toHaveLength(1);
		expect(result.screen.bottom?.children[0]?.component?.type).toBe("ActionButton");
	});

	it("classifies 영역 1~998 into contents area children", () => {
		const areas = result.screen.contents?.children ?? [];
		expect(areas.map((a) => a.key)).toEqual([1, 2]);
		expect(areas[0]?.children).toHaveLength(2);
		expect(areas[1]?.children).toHaveLength(2);
	});

	it("attaches area metadata from 화면 구성 table", () => {
		const area1 = result.screen.contents?.children[0];
		expect(area1?.areaType).toBe("dynamic");
		expect(area1?.description).toBe("담기 실행·상태 저장 영역");
		expect(area1?.layout).toBe("vertical");
		expect(area1?.minCount).toBe(1);
		expect(area1?.maxCount).toBe(1);
		expect(area1?.priority).toBe(1);
		expect(area1?.errorPolicy).toBe("영역 전체 숨김");
	});

	it("aggregates policy anchors from children", () => {
		const area1 = result.screen.contents?.children[0];
		expect(new Set(area1?.policyAnchors)).toEqual(
			new Set(["PI-PRDD-SAVE-001-04", "PI-PRDD-SAVE-001-05"]),
		);
	});

	it("assigns globally unique component IDs", () => {
		const ids = result.components.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		// 두 ListText가 다른 ID를 가져야 함 (area+order로 구분)
		expect(ids).toContain("NOVA-PRDD-PG-011-5__a2-1");
		expect(ids).toContain("NOVA-PRDD-PG-011-5__a2-2");
	});

	it("sorts area children by no. ascending", () => {
		const area1 = result.screen.contents?.children[0];
		expect(area1?.children.map((c) => c.order)).toEqual([1, 2]);
	});

	it("preserves screen meta", () => {
		expect(result.screen.id).toBe("NOVA-PRDD-PG-011-5");
		expect(result.screen.name).toBe("담기 전 유효성 재검증");
		expect(result.screen.surface).toBe("담기 전 유효성 재검증");
	});

	it("keeps deprecated areas field empty for PRDD-sourced screens", () => {
		expect(result.screen.areas).toEqual([]);
	});

	it("produces no warnings for well-formed input", () => {
		expect(result.warnings).toEqual([]);
	});
});
