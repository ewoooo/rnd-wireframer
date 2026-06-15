---
id: area-payment-completion-subscribed-product
situation: 사용자가 결제를 완료한 뒤 구독된 상품의 이름, 이용 기간/가격, 포함 혜택을 한 area에서 확인한다
whenToUseThisReference: SourceSpec에 결제 완료 후 상품명, 구독 기간/가격, 포함 쿠폰/혜택 목록이 있고 `상품 N` section으로 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - payment-completion
  - subscribed-product
  - subscription-summary
  - benefit-list
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58806`
- Capture: `source/area-payment-completion-subscribed-product.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Payment completion subscribed product는 결제 완료 화면에서 사용자가 실제로 구독하게 된 상품과 포함 혜택을 확인하는 area다. SOT에서는 `Pagestack` 안에 `TitleSection`으로 `상품 1`을 표시하고, `Local_PayList`의 product block으로 상품명, 구독 기간/가격, 접기/펼치기 affordance, 포함 쿠폰 row를 이어 붙인다.

이 reference는 일반 상품 선택 card나 추천 carousel이 아니다. 사용자는 이미 결제를 마쳤고, 이 area는 post-completion 확인용으로 구독 상품과 지급/이용 가능한 혜택을 읽게 한다.

## Structure Example

- Area
  - `Pagestack`: subscribed product section wrapper
    - `TitleSection`: item index title
    - `Local_PayList`
      - product summary row
        - product title
        - subscription period / price text
        - collapse or expand affordance
      - included benefit row
        - `ThumbnailItem`: provider logo
        - provider meta text
        - benefit description text

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- section title은 `TitleSection`으로 두고, 반복 상품이면 `상품 1`, `상품 2` 같은 index title을 허용한다.
- 상품 summary는 상품명, 구독 기간/가격, 접기/펼치기 affordance를 같은 product block의 상단에 둔다.
- 포함 혜택은 상품 summary 아래에 반복 row로 배치한다.
- 혜택 row에는 제공처 thumbnail/logo, 제공처 meta, 혜택 설명을 함께 둔다.
- 결제 완료 후 확인용 area이므로 결제 실행 CTA, 수량 선택, 상품 옵션 선택 affordance를 포함하지 않는다.
- 화면의 추천 상품 carousel과 혼동하지 않는다. 추천 상품은 post-completion cross-sell area이고, 이 reference는 이미 결제된 상품의 상세 확인 area다.

## SourceSpec Additions

SourceSpec이 결제된 상품과 일부 혜택만 제공하더라도, 결제 후 확인 흐름을 이해시키기 위해 아래 보강은 허용된다.

- item index title
- subscribed product title
- subscription period / price text
- included benefit provider name
- included benefit thumbnail/logo
- included benefit description
- collapse or expand affordance

## Component Candidates

- `Pagestack`
- `TitleSection`
- `Local_PayList`
- product summary row
- collapse or expand affordance
- `PayProdutListItem`
- `ThumbnailItem`
- provider meta text
- benefit description text

## Avoid

- 이 area를 결제 전 상품 선택 card로 사용하지 않는다.
- 추천 상품 carousel, related product list, benefit discovery list로 해석하지 않는다.
- 포함 혜택 row에 구매 CTA, 쿠폰 다운로드 CTA, 옵션 선택 CTA를 넣지 않는다.
- 결제 금액 ledger, 배송지 정보, 안내 bullet을 이 area 안에 섞지 않는다.
- source에 없는 혜택 제공처나 쿠폰 금액을 만들어 넣지 않는다.
