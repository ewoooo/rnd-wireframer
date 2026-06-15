---
id: area-product-benefit-related-brand-list
situation: 사용자가 현재 보고 있는 제휴 브랜드와 비슷한 혜택을 제공하는 다른 브랜드를 탐색한다
whenToUseThisReference: SourceSpec에 관련 브랜드, 유사 브랜드, 같은 카테고리 브랜드, 브랜드별 혜택 유형 badge가 있고 브랜드 혜택 상세 화면의 보조 탐색 목록이 필요할 때 사용한다
tags:
  - area-pattern
  - product-benefit
  - related-brand
  - brand-card-list
  - benefit-badge-list
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98105`
- Capture: `source/area-product-benefit-related-brand-list.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product benefit related brand list는 브랜드 혜택 상세 화면의 마지막 탐색 area다. SOT에서는 `Pagestack` section 안에 related brand card를 반복하고, 각 card는 category, brand name, benefit type badge list, brand logo thumbnail을 가진다.

이 reference는 `area-product-benefit-coupon-card`와 card shape는 비슷하지만 목적이 다르다. coupon card는 특정 쿠폰의 대상/만료/action을 보여주고, related brand list는 현재 브랜드에서 다른 브랜드 상세로 이어지는 탐색 후보를 보여준다. 따라서 card-local `사용`/`받기` button이나 D-day badge를 두지 않는다.

## Structure Example

- Area
  - `Pagestack`: related brand section wrapper
    - `TitleSection`: 비슷한 혜택 브랜드
    - repeated related brand card
      - category text
      - brand name
      - benefit type badge list: 할인 / 적립 / 사용
      - brand logo thumbnail

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- related brand card는 반복 가능한 동일 구조로 둔다.
- category text는 brand name보다 낮은 위계로 둔다.
- brand name은 card의 주요 text다.
- benefit badge list는 해당 브랜드가 제공하는 혜택 유형만 요약한다.
- brand logo thumbnail은 card 오른쪽에 둬 빠른 식별을 돕는다.
- 이 area는 보조 탐색 영역이므로 현재 브랜드 hero보다 낮은 위계로 보여야 한다.
- card에 `사용`, `받기`, `전화` 같은 local action button을 넣지 않는다.

## SourceSpec Additions

SourceSpec이 관련 브랜드 목록을 부분적으로 제공하더라도, 탐색 후보를 이해시키기 위해 아래 보강은 허용된다.

- related brand category
- related brand name
- benefit type badges
- brand logo or initials thumbnail
- repeated card treatment

## Component Candidates

- `Pagestack` section
- `TitleSection`
- related brand `CardInfo`
- `.CardText`
- `.Badge` list
- `.ThumbnailLogoItem`

## Avoid

- 이 area를 `area-product-benefit-coupon-card`로 분류하지 않는다. 쿠폰 대상, 만료일, 사용 button이 없으면 coupon card가 아니다.
- related brand card에 coupon D-day badge나 coupon action button을 추가하지 않는다.
- brand logo를 hero image처럼 확장하지 않는다.
- 혜택 조건 row나 유의사항 copy를 related brand card 안에 섞지 않는다.
- 주변 매장 card처럼 거리, pin number, 전화 action을 넣지 않는다.
- 현재 브랜드와 같은 위계의 hero를 반복하지 않는다.
