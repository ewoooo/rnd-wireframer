import { describe, expect, it } from "vitest";

import { parsePrddMarkdown } from "../register/prdd-parser";

const SAMPLE_PRDD = `---
화면 ID: NOVA-PRDD-PG-011-5
화면 명: 담기 전 유효성 재검증-로그인·인증 후 선택 구성 소실
화면 설명: 로그인·인증 후 선택 구성이 소실되어 재선택 없이 복원 가능한 상태로 전환한다.
화면 경로: 담기 전 유효성 재검증
구현 유형: PG
관련 정책 그룹: PG-PRDD-SAVE-001, PG-PRDD-COMBO-001
관련 유즈케이스: US-PRDD-CUS-004
관련 기능: FN-PRDD-SAVE-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 담기 실행·상태 저장 영역 | vertical | 항상 | 유형 | 1 | 1 | 1 | 영역 전체 숨김 |
| 999 | dynamic | 화면 하단 액션 영역 | vertical | 항상 | 유형 | 1 | 1 | - | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 로그인·인증 후 복귀 시 선택 구성 소실 | [영역 2,3] 이전 선택 구성 복원 표시 | apiCall |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 상단 네비 | AppBar | - | onClick | navigate | NOVA-PRDD-PG-010-0 | title: 담기 전 | - (static) | - |
| 1 | 1 | CalloutRevalidation | 재검증 안내 | Callout | - | - | - | - | title: 담기 가능 여부 재확인<br>body: 가격·혜택·재고 변경 시 비교 표시 | 담기 이력 (api:FN-PRDD-SAVE-001)<br>재검증 (policy:PI-PRDD-SAVE-001-04) | [정책:PI-PRDD-SAVE-001-04] 재검증<br>[정책:PI-PRDD-COMBO-001-04] 담기 판정 |
| 999 | 1 | ActionButton | 담기 실행 | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-012-0 | main: 담기 실행 계속하기 | 담기 가능 여부 (api:FN-PRDD-SAVE-001) | [정책:PI-PRDD-SAVE-001-04] 재검증 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-011-0 | 담기 전 유효성 재검증 | 해소 후 | - | - |
`;

describe("parsePrddMarkdown", () => {
	const doc = parsePrddMarkdown(SAMPLE_PRDD);

	it("parses frontmatter meta", () => {
		expect(doc.meta.screenId).toBe("NOVA-PRDD-PG-011-5");
		expect(doc.meta.screenName).toContain("재검증");
		expect(doc.meta.policyGroups).toEqual(["PG-PRDD-SAVE-001", "PG-PRDD-COMBO-001"]);
		expect(doc.meta.useCases).toEqual(["US-PRDD-CUS-004"]);
		expect(doc.meta.version).toBe("1.00");
	});

	it("parses area rows including 0 and 999", () => {
		expect(doc.areas).toHaveLength(3);
		expect(doc.areas.map((a) => a.no)).toEqual([0, 1, 999]);
		expect(doc.areas[0]?.type).toBe("static");
		expect(doc.areas[1]?.type).toBe("dynamic");
		expect(doc.areas[1]?.minCount).toBe(1);
		expect(doc.areas[1]?.maxCount).toBe(1);
		expect(doc.areas[2]?.no).toBe(999);
	});

	it("parses state rows", () => {
		expect(doc.states).toHaveLength(1);
		expect(doc.states[0]?.state).toBe("default");
		expect(doc.states[0]?.action).toBe("apiCall");
	});

	it("parses component rows with area+no", () => {
		expect(doc.components).toHaveLength(3);
		expect(doc.components.map((c) => [c.area, c.order])).toEqual([
			[0, 1],
			[1, 1],
			[999, 1],
		]);
	});

	it("parses texts as key:value record split by <br>", () => {
		const callout = doc.components.find((c) => c.componentId === "Callout");
		expect(callout?.texts).toEqual({
			title: "담기 가능 여부 재확인",
			body: "가격·혜택·재고 변경 시 비교 표시",
		});
	});

	it("parses bindings with api/policy markers", () => {
		const callout = doc.components.find((c) => c.componentId === "Callout");
		expect(callout?.bindings).toHaveLength(2);
		expect(callout?.bindings[0]?.api).toBe("FN-PRDD-SAVE-001");
		expect(callout?.bindings[1]?.policy).toBe("PI-PRDD-SAVE-001-04");
	});

	it("extracts policy tags from notes", () => {
		const callout = doc.components.find((c) => c.componentId === "Callout");
		expect(callout?.policyTags).toEqual(["PI-PRDD-SAVE-001-04", "PI-PRDD-COMBO-001-04"]);
	});

	it("parses flow rows", () => {
		expect(doc.flows).toHaveLength(1);
		expect(doc.flows[0]?.kind).toBe("화면 전환");
		expect(doc.flows[0]?.screenId).toBe("NOVA-PRDD-PG-011-0");
	});

	it("produces no warnings on well-formed input", () => {
		expect(doc.warnings).toEqual([]);
	});
});
