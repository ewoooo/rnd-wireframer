---
id: area-product-benefit-nearby-store-map
situation: 사용자가 제휴 브랜드 혜택을 사용할 수 있는 주변 가맹점을 지도와 거리순 목록으로 확인한다
whenToUseThisReference: SourceSpec에 주변 매장, 가맹점, 거리, 매장명, 전화/길찾기 같은 local action이 있고 브랜드 혜택 상세 화면에서 map preview와 store card list가 함께 필요할 때 사용한다
tags:
  - area-pattern
  - product-benefit
  - nearby-store
  - map-preview
  - store-card-list
  - local-action
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98093`
- Capture: `source/area-product-benefit-nearby-store-map.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product benefit nearby store map은 브랜드 혜택 상세 화면에서 현재 위치 주변의 사용 가능 가맹점을 지도와 목록으로 함께 보여주는 area다. SOT에서는 `Pagestack` section title 오른쪽에 `가맹점 더보기` affordance를 두고, rounded map preview에 numbered pins를 표시한 뒤, 같은 번호의 nearby store card를 거리순으로 반복한다.

이 reference는 단순 지도 preview가 아니다. 지도 pin과 하단 store card가 같은 후보군을 가리켜야 하며, store card에는 거리, 매장명, 전화 같은 local action이 함께 있어야 한다.

## Structure Example

- Area
  - `Pagestack`: nearby store section wrapper
    - `TitleSection`: 내 주변 가맹점
      - right item: 가맹점 더보기
    - map preview
      - map image
      - numbered pins
    - repeated nearby store card
      - pin number
      - distance
      - store name
      - local action button, e.g. 전화

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 주변 가맹점이나 매장 탐색 목적을 드러낸다.
- 전체 가맹점 보기, 지도 보기 같은 확장 action은 title right item으로 둔다.
- map preview는 store card list보다 먼저 둔다.
- map pin number와 store card pin number는 같은 순서를 나타내야 한다.
- store card는 distance, store name, local action을 한 card 안에 둔다.
- `전화`, `길찾기`, `상세` 같은 action은 store card에 종속된 local action이다. screen-level CTA로 승격하지 않는다.
- 매장 수가 여러 개면 거리순 또는 relevance 순으로 반복한다.
- 지도만 단독으로 보여주고 store card list를 생략하지 않는다.

## SourceSpec Additions

SourceSpec이 주변 매장 목록을 부분적으로 제공하더라도, 매장 탐색을 완성하기 위해 아래 보강은 허용된다.

- map preview image 또는 placeholder
- numbered pins
- distance text
- store name
- local phone/call action
- title right item for more stores

## Component Candidates

- `Pagestack` section
- `TitleSection` with right item
- map preview
- numbered `Pin`
- nearby store `CardInfo`
- `.CardText`
- local `Button`

## Avoid

- 이 area를 brand hero나 related brand list로 분류하지 않는다.
- 지도만 보여주고 실제 매장 list를 생략하지 않는다.
- store card의 전화/길찾기 action을 bottom fixed CTA로 승격하지 않는다.
- pin number와 card order가 서로 다른 의미를 갖게 만들지 않는다.
- 쿠폰 사용 action이나 혜택 조건 row를 store card 안에 섞지 않는다.
- source에 없는 결제, 주문, 예약 flow를 추가하지 않는다.
