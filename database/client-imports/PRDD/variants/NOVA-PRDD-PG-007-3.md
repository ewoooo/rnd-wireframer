---
화면 ID: NOVA-PRDD-PG-007-3
화면 명: 옵션·구성 선택-로그인·인증 후 복귀 시 선택 구성 소실
화면 설명: 로그인·인증 후 복귀 시 선택 구성 소실 (선택 복원) — 재선택 없이 복원 가능한 상태로 전환한다
화면 경로: 옵션·구성 선택
구현 유형: PG
관련 정책 그룹: PG-PRDD-OPTION-001, PG-PRDD-COMBO-001, PG-PRDD-CATALOG-001, PG-PRDD-FAIL-001
관련 유즈케이스: US-PRDD-CUS-003
관련 기능: FN-PRDD-OPTION-001, FN-PRDD-COMBO-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 옵션·구성 선택 처리 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용), 개수 | 1 | N | 1 | 오류 항목 미노출 |
| 2 | dynamic | 상품 조합·프로그램 유효성 검증 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 0 | N | 2 | 영역 전체 숨김 |
| 999 | dynamic | 화면 하단 액션 영역 | horizontal | 항상 | 유형(노출 여부) | 1 | 1 | 3 | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|---|---|---|---|
| default | 화면 진입 시 로그인·인증 후 복귀 시 선택 구성 소실 상태 | 재선택 없이 복원 가능한 상태로 전환한다 — 보완 항목 강조 + Callout 안내 노출 | setState |
| loading | API 호출 | skeleton 표시 | - |
| error | 재고·판매 상태·가입 조건 중 하나 미확정 | [영역 2] Callout 보완 안내 노출 | apiCall |
| blocked | 선택 조합 충돌로 담기 불가 | [영역 1] 충돌 항목 강조 + [영역 999] CTA disabled | setState |
| OneButton | 화면 하단 CTA 1개 활성 | [영역 999] ActionButton main 슬롯 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-006-0 | title: 옵션·구성 선택 | - (static) | - |
| 1 | 1 | TitleSectionOption | 옵션·구성 선택 섹션 헤더 | TitleSection | Default | - | - | - | subtitle: 구성 선택<br>title: 색상·용량·약정 선택 | - (static) | - |
| 1 | 2 | OptionListColorVolume | 색상·용량 약정 선택 | OptionList | Selected | onChange | setState | selectedOption | - | 선택 옵션 (api:FN-PRDD-OPTION-001)<br>옵션 선택 즉시 재산정 (policy:PI-PRDD-OPTION-001-01) | [정책:PI-PRDD-OPTION-001-01] 옵션 선택<br>[정책:PI-PRDD-OPTION-001-04] 가격 반영 |
| 1 | 3 | ListSelectedBenefitOption | 혜택 선택 | ListSelected | checkbox | onChange | setState | selectedBenefit | CheckboxText: {혜택명} (예: 데이터 더블 혜택) | 선택형 혜택 옵션 (api:FN-PRDD-OPTION-001)<br>혜택 선택 기준 (policy:PI-PRDD-OPTION-001-02)<br>selectedBenefit (state) | [정책:PI-PRDD-OPTION-001-02] 선택형 혜택 |
| 2 | 1 | CalloutComboValidation | 동시 주문·필수 구성·중복가입 확인 안내 | Callout | WithTitle | - | - | - | title: 담기 조건 확인<br>body: {제한 사유} (예: 동시 주문 불가 조합) | 담기 가능 여부와 제한 사유 (api:FN-PRDD-COMBO-001)<br>중복가입 제한 사유 (policy:PI-PRDD-COMBO-001-02) | [정책:PI-PRDD-COMBO-001-01] 동시 주문<br>[정책:PI-PRDD-COMBO-001-02] 중복가입 가능여부 확인<br>[정책:PI-PRDD-COMBO-001-03] 필수 구성 |
| 2 | 2 | ListSelectedGroupProduct | 그룹상품 선택 | ListSelected | checkbox | onChange | setState | selectedGroupProduct | CheckboxText: {그룹 구성 상품명} (예: 결합 부가서비스) | 그룹 상품 구성 (api:FN-PRDD-COMBO-001)<br>필수·선택 구성 구분 (policy:PI-PRDD-OPTION-001-03)<br>selectedGroupProduct (state) | [정책:PI-PRDD-OPTION-001-03] 그룹 상품 |
| 999 | 1 | ActionButtonNext | 가입·구매 조건 검증 단계 진행 CTA | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-008-0 | main: 다음 단계로 | - (static) | [정책:PI-PRDD-COMBO-001-04] 담기 판정 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|---|---|---|---|---|---|
| 화면 전환 | NOVA-PRDD-PG-007-0 | 옵션·구성 선택 | 로그인·인증 후 복귀 시 선택 구성 소실 해소 후 | - | - |
