---
id: area-payment-completion-related-product-carousel
situation: 사용자가 결제를 완료한 뒤 구독 상품과 함께 많이 찾는 관련 상품을 가로 carousel로 탐색한다
whenToUseThisReference: SourceSpec에 결제 완료 후 관련/추천 구독 상품 목록이 있고 thumbnail, category, product title, price, period를 포함한 horizontal product carousel로 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - payment-completion
  - related-product
  - recommendation-carousel
  - product-card-carousel
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58810`
- Capture: `source/area-payment-completion-related-product-carousel.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Payment completion related product carousel는 결제 완료 후 현재 구독 상품과 함께 많이 찾는 상품을 노출하는 cross-sell area다. SOT에서는 `Pagestack` 안의 `TitleSection`에 추천 맥락을 설명하고, `ContentsSlot`에 `CarouselProduct` cards를 가로로 반복한다. 각 card는 square thumbnail, category label, product title, price, period를 가진다.

이 reference는 이미 결제한 상품의 상세 확인 area가 아니다. 결제 결과 확인 흐름 뒤에 붙는 post-completion 추천 carousel이며, vertical list나 배송/결제 ledger와 섞지 않는다.

## Structure Example

- Area
  - `Pagestack`: related product carousel section wrapper
    - `TitleSection`: recommendation title
    - `ContentsSlot`
      - horizontal `CarouselProduct` group
        - repeated `CarouselProduct`
          - `.ThumbnailItem`: product thumbnail
          - `.ProductInfoVertical`
            - category label
            - product title
            - price
            - period suffix

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- section title은 추천 맥락을 명확히 말하는 `TitleSection`으로 둔다.
- 상품은 vertical list가 아니라 horizontal carousel card 반복으로 구성한다.
- 각 card는 thumbnail을 먼저 보여주고, 아래에 category, title, price/period를 세로로 배치한다.
- 긴 상품명은 card 안에서 line clamp 또는 ellipsis 처리해 card width를 유지한다.
- 가격과 기간은 같은 price group 안에서 위계를 나눠 표현한다.
- 결제 완료 후 추천용 area이므로 결제 완료 ledger, 결제한 상품 상세, 배송지 정보를 섞지 않는다.

## SourceSpec Additions

SourceSpec이 추천 상품 목록 일부만 제공하더라도, carousel 판단을 위해 아래 보강은 허용된다.

- recommendation section title
- product thumbnail
- product category label
- product title
- product price
- product period suffix

## Component Candidates

- `Pagestack`
- `TitleSection`
- horizontal carousel container
- `CarouselProduct`
- `.ThumbnailItem`
- `.ProductInfoVertical`
- category label
- product title text
- price and period text group

## Avoid

- 이 area를 결제된 상품 summary나 포함 혜택 list로 사용하지 않는다.
- 추천 상품을 `ListText` key-value rows로 나열하지 않는다.
- 배송지 정보, 결제 금액 ledger, 안내 bullet을 carousel 안에 섞지 않는다.
- card마다 CTA를 과하게 추가하지 않는다. SOT의 핵심은 추천 상품 탐색 card다.
- source에 없는 추천 상품명, 가격, 기간을 만들어 넣지 않는다.
