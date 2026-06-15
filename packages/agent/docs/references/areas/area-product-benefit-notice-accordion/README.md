---
id: area-product-benefit-notice-accordion
situation: 사용자가 제휴 브랜드 혜택의 이용 방법, 제한 조건, 문의처 같은 긴 정책성 안내를 확인한다
whenToUseThisReference: SourceSpec에 이용 방법, 유의 사항, 문의, 고객센터, SNS, 홈페이지처럼 긴 안내 copy가 있고 브랜드 혜택 상세 화면에서 접고 펼칠 수 있는 notice section이 필요할 때 사용한다
tags:
  - area-pattern
  - product-benefit
  - notice
  - accordion
  - policy-copy
  - contact-info
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:98078`
- Capture: `source/area-product-benefit-notice-accordion.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product benefit notice accordion은 브랜드 혜택 상세 화면에서 긴 정책성 copy를 처리하는 area다. SOT에서는 `Pagestack` section 안에 `AccordionNoticeInfo`를 두고, 펼쳐진 상태에서 `이용 방법`, `유의 사항`, `문의` 같은 group title과 bullet body를 반복한다.

이 reference는 혜택 조건 card가 아니다. 할인액이나 적립률처럼 비교해야 하는 핵심 조건은 `area-product-benefit-info-card`가 담당하고, 이 area는 이용 제한, 제시 방법, 횟수 제한, 예외 상품, 문의 채널처럼 긴 안내를 낮은 위계로 정리한다.

## Structure Example

- Area
  - `Pagestack`: notice section wrapper
    - `TitleSection`: 유의사항 및 문의
    - `AccordionNoticeInfo`: expanded notice wrapper
      - accordion title row
      - chevron/collapse icon
      - `ListText`: group title, e.g. 이용 방법
      - bullet body rows
      - spacing
      - `ListText`: group title, e.g. 유의 사항
      - bullet body rows
      - spacing
      - `ListText`: group title, e.g. 문의
      - contact bullet rows

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- 긴 정책성 copy는 `AccordionNoticeInfo` 안에 둔다. 일반 card나 hero 영역에 직접 노출하지 않는다.
- section title과 accordion title은 같은 의미를 반복해도 허용된다. section은 화면 스캔용, accordion title은 접힘 상태의 affordance다.
- 안내 body는 group title과 bullet body로 나눈다.
- `이용 방법`, `유의 사항`, `문의`처럼 성격이 바뀌면 spacing으로 group을 구분한다.
- 문의 정보는 대표전화, 홈페이지, SNS 같은 channel row로 유지하고 CTA button으로 승격하지 않는다.
- text가 길어도 혜택 조건 row와 섞지 않는다. 조건 비교는 별도 혜택 정보 area에서 처리한다.

## SourceSpec Additions

SourceSpec이 정책성 문장을 평문으로 제공하더라도, 긴 안내를 읽기 쉽게 만들기 위해 아래 보강은 허용된다.

- 이용 방법 group
- 유의 사항 group
- 문의/contact group
- bullet list treatment
- accordion expanded/collapsed affordance
- 대표전화, 홈페이지, SNS 같은 contact channel rows

## Component Candidates

- `Pagestack` section
- `TitleSection`
- `AccordionNoticeInfo`
- accordion title row
- chevron/collapse icon
- `ListText`
- bullet text rows
- spacing between notice groups

## Avoid

- 이 area를 혜택 조건을 비교하는 `area-product-benefit-info-card`로 분류하지 않는다.
- 긴 정책성 copy를 brand hero, coupon card, nearby store section에 섞지 않는다.
- 문의 채널을 primary CTA로 승격하지 않는다.
- bullet body를 모두 같은 위계의 flat paragraph로 붙이지 않는다.
- source에 없는 결제, 동의, 약관 gate를 추가하지 않는다.
- notice text를 과하게 요약해 제한 조건이나 예외 조건을 누락하지 않는다.
