---
화면 ID: NOVA-PRDD-PG-005-E1
화면 명: 비교 컴포넌트로 대안 비교-내부 운영 코드·원장 필드명 노출
화면 설명: 내부 운영 코드나 원장 필드명이 고객 문구로 노출되면 배포를 제한하고 노출을 차단한다.
화면 경로: 고객 상태 기반 적합성 파악 > 비교 컴포넌트로 대안 비교
구현 유형: PG
관련 정책 그룹: PG-PRDD-COMPARE-001, PG-PRDD-PRICE-001, PG-PRDD-OPS-001
관련 유즈케이스: US-PRDD-CUS-002
관련 기능: FN-PRDD-COMPARE-001, FN-PRDD-PRICE-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 상품 비교 기준 적용 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용), 순서, 개수 | 1 | N | 1 | 오류 항목 미노출 |
| 2 | dynamic | 예상 부담·혜택 요약 계산 영역 | vertical | 항상 | 유형(텍스트 내용) | 1 | N | 2 | 기본값 표시 |
| 999 | static | 화면 하단 액션 영역 | horizontal | 항상 | - | - | - | - | - |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 화면 진입 정상 (내부 운영 코드·원장 필드명 노출 감지 상태) | [영역 1] Callout 오류 안내 노출, 해당 문구 노출 차단·배포 제한 | apiCall |
| OneButton | 노출 차단 확인 후 CTA 1개 활성 | [영역 999] ActionButton main 슬롯 활성 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|----------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-005-0 | title: 비교 컴포넌트로 대안 비교 | - (static) | - |
| 1 | 1 | TitleSectionCompare | 상품 비교 기준 영역 제목 | TitleSection | Default | - | - | - | title: 상품 비교 기준 | - (static) | - |
| 1 | 2 | ChipCompareAttribute | 비교 속성 선택 | Chip | - | onClick | setState | selectedCompareAttribute | label: {비교 속성} (예: 월 요금) | selectedCompareAttribute (state)<br>상품군별 표준 속성 (policy:PI-PRDD-COMPARE-001-01) | [정책:PI-PRDD-COMPARE-001-01] 비교 기준 |
| 1 | 3 | ListProductRowCompareSet | 기본 비교세트 표시 | ListProductRow | - | onClick | navigate | NOVA-PRDD-PG-006-0 | - | 고객용 상품 요약과 상세 섹션 노출 결과 (api:FN-PRDD-COMPARE-001) | [정책:PI-PRDD-COMPARE-001-06] 상품군별 비교 템플릿 |
| 1 | 4 | TextFieldCustomerCriteria | 고객 기준값 조건 수정 입력 | TextField | default | onChange | setState | customerCriteriaValue | label: 내 조건 입력<br>Placeholder: 데이터 사용량·예산 등 입력<br>helperText: 조건을 수정하면 비교 결과가 다시 산정됩니다 | customerCriteriaValue (state) | [정책:PI-PRDD-COMPARE-001-06] 상품군별 비교 템플릿 |
| 1 | 5 | CardContentsFilledPlanCompare | 요금제 비교표 (내부 문구 노출 차단) | CardContentsFilled | - | - | - | - | titleText: 요금제 비교 — 일부 항목 점검 중 | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-COMPARE-001)<br>고객 문구 노출 제한 기준 (policy:PI-PRDD-CATALOG-001-04) | [정책:PI-PRDD-CATALOG-001-04] 정책 수신 |
| 2 | 1 | TitleSectionPrice | 예상 부담·혜택 요약 영역 제목 | TitleSection | Default | - | - | - | title: 예상 부담·혜택 요약 | - (static) | - |
| 2 | 2 | CardSummaryMonthlyEstimate | 월 예상액 요약 | CardSummary | text | - | - | - | title: 월 예상액<br>subText: {월 예상 금액} (예: 월 55,000원) | 고객용 상품 요약 (api:FN-PRDD-PRICE-001)<br>월 기준 금액 (policy:PI-PRDD-PRICE-001-01) | [정책:PI-PRDD-PRICE-001-01] 가격 기준 |
| 2 | 3 | ListTextOneTimeCost | 1회성 비용 표시 | ListText | on | - | - | - | title: 1회성 비용<br>subText: {1회성 비용 금액} (예: 12,000원) | 고객용 상품 요약 (api:FN-PRDD-PRICE-001)<br>1회성 비용 (policy:PI-PRDD-PRICE-001-01) | [정책:PI-PRDD-PRICE-001-01] 가격 기준 |
| 2 | 4 | ListTextExcludedBenefit | 제외 혜택 표시 | ListText | dot | - | - | - | title: {제외 혜택명} (예: 제휴카드 할인)<br>subText: {제외 사유} (예: 중복 적용 불가) | 미노출·대체 안내 사유 (api:FN-PRDD-PRICE-001)<br>제외 사유 (policy:PI-PRDD-PRICE-001-02) | [정책:PI-PRDD-PRICE-001-02] 혜택 분리 |
| 2 | 5 | AccordionPriceInfoSubsidy | 공시지원금 비교 펼침 | AccordionPriceInfo | default | onClick | setState | isSubsidyAccordionOpen | priceText: 공시지원금·선택약정 비교 | 출고가·공시지원금·선택약정 적용가 (api:FN-PRDD-PRICE-001)<br>공시지원금 고지 기준 (policy:PI-PRDD-PRICE-001-03) | [정책:PI-PRDD-PRICE-001-03] 공시지원금 |
| 999 | 1 | ActionButton | 화면 하단 진행 CTA | ActionButton | default | onClick | navigate | main: NOVA-PRDD-PG-005-0 | main: 점검 후 비교 다시 보기 | - (static) | [정책:PI-PRDD-OPS-001-02] 영향도 확인 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-005-0 | 비교 컴포넌트로 대안 비교 | 내부 운영 코드·원장 필드명 노출 해소 후 | - | - |
