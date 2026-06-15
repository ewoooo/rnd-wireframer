---
id: area-product-benefit-coupon-card
situation: 사용자가 제휴 브랜드 상세 화면에서 받을 수 있거나 사용할 수 있는 쿠폰 혜택을 확인하고 card-local action을 수행한다
whenToUseThisReference: SourceSpec에 쿠폰명, 적용 대상, 쿠폰 유형, 만료까지 남은 기간, 사용/받기 같은 local action이 있고 브랜드 혜택 상세 화면의 쿠폰 section이 필요할 때 사용한다
tags:
  - area-pattern
  - product-benefit
  - coupon
  - local-action
  - brand-logo-card
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98084`
- Capture: `source/area-product-benefit-coupon-card.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product benefit coupon card는 브랜드 혜택 상세 화면에서 관련 쿠폰 하나를 보여주고, `사용`이나 `받기` 같은 card-local action을 제공하는 area다. SOT에서는 `Pagestack` section 안에 rounded coupon card를 두고, 왼쪽에는 브랜드 로고와 쿠폰 메타/제목/badge를, 오른쪽에는 작은 pill button을 배치한다.

이 reference는 screen-level progression CTA가 아니다. 쿠폰 action은 해당 coupon card에 종속된 보조 action이며, 화면 전체의 다음 단계나 결제 실행으로 승격하지 않는다.

## Structure Example

- Area
  - `Pagestack`: coupon benefit section wrapper
    - `TitleSection`: 쿠폰 혜택
    - coupon card
      - brand logo thumbnail
      - target/eligibility text
      - coupon title
      - coupon type badge
      - remaining period badge
      - local action `Button`

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- coupon card는 단일 rounded card로 묶는다.
- brand logo는 coupon identity를 보조하는 thumbnail이다. hero image로 확장하지 않는다.
- 대상/등급 조건은 coupon title보다 낮은 위계의 meta text로 둔다.
- coupon title은 사용자가 받을 혜택을 직접 이해할 수 있게 card의 주요 text로 둔다.
- coupon type, remaining period, status는 small badge로 둔다.
- `사용`, `받기`, `쿠폰 받기` 같은 action은 card 오른쪽의 local button으로 둔다.
- 이 area 안에는 쿠폰 사용 유의사항 전문을 넣지 않는다. 긴 정책성 copy는 notice accordion area가 담당한다.

## SourceSpec Additions

SourceSpec이 coupon 정보를 부분적으로 제공하더라도, 쿠폰 card를 이해시키기 위해 아래 보강은 허용된다.

- brand logo 또는 브랜드 initials thumbnail
- coupon 대상/등급 meta
- coupon title
- coupon type badge
- D-day, 만료일, 사용 가능 상태 badge
- card-local action button

## Component Candidates

- `Pagestack` section
- `TitleSection`
- coupon card
- `.ThumbnailLogoItem`
- `.CardText`
- `.Badge`
- local `Button`

## Avoid

- 쿠폰 action을 fixed bottom CTA나 screen-level primary action으로 승격하지 않는다.
- 쿠폰 card를 브랜드 hero나 관련 브랜드 card와 같은 위계로 만들지 않는다.
- 쿠폰 사용 유의사항 전문을 card 안에 길게 넣지 않는다.
- 만료 badge를 혜택 유형 badge나 멤버십 tier badge와 혼동하지 않는다.
- source에 없는 결제, 약관 동의, 주문 확정 action을 추가하지 않는다.
