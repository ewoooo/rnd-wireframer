---
id: screen-prooduct-benefit-brand-detail
situation: 사용자가 특정 제휴 브랜드의 혜택 조건, 이용 유의사항, 관련 쿠폰, 주변 매장, 유사 브랜드를 한 화면에서 탐색한다
whenToUseThisReference: SourceSpec에 브랜드명, 혜택 유형, 상세 혜택 조건, 사용처나 매장 정보, 유사 혜택 브랜드가 함께 있고 사용자의 주요 task가 입력이나 최종 확정보다 혜택 상세 탐색일 때 사용한다
tags:
  - screen-pattern
  - benefit-brand-detail
  - brand-hero
  - benefit-information
  - store-discovery
  - related-brand-list
sotNodeRef: 10069:98025
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98025`
- Capture: `source/screen-prooduct-benefit-brand-detail.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Screen Pattern

SourceSpec에 특정 브랜드의 혜택 상세, 사용 조건, 주변 매장, 유사 브랜드 추천이 함께 있으면 `screen-prooduct-benefit-brand-detail` pattern으로 본다.

이 pattern은 사용자가 값을 입력하거나 주문 옵션을 구성하는 화면이 아니다. 브랜드와 혜택을 먼저 인지시키고, 이어서 혜택 조건과 유의사항을 읽게 한 뒤, 쿠폰 발급/저장 같은 local action과 주변 매장 탐색, 유사 브랜드 탐색을 보조 흐름으로 제공한다.

## Structure Example

- Screen
  - Header: transparent/overlay `StatusBar` + `AppBar`
  - Contents
    - Brand hero thumbnail
      - brand image/background
      - Korean brand name + English brand name
      - short description
      - category breadcrumb and like count
      - benefit capability badges
    - `Pagestack`: 혜택 정보
      - card container
      - benefit type groups such as 할인형 / 적립형
      - repeated `ListText` rows with benefit labels and membership tier badges
    - `Divider`: section
    - `Pagestack`: 유의사항 및 문의
      - expanded `AccordionNoticeInfo`
      - grouped notice body rows
      - contact and SNS information
    - `Divider`: section
    - `Pagestack`: 쿠폰 혜택
      - coupon card with brand logo, coupon title, expiration badge
      - local issue/use button
    - `Divider`: section
    - `Pagestack`: 내 주변 가맹점
      - map preview with numbered pins
      - nearby store cards with distance and action button
    - `Divider`: section
    - `Pagestack`: 비슷한 혜택 브랜드
      - related brand cards with category, brand name, benefit badges, logo

SOT의 핵심은 "브랜드 hero가 있는 긴 상세 화면"이 아니라, 브랜드 인지, 혜택 조건, 유의사항, 쿠폰 action, 매장 탐색, 관련 브랜드 탐색을 서로 다른 판단 단위로 sectioning하는 것이다.

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- `Header`는 hero 위에 overlay되는 `StatusBar` + `AppBar` 구조를 쓴다. AppBar에는 back action과 utility action을 둘 수 있지만 화면 title을 과하게 노출하지 않는다.
- 첫 viewport는 brand hero가 지배해야 한다. 브랜드 이미지, 브랜드명, 설명, category, like count, benefit badges를 hero 내부에 묶는다.
- 혜택 조건은 hero 내부가 아니라 별도 `Pagestack`의 card로 분리한다.
- 혜택 정보 card 안에서는 혜택 유형별 title과 row list를 구분하고, 멤버십 등급이나 대상 조건은 row 오른쪽 badge/icon cluster로 둔다.
- 유의사항처럼 긴 정책성 텍스트는 기본 list나 card로 펼쳐 놓지 말고 accordion/notice component로 감싼다.
- 쿠폰 발급, 쿠폰 받기, 사용하기 같은 action은 coupon card 내부의 local button으로 둔다. 화면 하단 fixed CTA로 승격하지 않는다.
- 주변 매장은 map preview와 store card list를 같은 section에 둔다. 지도만 단독 hero처럼 쓰거나, 매장 list를 별도 screen으로 분리하지 않는다.
- 관련 브랜드는 현재 브랜드의 보조 탐색 영역이다. 상세 hero보다 낮은 위계의 repeated cards로 둔다.
- 서로 다른 판단 단위 사이에는 full-width section divider를 둔다.

## SourceSpec Additions

SourceSpec이 직접 component를 명시하지 않아도, 혜택 상세 탐색 흐름을 이해시키기 위해 아래 보강은 허용된다.

- brand hero: 브랜드 이미지, 브랜드명, 짧은 설명, category, like count, benefit type badges
- benefit rows: 할인/적립/사용 같은 유형 title과 tier/조건 badge
- notice body: 유의사항, 문의처, SNS, 운영 기준 같은 긴 안내 텍스트를 accordion으로 묶기
- coupon affordance: 관련 쿠폰이 있으면 coupon card와 local action button
- nearby stores: 현재 위치 주변의 매장 지도 preview, numbered pins, 거리 기반 store cards
- related brands: 같은 category 또는 같은 benefit type의 다른 브랜드 cards

## Area And Component Candidates

- overlay `StatusBar` + `AppBar`
- area reference: `area-product-benefit-brand-hero`
- area reference: `area-product-benefit-info-card`
- area reference: `area-product-benefit-notice-accordion`
- area reference: `area-product-benefit-coupon-card`
- area reference: `area-product-benefit-nearby-store-map`
- area reference: `area-product-benefit-related-brand-list`
- `Pagestack` section
- `TitleSection`
- `CardContentsLine`
- `TitleContents`
- `ListText`
- tier/benefit badge cluster
- section `Divider`

## Avoid

- 브랜드 상세 화면을 `detail-confirmation`처럼 최종 검토/실행 화면으로 분류한다.
- 혜택 조건, 유의사항, 쿠폰, 주변 매장, 관련 브랜드를 하나의 긴 card 안에 평면 나열한다.
- 쿠폰 받기 같은 local action을 screen-level fixed bottom CTA로 만든다.
- 긴 유의사항을 hero나 혜택 정보 card 내부에 섞어 핵심 혜택 조건의 가독성을 낮춘다.
- 주변 매장 section에서 map만 보여주고 실제 매장 card나 거리 정보를 생략한다.
- 관련 브랜드를 현재 브랜드와 같은 위계의 hero로 반복한다.
- source에 없는 결제, 약관 동의, 주문 확정, 입력 field를 추가한다.
