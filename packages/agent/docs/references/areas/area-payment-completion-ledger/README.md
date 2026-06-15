---
id: area-payment-completion-ledger
situation: 사용자가 결제를 완료한 직후 완료 headline과 결제수단, 할인 내역, 최종 결제 금액을 한 area에서 확인한다
whenToUseThisReference: SourceSpec에 결제 완료 상태, 결제수단, 구독가/상품가, 할인 내역, 최종 결제 금액이 있고 완료 화면 상단에서 결제 ledger를 함께 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - payment-completion
  - completion-result
  - payment-ledger
  - final-amount
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58803`
- Capture: `source/area-payment-completion-ledger.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Payment completion ledger는 결제 완료 화면의 첫 area다. SOT에서는 `Pagestack` 안의 `ContentsTitle`에 completion headline과 sub text를 두고, `ContentsSlot`에 결제 정보 ledger를 직접 이어 붙인다. ledger는 결제수단, 총액, 할인 내역, 내부 divider, 최종 결제 금액 row로 구성된다.

이 reference는 `area-completion-result-summary`와 다르다. `area-completion-result-summary`는 완료 headline 아래에 별도 summary card를 붙이는 패턴이고, 이 reference는 결제 금액 계산 흐름을 card 없이 ledger row로 노출한다.

## Structure Example

- Area
  - `Pagestack`: payment completion ledger section wrapper
    - `ContentsTitle`
      - `TitleMain` Complete variant: payment completion headline
      - sub text: subscription starts / available now
    - `ContentsSlot`
      - `TitleSection`: 결제 정보
      - emphasized `ListText`: payment method
      - internal `Divider`
      - `ListText`: total price row
      - `ListText`: subscription discount row
      - `ListText`: discount detail row
      - muted nested discount rows
      - internal `Divider`
      - emphasized `ListText`: final payment amount

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- completion headline은 `ContentsTitle`에서 high-emphasis title로 먼저 보여준다.
- 결제 정보는 별도 card로 감싸지 않고 same area의 ledger rows로 둔다.
- 결제수단 row는 ledger의 첫 row로 두고 이후 금액 계산 rows와 internal divider로 구분한다.
- 총액, 할인, 쿠폰, 포인트 같은 계산 항목은 `ListText` key-value row로 반복한다.
- 할인 상세처럼 하위 항목은 muted text로 표현해 상위 할인 row와 위계를 구분한다.
- 최종 결제 금액은 마지막 row로 두고 label과 금액을 모두 강조한다. 금액은 brand color를 사용할 수 있다.
- 결제 완료 후 확인용 area이므로 결제 실행 CTA, 약관 동의, 결제 수단 선택 affordance를 포함하지 않는다.

## SourceSpec Additions

SourceSpec이 완료 상태와 일부 결제값만 제공하더라도, 결제 결과 확인을 위해 아래 보강은 허용된다.

- payment completion headline
- payment completion sub text
- payment method row
- total price row
- discount and coupon rows
- muted nested discount detail rows
- final payment amount emphasis

## Component Candidates

- `Pagestack` result section
- `ContentsTitle`
- `TitleMain` Complete variant
- `TitleSection`
- `ListText`
- internal `Divider`
- muted ledger rows
- final amount emphasis row

## Avoid

- 이 area를 결제 전 `detail-confirmation` ledger로 사용하지 않는다.
- 완료 headline 없이 금액 ledger만 단독으로 두지 않는다.
- ledger를 `CardContentsFilled` summary card로 감싸지 않는다. card가 핵심이면 `area-completion-result-summary`를 검토한다.
- 결제 수단 변경, 약관 동의, 결제 실행 CTA를 넣지 않는다.
- 추천 상품, 배송지 정보, 상품 상세를 이 area 안에 섞지 않는다.
- source에 없는 금액이나 할인 항목을 만들어 넣지 않는다.
