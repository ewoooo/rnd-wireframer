---
id: area-payment-completion-delivery-info
situation: 사용자가 결제를 완료한 뒤 배송 받을 사람, 연락처, 주소, 배송 메모를 한 area에서 확인한다
whenToUseThisReference: SourceSpec에 결제 완료 후 배송지 정보가 있고 받는 분, 휴대폰 번호, 주소지, 배송 메모를 읽기 전용 section으로 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - payment-completion
  - delivery-info
  - address-summary
  - key-value-list
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58808`
- Capture: `source/area-payment-completion-delivery-info.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Payment completion delivery info는 결제 완료 화면에서 배송 받을 정보를 읽기 전용으로 확인하는 area다. SOT에서는 `Pagestack` 안의 `TitleSection`에 `배송지 정보`를 표시하고, `ContentsSlot`에 `ListText` key-value rows를 반복한다. 주소처럼 긴 값은 right item 안에서 multi-line text로 처리한다.

이 reference는 배송지 입력 form이나 배송지 선택 list가 아니다. 사용자는 이미 결제를 완료했고, 이 area는 확정된 배송 정보를 확인시키는 post-completion summary다.

## Structure Example

- Area
  - `Pagestack`: delivery information section wrapper
    - `TitleSection`: 배송지 정보
    - `ContentsSlot`
      - `ListText`: recipient row
      - `ListText`: phone number row
      - `ListText`: address row with multi-line right value
      - `ListText`: delivery memo row

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- section title은 `TitleSection`으로 두고 배송지 정보의 읽기 전용 summary임을 명확히 한다.
- row는 `ListText` key-value 구조를 반복한다.
- label은 left item, 값은 right item에 배치해 scan 방향을 일정하게 유지한다.
- 주소처럼 긴 값은 right item 안에서 multi-line text를 허용한다.
- 개인정보 row는 action이나 link처럼 보이지 않게 read-only text로 표현한다.
- 결제 완료 후 확인용 area이므로 배송지 변경 CTA, 주소 검색, 입력 field, validation error를 포함하지 않는다.

## SourceSpec Additions

SourceSpec이 배송지 정보 일부만 제공하더라도, 결제 후 확인 흐름을 이해시키기 위해 아래 보강은 허용된다.

- recipient row
- phone number row
- address row
- delivery memo row
- multi-line value rendering for long address text

## Component Candidates

- `Pagestack`
- `TitleSection`
- `ContentsSlot`
- `ListText`
- key-value row
- multi-line right item text

## Avoid

- 이 area를 배송지 입력 form으로 사용하지 않는다.
- 배송지 선택 list, 주소 검색, 변경 CTA, 저장 action을 넣지 않는다.
- 결제 금액 ledger, 상품 혜택, 추천 상품, 안내 bullet을 이 area 안에 섞지 않는다.
- 주소 값을 왼쪽 label 영역에 넣거나 label/value 정렬을 row마다 바꾸지 않는다.
- source에 없는 개인정보나 배송 메모를 만들어 넣지 않는다.
