---
id: screen-payment-completion-detail
situation: 사용자가 구독/상품 결제를 완료한 뒤 결제 내역, 상품, 배송지, 추천 상품, 안내 문구를 확인하고 후속 action을 선택한다
whenToUseThisReference: SourceSpec에 결제 완료 상태와 함께 결제 금액 ledger, 결제 상품, 배송지 정보, 추천 상품, 안내 bullet, 확인/탐색 action이 모두 있으면 사용한다
tags:
  - screen-pattern
  - payment-completion
  - completion-result
  - payment-ledger
  - subscription-detail
  - follow-up-actions
sotNodeRef: 10090:58801
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58801`
- Capture: `source/screen-payment-completion-detail.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Screen Pattern

SourceSpec에 결제 완료 headline과 결제 상세, 배송지, 추천 상품, 안내, 후속 action이 함께 있으면 `screen-payment-completion-detail` pattern으로 본다.

이 pattern은 결제를 실행하기 전의 `detail-confirmation`이 아니다. 사용자는 이미 결제를 끝냈고, 화면은 완료 사실을 확인시킨 뒤 실제 결제 결과와 후속 이용 정보를 읽게 한다. 하단 action도 결제 실행이 아니라 다른 구독 탐색과 확인처럼 post-completion action을 제공한다.

## Structure Example

- Screen
  - Header: `StatusBar` + close-only `AppBar`
  - Contents
    - `Pagestack`: payment completion headline
      - `TitleMain` Complete variant
      - completion headline
      - short sub text
      - payment information ledger
        - payment method row
        - internal divider
        - total subscription price rows
        - discount rows
        - final payment amount emphasis
    - `Divider`: section
    - `Pagestack`: 상품 1
      - subscribed product title row
      - product fee/subscription period
      - included coupon/benefit rows
    - `Divider`: section
    - `Pagestack`: 배송지 정보
      - recipient
      - phone number
      - address
      - delivery memo
    - `Divider`: section
    - `Pagestack`: 구독한 상품과 함께 많이 찾는 상품
      - horizontal product carousel
      - repeated product cards with thumbnail, category, title, price, period
    - `Divider`: section
    - `Pagestack`: 선물 받기 안내
      - bullet notice list
  - Bottom: fixed `ActionButton`
    - secondary exploration action
    - confirm action

SOT의 핵심은 "결제 완료 메시지" 하나가 아니라, 결제 후 사용자가 다시 확인해야 하는 ledger, 상품, 배송, 추천, 안내를 section 단위로 나눈 뒤 하단에서 post-completion action을 제공하는 것이다.

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- `Header`는 `StatusBar` + close-only `AppBar` 구조를 쓴다.
- 첫 area는 결제 완료 headline을 가진다. 완료 사실을 `TitleMain` Complete variant 수준으로 먼저 말한다.
- 결제 정보는 완료 headline 아래에서 ledger로 구성한다.
- 결제 ledger는 결제수단, 구독가, 할인, 최종 결제 금액을 구분한다.
- 최종 결제 금액은 ledger의 마지막 row로 강조한다.
- 상품 정보, 배송지 정보, 추천 상품, 안내는 결제 ledger 안에 섞지 않고 별도 section으로 분리한다.
- 추천 상품은 vertical list가 아니라 horizontal carousel 성격의 product card 반복으로 둔다.
- 안내는 bullet list로 두고, agreement gate나 결제 전 약관 동의로 해석하지 않는다.
- `Bottom`은 fixed `ActionButton`으로 두되, 결제 실행 CTA가 아니라 post-completion action을 제공한다.

## SourceSpec Additions

SourceSpec이 결제 완료와 일부 결과값만 제공하더라도, 완료 후 확인 흐름을 이해시키기 위해 아래 보강은 허용된다.

- completion headline and sub text
- payment method
- subscription price, discount rows, final paid amount
- subscribed product summary and included benefits
- delivery recipient, phone number, address, delivery memo
- related/recommended subscription products
- post-completion notice bullet list
- fixed bottom confirm/explore actions

## Area And Component Candidates

- `StatusBar`
- close-only `AppBar`
- area reference: `area-payment-completion-ledger`
- `Pagestack` result section
- `TitleMain` Complete variant
- `TitleSection`
- `ListText`
- internal `Divider`
- payment ledger rows
- product/benefit summary rows
- delivery information rows
- horizontal product carousel
- product card
- bullet notice list
- fixed `ActionButton`
- section `Divider`

## Avoid

- 이 화면을 결제 전 `detail-confirmation`으로 분류하지 않는다.
- 하단 action을 `약관 동의하고 결제하기` 같은 irreversible payment execution CTA로 만들지 않는다.
- 결제 완료 headline만 필요하면 `area-completion-hero`나 `area-completion-result-summary`를 검토한다.
- 결제 ledger, 상품, 배송지, 추천 상품, 안내를 하나의 긴 card에 평면 나열하지 않는다.
- 추천 상품 carousel을 결제 결과 summary card 안에 섞지 않는다.
- 안내 bullet을 결제 전 agreement gate로 바꾸지 않는다.
- source에 없는 할인/배송/상품 값을 만들어 넣지 않는다.
