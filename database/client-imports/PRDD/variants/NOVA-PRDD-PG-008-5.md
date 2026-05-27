---
화면 ID: NOVA-PRDD-PG-008-5
화면 명: 가입·구매 조건 검증-선택 조합 충돌
화면 설명: 선택 조합 충돌 (조합 충돌) — 전체 초기화가 아니라 충돌 항목만 수정하도록 한다
화면 경로: 옵션·구성 선택 > 가입·구매 조건 검증
구현 유형: PG
관련 정책 그룹: PG-PRDD-ELIG-001, PG-PRDD-COMBO-001, PG-PRDD-CATALOG-001, PG-PRDD-FAIL-001
관련 유즈케이스: US-PRDD-CUS-003
관련 기능: FN-PRDD-ELIG-001, FN-PRDD-COMBO-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 고객 상태·가입 조건 판정 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 0 | N | 1 | 영역 전체 숨김 |
| 2 | dynamic | 상품 조합·프로그램 유효성 검증 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 0 | N | 2 | 영역 전체 숨김 |
| 999 | dynamic | 화면 하단 액션 영역 | horizontal | 항상 | 유형(노출 여부) | 1 | 1 | 3 | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|---|---|---|---|
| default | 화면 진입 시 선택 조합 충돌 상태 | 전체 초기화가 아니라 충돌 항목만 수정하도록 한다 — 보완 항목 강조 + Callout 안내 노출 | setState |
| loading | API 호출 | skeleton 표시 | - |
| error | 가입 조건 불충족·판매 중지 등 검증 실패 발생 | [영역 2] Callout 불가 사유 안내 노출 | apiCall |
| blocked | 선택 조합 충돌·필수 구성 누락으로 진행 불가 | [영역 1] 보완 경로 강조 + [영역 999] CTA disabled | setState |
| OneButton | 화면 하단 CTA 1개 활성 | [영역 999] ActionButton main 슬롯 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-007-0 | title: 가입·구매 조건 검증 | - (static) | - |
| 1 | 1 | TitleSectionEligibility | 가입 조건 판정 섹션 헤더 | TitleSection | Default | - | - | - | subtitle: 조건 검증<br>title: 가입 가능성 확인 | - (static) | - |
| 1 | 2 | ListTextAlternativePath | 대체 경로 안내 | ListText | secondTitle | onClick | navigate | NOVA-PRDD-PG-009-0 | title: {대체 경로명} (예: 조건 충족 방법 보기) | 대체 가능 경로 (api:FN-PRDD-ELIG-001)<br>불가 사유와 해결 방법 (policy:PI-PRDD-ELIG-001-02) | [정책:PI-PRDD-ELIG-001-02] 불가 사유<br>[정책:PI-PRDD-ELIG-001-01] 사전 판정 |
| 2 | 1 | CalloutComboValidation | 동시 주문·필수 구성·중복가입 확인 안내 | Callout | WithTitle | - | - | - | title: 담기 조건 확인<br>body: {제한 사유} (예: 중복 가입 불가 상품) | 담기 가능 여부와 제한 사유 (api:FN-PRDD-COMBO-001)<br>중복가입 제한 사유 (policy:PI-PRDD-COMBO-001-02) | [정책:PI-PRDD-COMBO-001-02] 중복가입 가능여부 확인<br>[정책:PI-PRDD-COMBO-001-03] 필수 구성<br>[정책:PI-PRDD-COMBO-001-04] 담기 판정 |
| 2 | 2 | ListSelectedGroupProduct | 그룹상품 선택 | ListSelected | checkbox | onChange | setState | selectedGroupProduct | CheckboxText: {그룹 구성 상품명} (예: 결합 부가서비스) | 그룹 상품 구성 (api:FN-PRDD-COMBO-001)<br>필수·선택 구성 구분 (policy:PI-PRDD-OPTION-001-03)<br>selectedGroupProduct (state) | [정책:PI-PRDD-OPTION-001-03] 그룹 상품 |
| 999 | 1 | ActionButtonNext | 예상 비용·혜택 요약 단계 진행 CTA | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-009-0 | main: 다음 단계로 | - (static) | [정책:PI-PRDD-COMBO-001-04] 담기 판정 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|---|---|---|---|---|---|
| 화면 전환 | NOVA-PRDD-PG-008-0 | 가입·구매 조건 검증 | 선택 조합 충돌 해소 후 | - | - |
