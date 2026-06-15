---
id: area-product-benefit-info-card
situation: 사용자가 특정 제휴 브랜드에서 제공하는 할인, 적립, 사용 같은 혜택 조건을 유형별로 확인한다
whenToUseThisReference: SourceSpec에 혜택 유형별 제목과 반복 조건 row, 멤버십 등급이나 대상 조건 badge가 있고 브랜드 상세 화면의 혜택 정보 section이 필요할 때 사용한다
tags:
  - area-pattern
  - product-benefit
  - benefit-info
  - benefit-condition-card
  - tier-badge-list
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98053`
- Capture: `source/area-product-benefit-info-card.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product benefit info card는 브랜드 상세 화면에서 실제 혜택 조건을 유형별로 읽게 하는 area다. SOT에서는 `Pagestack` section 안에 bordered `CardContentsLine`을 두고, `할인형`과 `적립형` 같은 benefit group title 아래에 조건 row를 반복한다. 각 row의 오른쪽에는 적용 대상이나 멤버십 등급을 나타내는 badge cluster가 붙는다.

이 reference는 브랜드 hero가 아니다. 브랜드 정체성이나 설명이 아니라, 사용자가 "어떤 조건으로 어떤 혜택을 받을 수 있는지"를 비교 가능한 row 구조로 읽게 하는 영역이다.

## Structure Example

- Area
  - `Pagestack`: benefit information section wrapper
    - `TitleSection`: 혜택 정보
    - `CardContentsLine`: benefit condition card
      - `TitleContents`: benefit group title, e.g. 할인형
      - `ListText`: benefit condition row
        - left text: condition summary
        - right item: tier/condition badge cluster
      - repeated `ListText`
      - internal `Divider`
      - `TitleContents`: benefit group title, e.g. 적립형
      - repeated `ListText`

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 `혜택 정보`처럼 area의 판단 목적을 명확히 말한다.
- 혜택 조건은 bordered card 안에 둔다. row를 screen background에 직접 흩뿌리지 않는다.
- 할인, 적립, 사용처럼 혜택 유형이 달라지면 `TitleContents` group title로 구분한다.
- 같은 유형 안의 조건은 `ListText` row 반복으로 표현한다.
- row left는 조건 summary를 짧게 둔다.
- row right는 멤버십 등급, 적용 대상, 사용 가능 등급 같은 보조 조건 badge cluster로 둔다.
- 서로 다른 benefit group 사이에는 card 내부 divider를 둔다.
- 혜택 조건 row는 CTA가 아니다. 누르면 선택되는 option row처럼 보이게 하지 않는다.

## SourceSpec Additions

SourceSpec이 혜택 상세를 평문으로 제공하더라도, 조건 비교를 위해 아래 보강은 허용된다.

- benefit group title: 할인형, 적립형, 사용형
- 조건 row: 금액 기준, 할인액, 적립액, 사용 가능 조건
- tier/condition badge: VIP, Gold, Silver, 전체, 대상 등급
- group 사이의 internal divider
- 반복 row가 2개 이상일 때 card grouping

## Component Candidates

- `Pagestack` section
- `TitleSection`
- `CardContentsLine`
- `TitleContents`
- `ListText`
- right item badge cluster
- internal `Divider`

## Avoid

- 이 area를 브랜드 인지용 `area-product-benefit-brand-hero`로 분류하지 않는다.
- 할인/적립 조건을 hero, coupon, nearby store section에 섞지 않는다.
- 각 조건 row를 radio/select option처럼 만든다.
- 등급 badge를 primary action이나 coupon button처럼 보이게 하지 않는다.
- group title 없이 모든 조건을 한 리스트로 평면 나열하지 않는다.
- 긴 유의사항이나 이용 조건 전문을 이 card 안에 넣지 않는다. 정책성 copy는 별도 notice/accordion area에서 다룬다.
