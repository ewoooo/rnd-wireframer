---
id: area-payment-completion-gift-notice-list
situation: 사용자가 결제를 완료한 뒤 선물 받기 조건, 거절/환불, 이용 제한 같은 안내 문구를 bullet list로 확인한다
whenToUseThisReference: SourceSpec에 결제 완료 후 선물 받기, 쿠폰/바코드 이용, 할인/적립 제한 같은 안내 문구가 있고 제목 있는 bullet list section으로 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - payment-completion
  - gift-notice
  - bullet-list
  - post-completion-notice
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58812`
- Capture: `source/area-payment-completion-gift-notice-list.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Payment completion gift notice list는 결제 완료 후 사용자가 알아야 하는 선물 받기/이용 제한 안내를 bullet list로 제공하는 area다. SOT에서는 `Pagestack` 안의 `TitleSection`에 `선물 받기 안내`를 표시하고, `ContentsSlot`에 일반 텍스트 bullet list를 넣는다. 마지막 항목처럼 설명이 긴 경우 bullet 내부에서 line break를 허용한다.

이 reference는 약관 동의 gate나 결제 전 확인 section이 아니다. 완료 후 읽기 전용 안내이며, action이나 form control 없이 정보 밀도가 높은 notice list를 제공한다.

## Structure Example

- Area
  - `Pagestack`: gift notice section wrapper
    - `TitleSection`: notice title
    - `ContentsSlot`
      - bullet list
        - short notice item
        - repeated notice item
        - long notice item with nested line breaks

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- section title은 `TitleSection`으로 두고 안내 범주를 명확히 한다.
- 안내 본문은 card나 table이 아니라 bullet list로 구성한다.
- 각 bullet은 한 개의 독립 안내 조건 또는 제한 사항을 담는다.
- 긴 안내는 같은 bullet 안에서 줄바꿈을 허용하되, 별도 card나 accordion으로 바꾸지 않는다.
- 완료 후 읽기 전용 안내이므로 checkbox, 동의 CTA, 결제 실행 CTA를 포함하지 않는다.
- 결제 ledger, 배송지 정보, 추천 상품 carousel과는 별도 section으로 유지한다.

## SourceSpec Additions

SourceSpec이 안내 문구 일부만 제공하더라도, 결제 후 확인 흐름을 이해시키기 위해 아래 보강은 허용된다.

- notice section title
- bullet list items
- long item line breaks
- usage limitation details
- refund or gift rejection notice

## Component Candidates

- `Pagestack`
- `TitleSection`
- `ContentsSlot`
- bullet list
- bullet list item
- long text line breaks

## Avoid

- 이 area를 결제 전 약관 동의 영역으로 사용하지 않는다.
- bullet list에 checkbox, radio, toggle, CTA를 추가하지 않는다.
- 안내 문구를 key-value `ListText` ledger나 product card로 바꾸지 않는다.
- 결제 금액, 배송지, 추천 상품을 이 area 안에 섞지 않는다.
- source에 없는 제한 조건이나 환불 규칙을 만들어 넣지 않는다.
