---
화면 ID: NOVA-PRDD-PG-004-E1
화면 명: 고객 상태 기반 적합성 파악-재고·판매 상태·가입 조건 미확정
화면 설명: 재고·판매 상태·가입 조건이 미확정이면 담기를 확정하지 않고 보완 가능한 항목을 안내한다.
화면 경로: 고객 상태 기반 적합성 파악
구현 유형: PG
관련 정책 그룹: PG-PRDD-ELIG-001, PG-PRDD-CATALOG-001, PG-PRDD-COMBO-001
관련 유즈케이스: US-PRDD-CUS-002
관련 기능: FN-PRDD-ELIG-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 고객 상태·가입 조건 판정 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용), 개수 | 1 | N | 1 | 영역 전체 숨김 |
| 999 | static | 화면 하단 액션 영역 | horizontal | 항상 | - | - | - | - | - |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 화면 진입 정상 (재고·판매 상태·가입 조건 미확정 상태) | [영역 1] Callout 오류 안내 노출, 담기 확정 제한 + 후속 CTA disabled | apiCall |
| OneButton | 보완 항목 확인 후 CTA 1개 활성 | [영역 999] ActionButton main 슬롯 활성 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|----------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-004-0 | title: 고객 상태 기반 적합성 파악 | - (static) | - |
| 1 | 1 | ListTextEligibility | 미확정 가입 조건 항목 표시 | ListText | dot | - | - | - | title: {가입 조건 항목} (예: 재고 상태)<br>subText: {판정 결과} (예: 확인 필요) | 담기 가능 여부와 선택 구성 상태 (api:FN-PRDD-ELIG-001)<br>가입 조건 항목 (policy:PI-PRDD-COMBO-001-04) | [정책:PI-PRDD-COMBO-001-04] 담기 판정 |
| 1 | 2 | CalloutRestrictionReason | 담기 확정 제한·보완 항목 안내 | Callout | WithTitle | - | - | - | title: 담기 확정 전 보완이 필요합니다<br>body: 재고·판매 상태·가입 조건이 미확정이라 담기를 확정하지 않았습니다. 보완 가능한 항목을 확인해 주세요. | 제한 사유 (api:FN-PRDD-ELIG-001)<br>불가 사유·해결 방법 (policy:PI-PRDD-ELIG-001-02) | [정책:PI-PRDD-ELIG-001-02] 불가 사유 |
| 1 | 3 | ButtonAlternativePath | 보완 항목 확인 진행 | Button | secondary | onClick | setState | restrictionReviewOpen | label: 보완 항목 확인하기 | restrictionReviewOpen (state) | [정책:PI-PRDD-COMBO-001-04] 담기 판정 |
| 999 | 1 | ActionButton | 화면 하단 진행 CTA | ActionButton | default | onClick | navigate | main: NOVA-PRDD-PG-004-0 | main: 보완 후 다시 확인 | - (static) | [정책:PI-PRDD-SAVE-001-06] 고객 표시 상태와 내부 상태 구분 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-004-0 | 고객 상태 기반 적합성 파악 | 재고·판매 상태·가입 조건 미확정 해소 후 | - | - |
