---
화면 ID: NOVA-PRDD-PG-009-0
화면 명: 예상 비용·혜택 요약
화면 설명: 고객이 담기 전 예상 월 이용금액, 1회성 비용, 적용·제외 혜택, 주요 유의사항을 확인한다.
화면 경로: 옵션·구성 선택 > 가입·구매 조건 검증 > 예상 비용·혜택 요약
구현 유형: PG
관련 정책 그룹: PG-PRDD-COMPARE-001, PG-PRDD-PRICE-001, PG-PRDD-SAVE-001
관련 유즈케이스: US-PRDD-CUS-003
관련 기능: FN-PRDD-PRICE-001, FN-PRDD-BENEFIT-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 예상 부담·혜택 요약 계산 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 1 | N | 1 | 기본값 표시 |
| 2 | dynamic | 혜택·가격·가치 산정 표시 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용), 개수 | 1 | N | 2 | 오류 항목 미노출 |
| 999 | dynamic | 화면 하단 액션 영역 | horizontal | 항상 | 유형(노출 여부) | 1 | 1 | 3 | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|---|---|---|---|
| default | 화면 진입 정상 | 예상 비용 요약과 혜택 산정 결과 기본 표시 | apiCall |
| loading | API 호출 | skeleton 표시 | - |
| error | 혜택 산정 결과 원장·프로모션 기간 불일치 | [영역 1] 예상 금액 표시 보류 + Callout 안내 노출 | apiCall |
| empty | 상품 기준 정보 누락으로 산정 불가 | [영역 2] 보완 필요·상담 가능 경로 안내 | - |
| OneButton | 화면 하단 CTA 1개 활성 | [영역 999] ActionButton main 슬롯 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-008-0 | title: 예상 비용·혜택 요약 | - (static) | - |
| 1 | 1 | TitleSectionEstimate | 예상 비용 요약 섹션 헤더 | TitleSection | Default | - | - | - | subtitle: 담기 전 확인<br>title: 예상 부담·혜택 요약 | - (static) | - |
| 1 | 2 | CardSummaryMonthlyEstimate | 월 예상액 요약 | CardSummary | text | - | - | - | title: 월 예상 이용금액<br>subText: {월 예상액} (예: 월 55,000원) | 월 예상액 (api:FN-PRDD-PRICE-001)<br>가격 기준 구분 (policy:PI-PRDD-PRICE-001-01) | [정책:PI-PRDD-PRICE-001-01] 가격 기준 |
| 1 | 3 | ListTextExcludedBenefit | 제외 혜택 안내 | ListText | dot | - | - | - | title: {제외 혜택명} (예: 제휴카드 할인 미적용)<br>subText: {제외 사유} | 혜택 제외 사유 (api:FN-PRDD-PRICE-001)<br>혜택별 제외 사유 분리 (policy:PI-PRDD-PRICE-001-02) | [정책:PI-PRDD-PRICE-001-02] 혜택 분리 |
| 2 | 1 | ProductInfoHorizontalListPrice | 정가·할인가 표시 | ProductInfoHorizontal | Default | - | - | - | subtitle: 정가<br>mainText: {정가} (예: 1,200,000원)<br>discountLabel: 할인<br>discountAmount: - {할인금액} (예: - 200,000원) | 정가·할인가 (api:FN-PRDD-BENEFIT-001)<br>가격 기준 구분 (policy:PI-PRDD-PRICE-001-01) | [정책:PI-PRDD-PRICE-001-01] 가격 기준 |
| 2 | 2 | AccordionPriceInfoBenefitDetail | 혜택 상세 펼침 보기 | AccordionPriceInfo | default | onClick | setState | isBenefitDetailOpen | titleText: 적용 혜택 상세<br>rightText: {적용 혜택 수} (예: 3건) | 혜택 구성과 적용 조건 (api:FN-PRDD-BENEFIT-001)<br>혜택별 적용 조건·기간 (policy:PI-PRDD-PRICE-001-02)<br>isBenefitDetailOpen (state) | [정책:PI-PRDD-PRICE-001-02] 혜택 분리<br>[정책:PI-PRDD-PRICE-001-04] 마케팅 정보 |
| 999 | 1 | ActionButtonNext | 공유·딥링크·문의 맥락 유지 단계 진행 CTA | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-010-0 | main: 다음 단계로 | - (static) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|---|---|---|---|---|---|
| 화면 전환 | NOVA-PRDD-PG-010-0 | 공유·딥링크·문의 맥락 유지 | 예상 비용·혜택 요약 결과가 성공으로 확정된 경우 | 선택 구성, 예상 비용, 판정 근거 | - |
| 케이스 분기 | NOVA-PRDD-PG-009-1 | 예상 비용·혜택 요약-상품 기준 정보 누락 | 상품 기준 정보 누락 | - | 보완 필요·상담 가능 경로 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-009-2 | 예상 비용·혜택 요약-내부 운영 코드·원장 필드명 고객 노출 | 내부 운영 코드·원장 필드명 고객 노출 | - | 노출 제한·배포 제한 처리 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-009-E1 | 예상 비용·혜택 요약-미디어·후기·스펙 로딩 실패 | 미디어·후기·스펙 로딩 실패 | - | 핵심 요약 유지·재시도 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-009-3 | 예상 비용·혜택 요약-혜택 산정 결과 원장·프로모션 기간 불일치 | 혜택 산정 결과 원장·프로모션 기간 불일치 | - | 예상 금액 표시 보류·사유 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-009-4 | 예상 비용·혜택 요약-고객 조건 확인 불가 | 고객 조건 확인 불가 | - | 예상 범위·확인 필요 항목 표시 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-009-E2 | 예상 비용·혜택 요약-혜택 만료·소진·중복 불가 | 혜택 만료·소진·중복 불가 | - | 담기 전 미적용 사유 고지 후 화면 유지 |
