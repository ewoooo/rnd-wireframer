---
id: detail-confirmation
situation: 사용자가 결제를 실행하기 직전에 주문자·상품·할인·포인트·결제 수단·약관을 한 화면에서 최종 확정한다
tags:
  - detail-confirmation
  - irreversible-action
  - summary-first
  - payment-execution
  - agreement-gate
sotNodeRef: 10161:49136
---

## 상황

`결제하기` 화면(`checkout-payment-screen`)은 옵션과 배송 정보를 모으는 이전 단계와 달리, 결제라는 비가역 액션을 바로 앞에 둔 최종 확정 화면이다. 사용자는 여기서 주문자 정보, 상품 정보, T 플러스 포인트, 구독 방식, 결제 수단, 현금영수증, 결제 금액, 그리고 결제 약관 동의까지 모든 판단을 한 번에 내려야 한다. 결제는 되돌리기 어렵기 때문에, 단순히 "다음으로 넘어가는" 입력 화면이 아니라 모든 변수를 검토 가능한 상태로 노출한 뒤 사용자가 의식적으로 확정하게 만드는 무게를 가진다. 하단 CTA가 `다음`이 아니라 `약관 동의하고 결제하기`인 것도 이 비가역성의 비용을 문구로 드러내려는 선택이다.

## 선택한 화면 구조 (areas / composites)

SOT에서 실제로 쓰인 조합은 다음과 같다.

- region: `StatusBar` → `AppBar`(title `결제하기`, back action) → `Contents` → `Bottom`.
- `Contents`는 판단 단위마다 `Pagestack` area를 두고 `4px` section divider로 분리한다: 주문자 정보 / SKT 고객 인증 / 상품 정보 / T 플러스 포인트 / 구독 방식 / 결제 수단 / 현금영수증 / 결제 정보 / 결제 약관 및 동의.
- 상품 묶음은 `Local_PayList`·`PayProdutListItem` composite로 상품 제목·월 금액·하위 item·internal divider를 계층적으로 반복한다.
- 결제 정보는 일반 list가 아니라 ledger다. `ListText` rows + `4px`/`16px` spacing + `1px` internal divider로 항목명과 금액을 정렬하고, 최종 결제 금액만 brand color·semi-bold로 위계를 끌어올려 분리한다.
- 결제 수단은 `PaymentList`/`ListSelected` 선택 row와 추천 `BannerHorizontalSmall`로 구성한다.
- `Bottom`은 고정 `ActionButton` 하나로, 약관 동의 상태와 결제 실행을 함께 표현한다.

## 그 구조를 쓴 이유 (판단)

- 고밀도 정보를 한 화면에 담되 판단 단위를 section으로 쪼갠 이유는, 비가역 액션 직전에 사용자가 각 결정(할인·포인트·결제 수단·현금영수증·약관)을 개별적으로 확인하고 되짚을 수 있어야 하기 때문이다. 한 덩어리로 뭉치면 검토가 불가능해진다.
- 금액을 ledger로 다루고 최종 결제 금액만 emphasis로 분리한 이유는, 할인·포인트가 적용된 결과와 실제 지불 금액의 위계가 같으면 사용자가 "얼마를 내는지"를 오인할 수 있기 때문이다. summary-first 원칙에 따라 결정에 필요한 합계를 가장 또렷하게 보여준다.
- 약관 동의를 하단 CTA에 직접 묶고 문구에 `약관 동의하고 결제하기`로 명시한 이유는, 비가역 액션의 책임 경계를 한 번의 의식적 탭으로 모으기 위해서다. 동의와 실행을 분리하면 사용자가 무엇에 동의했는지 모른 채 결제할 위험이 생긴다.
