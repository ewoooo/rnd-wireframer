---
화면 ID: NOVA-PRDD-PG-011-3
화면 명: 담기 전 유효성 재검증-재고·판매 상태·가입 조건 미확정
화면 설명: 재고·판매 상태·가입 조건이 미확정이라 담기를 확정하지 않고 보완 가능한 항목을 안내한다.
화면 경로: 담기 전 유효성 재검증
구현 유형: PG
관련 정책 그룹: PG-PRDD-SAVE-001, PG-PRDD-COMBO-001, PG-PRDD-STOCK-001, PG-PRDD-LIFE-001, PG-PRDD-ELIG-001, PG-PRDD-OPTION-001, PG-PRDD-CATALOG-001, PG-PRDD-FAIL-001
관련 유즈케이스: US-PRDD-CUS-004
관련 기능: FN-PRDD-SAVE-001, FN-PRDD-INVENTORY-001, FN-PRDD-COMBO-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 담기 실행·상태 저장 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 1 | 1 | 1 | 영역 전체 숨김 |
| 2 | dynamic | 재고·수량·배송 가능성 조회 영역 | vertical | 항상 | 유형(텍스트 내용), 개수 | 0 | N | 2 | 오류 항목 미노출 |
| 3 | dynamic | 상품 조합·프로그램 유효성 검증 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용), 개수 | 0 | N | 3 | 오류 항목 미노출 |
| 999 | dynamic | 화면 하단 액션 영역 | vertical | 항상 | 유형(노출 여부) | 1 | 1 | - | 기본값 표시 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 재고·판매 상태·가입 조건 미확정 | [영역 2] 보완 필요 항목 강조 + [영역 1] CTA disabled | setState |
| OneButton | 미확정 항목 보완 완료 | ActionButton main 슬롯만 활성 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | - | onClick | navigate | NOVA-PRDD-PG-010-0 |title: 담기 전 유효성 재검증 | - (static) | - |
| 1 | 1 | CalloutRevalidation | 담기 직전 재검증 결과 안내 | Callout | - | - | - | - |title: 담기 가능 여부 재확인<br>body: 가격·혜택·재고가 변경되면 변경 내용을 비교 표시하고 확인을 요청합니다. | 담기 성공·실패·보완 필요 이력 (api:FN-PRDD-SAVE-001)<br>재검증 (policy:PI-PRDD-SAVE-001-04) | [정책:PI-PRDD-SAVE-001-04] 재검증<br>[정책:PI-PRDD-COMBO-001-04] 담기 판정 |
| 1 | 2 | ButtonSaveCtaSelect | 상품 유형별 담기·바로결제·구독 CTA 구분 | Button | primary | onClick | apiCall | - |label: 담기 | 담기·바로결제·구독 CTA 구분 (policy:PI-PRDD-SAVE-001-05) | [정책:PI-PRDD-SAVE-001-05] CTA 의미 구분 |
| 2 | 1 | ListTextStockOption | 옵션 재고 현황 표시 | ListText | on | - | - | - |title: {옵션명} (예: 256GB 블랙)<br>subText: {재고상태} (예: 재고 있음) | 수정 필요 옵션과 제한 사유 (api:FN-PRDD-INVENTORY-001)<br>재고 기준 (policy:PI-PRDD-STOCK-001-01) | [정책:PI-PRDD-STOCK-001-01] 재고 기준 |
| 2 | 2 | ListTextQuantityLimit | 옵션별 수량 제한 표시 | ListText | on | - | - | - |title: 구매 가능 수량<br>subText: {최대수량} (예: 최대 2개) | 수정 필요 옵션과 제한 사유 (api:FN-PRDD-INVENTORY-001)<br>재고 기준 (policy:PI-PRDD-STOCK-001-01) | [정책:PI-PRDD-STOCK-001-01] 재고 기준 |
| 2 | 3 | ListTextDeliveryAvailability | 배송·픽업 가능 여부 표시 | ListText | on | - | - | - |title: 배송 가능 여부<br>subText: {배송유형} (예: 택배 배송 가능) | 담기 가능 여부와 선택 구성 상태 (api:FN-PRDD-INVENTORY-001)<br>배송 가능성 (policy:PI-PRDD-STOCK-001-02) | [정책:PI-PRDD-STOCK-001-02] 배송 가능성 |
| 2 | 4 | ListTextStockOptionDetail | 옵션별 재고 상세 표시 | ListText | on | - | - | - |title: {옵션조합} (예: 블루 / 512GB)<br>subText: {옵션재고상태} (예: 입고 예정) | 수정 필요 옵션과 제한 사유 (api:FN-PRDD-INVENTORY-001)<br>판매 상태 (policy:PI-PRDD-LIFE-001-04) | [정책:PI-PRDD-LIFE-001-04] 판매 상태 |
| 3 | 1 | ListTextConcurrentOrder | 동시 주문 가능 조합 안내 | ListText | dot | - | - | - |title: {동시주문조합} (예: 단말+요금제 동시 주문 가능) | 상품 관계 (api:FN-PRDD-COMBO-001)<br>동시 주문 (policy:PI-PRDD-COMBO-001-01) | [정책:PI-PRDD-COMBO-001-01] 동시 주문 |
| 3 | 2 | ListTextRequiredComposition | 필수 구성 누락 안내 | ListText | dot | - | - | - |title: {필수구성항목} (예: 필수 요금제 미선택) | 수정 필요 옵션과 제한 사유 (api:FN-PRDD-COMBO-001)<br>필수 구성 (policy:PI-PRDD-COMBO-001-03) | [정책:PI-PRDD-COMBO-001-03] 필수 구성 |
| 3 | 3 | CalloutDuplicateGroupRestrict | 중복 불가 그룹 상품 제한 안내 | Callout | - | - | - | - |title: 함께 담을 수 없는 상품<br>body: 단독 구매 상품은 다른 상품과 함께 담을 수 없습니다. | 제한 사유 (policy:PI-PRDD-COMBO-001-01) | [정책:PI-PRDD-COMBO-001-01] 동시 주문 |
| 3 | 4 | CalloutDuplicateJoinCheck | 중복가입 가능여부 확인 안내 | Callout | - | - | - | - |title: 중복 가입 확인<br>body: 중복 가입이 불가한 상품은 담기 단계에서 제한 사유를 안내합니다. | 중복 가입 (policy:PI-PRDD-COMBO-001-02) | [정책:PI-PRDD-COMBO-001-02] 중복가입 가능여부 확인 |
| 3 | 5 | CheckboxGroupProductSelect | 그룹상품 구성 선택 | Checkbox | - | onChange | setState | selectedGroupProducts |label: {그룹상품명} (예: 결합 할인 구성) | selectedGroupProducts (state)<br>그룹 상품 (policy:PI-PRDD-OPTION-001-03) | [정책:PI-PRDD-OPTION-001-03] 그룹 상품 |
| 999 | 1 | ActionButton | 재검증 확인 후 담기 실행 진행 | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-012-0 | main: 담기 실행 계속하기 | 담기 가능 여부 (api:FN-PRDD-SAVE-001) | [정책:PI-PRDD-SAVE-001-04] 재검증 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-011-0 | 담기 전 유효성 재검증 | 재고·판매 상태·가입 조건 미확정 해소 후 | - | - |
