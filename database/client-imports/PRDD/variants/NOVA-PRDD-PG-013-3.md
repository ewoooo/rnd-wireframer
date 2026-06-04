---
화면 ID: NOVA-PRDD-PG-013-3
화면 명: 담기 완료 후 다음 행동 선택-로그인·인증 후 선택 구성 소실
화면 설명: 로그인·인증 후 선택 구성이 소실되어 재선택 없이 복원 가능한 상태로 전환한다.
화면 경로: 담기 전 유효성 재검증 > 담기 실행과 상태 저장 > 담기 완료 후 다음 행동 선택
구현 유형: PG
관련 정책 그룹: PG-PRDD-SAVE-001, PG-PRDD-COMBO-001, PG-PRDD-CATALOG-001, PG-PRDD-FAIL-001, PG-PRDD-OPTION-001
관련 유즈케이스: US-PRDD-CUS-004
관련 기능: FN-PRDD-NEXT-001, FN-PRDD-SHARE-001, FN-PRDD-CTA-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 담기 완료 후 행동 분기 영역 | vertical | 항상 | 유형(노출 여부), 개수 | 1 | N | 1 | 기본값 표시 |
| 2 | dynamic | 공유·딥링크·원위치 복귀 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 0 | N | 3 | 오류 항목 미노출 |
| 3 | dynamic | 담기·바로결제·구독 CTA 구분 영역 | vertical | 항상 | 유형(텍스트 내용) | 1 | N | 2 | 기본값 표시 |
| 999 | dynamic | 화면 하단 액션 영역 | vertical | 항상 | 유형(노출 여부) | 1 | 1 | - | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 로그인·인증 후 복귀 시 선택 구성 소실 | [영역 2] 이전 선택 구성 복원 안내 표시 | apiCall |
| TwoButton | 선택 구성 복원 후 다음 행동 선택 가능 | ActionButton main·secondary 슬롯 활성 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | - | onClick | navigate | NOVA-PRDD-PG-012-0 |title: 담기 완료 후 다음 행동 선택 | - (static) | - |
| 1 | 1 | ButtonContinueExplore | 계속 탐색 행동 선택 | Button | secondary | onClick | navigate | NOVA-PRDD-PG-010-0 |label: 계속 탐색하기 | 계속 탐색 전환값 (api:FN-PRDD-NEXT-001)<br>다음 행동 (policy:PI-PRDD-SAVE-001-02) | [정책:PI-PRDD-SAVE-001-02] 다음 행동 |
| 1 | 2 | ButtonCompareContinue | 비교 계속하기 행동 선택 | Button | secondary | onClick | navigate | NOVA-PRDD-PG-009-0 |label: 비교 계속하기 | 계속 탐색 전환값 (api:FN-PRDD-NEXT-001)<br>다음 행동 (policy:PI-PRDD-SAVE-001-02) | [정책:PI-PRDD-SAVE-001-02] 다음 행동 |
| 2 | 1 | CalloutInstallGuide | 앱 미설치 시 설치 유도 안내 | Callout | - | - | - | - |title: 앱에서 이어서 진행하세요<br>body: 담은 구성을 그대로 이어가려면 앱 설치 후 동일 화면으로 복귀합니다. | 상품 상세 조회와 비교·담기 전환 이력 (api:FN-PRDD-SHARE-001) | - |
| 2 | 2 | CalloutSelectionRestore | 인증 후 원위치 선택 복원 안내 | Callout | - | - | - | - |title: 이전 선택을 복원했습니다<br>body: 인증 완료 후 선택한 상품, 옵션, 비교 조건을 다시 불러왔습니다. | 선택 복원 (policy:PI-PRDD-FAIL-001-03) | [정책:PI-PRDD-FAIL-001-03] 인증 복귀 |
| 3 | 1 | ListTextCtaTypeJudge | 상품 유형별 CTA 유형 판정 안내 | ListText | on | - | - | - |title: 진행 유형<br>subText: {CTA유형} (예: 담기 / 바로 결제 / 구독) | 장바구니·주문 전환 대상 정보 (api:FN-PRDD-CTA-001)<br>CTA 의미 구분 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 3 | 2 | ListTextNextStepGuide | 선택 행동별 다음 단계 설명 | ListText | dot | - | - | - |title: {다음단계설명} (예: 장바구니에서 결제 준비를 이어갑니다) | 장바구니·주문 전환 대상 정보 (api:FN-PRDD-CTA-001)<br>CTA 의미 구분 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 3 | 3 | ListTextProductTypeDistinguish | 단품·복합상품 구분 안내 | ListText | dot | - | - | - |title: {상품유형} (예: 복합상품 — 요금제 포함 구성) | 상품 관계 (api:FN-PRDD-CATALOG-001) | - |
| 3 | 4 | CalloutSubscriptionConvert | 구독 전환 안내 | Callout | - | - | - | - |title: 구독으로 진행됩니다<br>body: 구독하기는 장바구니 또는 신청 준비 단계로 이동하며 바로 결제와 구분됩니다. | 구독 전환 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 999 | 1 | ActionButton | 담기 완료 후 주문 진입 진행 CTA | ActionButton | default | onClick<br>onClick | navigate<br>navigate | NOVA-PRDD-PG-014-0<br>NOVA-PRDD-PG-014-0 | main: 장바구니 이동<br>secondary: 바로 신청 | 장바구니·주문 전환 대상 정보 (api:FN-PRDD-NEXT-001) | [정책:PI-PRDD-SAVE-001-03] 주문 전환 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-013-0 | 담기 완료 후 다음 행동 선택 | 로그인·인증 후 선택 구성 소실 해소 후 | - | - |
