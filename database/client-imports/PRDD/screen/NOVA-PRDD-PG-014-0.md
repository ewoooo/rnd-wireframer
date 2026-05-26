---
화면 ID: NOVA-PRDD-PG-014-0
화면 명: 장바구니·주문 진입 연결
화면 설명: 담기 완료 구성을 장바구니 또는 주문 전환으로 연결하고 최신 조건 재검증 기준을 유지한다.
화면 경로: 담기 전 유효성 재검증 > 담기 실행과 상태 저장 > 담기 완료 후 다음 행동 선택 > 장바구니·주문 진입 연결
구현 유형: PG
관련 정책 그룹: PG-PRDD-SAVE-001, PG-PRDD-COMBO-001, PG-PRDD-CATALOG-001, PG-PRDD-FAIL-001, PG-PRDD-OPTION-001
관련 유즈케이스: US-PRDD-CUS-004
관련 기능: FN-PRDD-NEXT-001, FN-PRDD-CATALOG-001, FN-PRDD-CTA-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 담기 완료 후 행동 분기 영역 | vertical | 항상 | 유형(노출 여부), 개수 | 1 | N | 2 | 기본값 표시 |
| 2 | dynamic | 상품 카탈로그 연동 조립 영역 | vertical | 항상 | 유형(텍스트 내용), 순서 | 1 | N | 1 | 영역 전체 숨김 |
| 3 | dynamic | 담기·바로결제·구독 CTA 구분 영역 | vertical | 항상 | 유형(텍스트 내용) | 1 | N | 3 | 기본값 표시 |
| 999 | dynamic | 화면 하단 액션 영역 | vertical | 항상 | 유형(노출 여부) | 1 | 1 | - | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 화면 진입 정상 | 진입 구성·CTA 안내 영역 기본 표시 | apiCall |
| loading | API 호출 | skeleton 표시 | - |
| error | 외부채널·Product Catalog 연동 장애 | [영역 2] 보조 안내로 전환 + 표시 제한 | apiCall |
| blocked | 재검증 실패 | [영역 999] 주문 전환 CTA disabled + 담기 완료 상태 유지 | setState |
| TwoButton | 진입 구성 확정 표시 | ActionButton main·secondary 슬롯 활성 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | - | onClick | navigate | NOVA-PRDD-PG-013-0 |title: 장바구니·주문 진입 연결 | - (static) | - |
| 1 | 1 | ButtonContinueExplore | 계속 탐색 행동 선택 | Button | secondary | onClick | navigate | NOVA-PRDD-PG-010-0 |label: 계속 탐색하기 | 계속 탐색 전환값 (api:FN-PRDD-NEXT-001)<br>다음 행동 (policy:PI-PRDD-SAVE-001-02) | [정책:PI-PRDD-SAVE-001-02] 다음 행동 |
| 1 | 2 | ButtonCompareContinue | 비교 계속하기 행동 선택 | Button | secondary | onClick | navigate | NOVA-PRDD-PG-009-0 |label: 비교 계속하기 | 계속 탐색 전환값 (api:FN-PRDD-NEXT-001)<br>다음 행동 (policy:PI-PRDD-SAVE-001-02) | [정책:PI-PRDD-SAVE-001-02] 다음 행동 |
| 2 | 1 | ListTextProductInfo | Product Catalog 기준 상품 정보 표시 | ListText | on | - | - | - |title: {상품정보항목} (예: 판매 상태)<br>subText: {상품정보값} (예: 판매 가능) | 장바구니·주문 진입 구성 정보 (api:FN-PRDD-CATALOG-001)<br>상품 I/F (policy:PI-PRDD-CATALOG-001-01) | [정책:PI-PRDD-CATALOG-001-01] 상품 I/F |
| 2 | 2 | ListTextProductRelation | 상품 관계 판정 결과 표시 | ListText | dot | - | - | - |title: {상품관계} (예: 동시 가입 가능 구성) | 상품 관계 판정 결과 (api:FN-PRDD-CATALOG-001)<br>상품 관계 (policy:PI-PRDD-CATALOG-001-03) | [정책:PI-PRDD-CATALOG-001-03] 상품 관계 |
| 3 | 1 | ListTextCtaTypeJudge | 상품 유형별 CTA 유형 판정 안내 | ListText | on | - | - | - |title: 진행 유형<br>subText: {CTA유형} (예: 담기 / 바로 결제 / 구독) | 장바구니·주문 전환 대상 정보 (api:FN-PRDD-CTA-001)<br>CTA 의미 구분 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 3 | 2 | ListTextNextStepGuide | 선택 행동별 다음 단계 설명 | ListText | dot | - | - | - |title: {다음단계설명} (예: 장바구니에서 결제 준비를 이어갑니다) | 장바구니·주문 전환 대상 정보 (api:FN-PRDD-CTA-001)<br>CTA 의미 구분 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 3 | 3 | ListTextProductTypeDistinguish | 단품·복합상품 구분 안내 | ListText | dot | - | - | - |title: {상품유형} (예: 복합상품 — 요금제 포함 구성) | 상품 관계 (api:FN-PRDD-CATALOG-001) | - |
| 3 | 4 | CalloutSubscriptionConvert | 구독 전환 안내 | Callout | - | - | - | - |title: 구독으로 진행됩니다<br>body: 구독하기는 장바구니 또는 신청 준비 단계로 이동하며 바로 결제와 구분됩니다. | 구독 전환 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 999 | 1 | ActionButton | 장바구니·주문 진입 연결 종결 CTA | ActionButton | default | onClick<br>onClick | apiCall<br>apiCall | -<br>- | main: 장바구니로 이동<br>secondary: 주문 신청하기 | 장바구니·주문 진입 구성 정보 (api:FN-PRDD-CATALOG-001)<br>재검증 (policy:PI-PRDD-SAVE-001-04) | [정책:PI-PRDD-SAVE-001-03] 주문 전환<br>[정책:PI-PRDD-SAVE-001-04] 재검증 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 케이스 분기 | NOVA-PRDD-PG-014-1 | 장바구니·주문 진입 연결-재고·판매 상태·가입 조건 미확정 | 재고·판매 상태·가입 조건 미확정 | - | 보완 가능 항목 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-014-2 | 장바구니·주문 진입 연결-선택 조합 충돌 | 선택 조합 충돌 발생 | - | 충돌 항목만 수정 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-014-3 | 장바구니·주문 진입 연결-로그인·인증 후 선택 구성 소실 | 로그인·인증 후 선택 구성 소실 | - | 선택 구성 복원 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-014-E1 | 장바구니·주문 진입 연결-외부채널·Product Catalog 연동 장애 | 외부채널·Product Catalog 연동 장애 발생 | - | 보조 안내로 전환 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-014-E2 | 장바구니·주문 진입 연결-재검증 실패 | 진입 전 재검증 실패 | - | 담기 완료 상태 유지·주문 전환 제한 후 화면 유지 |
