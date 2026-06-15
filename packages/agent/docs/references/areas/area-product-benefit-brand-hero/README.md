---
id: area-product-benefit-brand-hero
situation: 사용자가 혜택 상세 화면에 진입했을 때 특정 제휴 브랜드의 정체성과 혜택 유형을 첫 화면에서 인지한다
whenToUseThisReference: SourceSpec에 브랜드명, 브랜드 이미지나 로고, 짧은 설명, 카테고리, 관심 수치, 할인/적립/사용 같은 혜택 유형 badge가 있고 상세 화면의 상단 hero가 필요할 때 사용한다
tags:
  - area-pattern
  - product-benefit-brand
  - brand-hero
  - benefit-summary
  - visual-thumbnail
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98026`
- Capture: `source/area-product-benefit-brand-hero.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product benefit brand hero는 혜택 브랜드 상세 화면의 상단 인지 area다. SOT에서는 full-width `Thumbnail` 안에 브랜드 visual background를 깔고, 하단부에 브랜드명, 설명, category breadcrumb, like count, 혜택 유형 badge를 한 덩어리로 배치한다.

이 reference는 상품 summary sheet나 완료 hero가 아니다. 사용자가 이후 혜택 조건, 유의사항, 쿠폰, 매장 정보를 읽기 전에 "어떤 브랜드의 어떤 혜택 상세인지"를 먼저 이해하게 만드는 screen-opening area다.

## Structure Example

- Area
  - `Thumbnail`: brand hero wrapper
    - `ImageProduct`: brand visual background
    - `BrandInfo`
      - Korean brand name
      - display brand name
      - short brand description
      - category breadcrumb
      - like count with icon
      - benefit type badge list: 할인 / 적립 / 사용

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 screen width를 채우는 `Thumbnail` 또는 equivalent hero container로 둔다.
- 브랜드 visual은 area의 배경 역할이다. 별도 card thumbnail이나 list item logo처럼 축소하지 않는다.
- brand info는 hero 하단부에 묶는다. 브랜드명, 설명, category/like, badge list를 서로 다른 section으로 분리하지 않는다.
- local language brand name과 display brand name이 둘 다 있으면 위계를 나눠 연속 배치한다.
- 설명 문장은 1-2줄의 짧은 copy로 둔다. 긴 유의사항이나 혜택 조건은 hero에 넣지 않는다.
- category breadcrumb와 like count는 보조 메타 정보로 낮은 contrast에 둔다.
- 혜택 유형 badge는 브랜드가 제공하는 capability summary만 나타낸다. 구체적인 할인율, 적립률, 사용 조건은 별도 혜택 정보 area에서 다룬다.

## SourceSpec Additions

SourceSpec이 브랜드 상세 맥락만 제공하더라도, 상단 인지를 위해 아래 보강은 허용된다.

- 브랜드 visual 또는 대표 background
- 한글 브랜드명과 영문/표시 브랜드명
- 브랜드를 설명하는 짧은 한두 줄 copy
- category breadcrumb
- like/favorite count 같은 사회적 지표
- 할인, 적립, 사용처럼 혜택 가능 범위를 요약하는 badge

## Component Candidates

- `Thumbnail`
- `ImageProduct`
- `BrandInfo`
- brand title text
- brand description text
- metadata row
- like icon/count
- `.Badge` list

## Avoid

- 이 area를 상품 선택 기준 summary인 `area-product-summary-sheet`처럼 compact sheet로 만들지 않는다.
- 완료/성공 상태를 말하는 `area-completion-hero`로 분류하지 않는다.
- 할인율, 적립률, 등급별 조건 같은 상세 혜택 row를 hero 안에 넣지 않는다.
- 유의사항, 문의처, 쿠폰 action, 주변 매장 정보를 hero 안에 섞지 않는다.
- badge를 CTA처럼 보이게 하거나 screen-level action으로 해석하지 않는다.
- 브랜드 visual을 source와 무관한 장식 image로 대체하지 않는다.
