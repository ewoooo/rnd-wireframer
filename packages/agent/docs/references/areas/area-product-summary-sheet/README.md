---
id: area-product-summary-sheet
situation: 사용자가 이후 옵션을 선택하기 전에 현재 선택한 상품과 월 납부금액을 상단에서 확인한다
whenToUseThisReference: SourceSpec에 선택된 상품명, 썸네일, 월 납부금액, 부가세/할부수수료 같은 가격 보조 정보가 있고 이후 옵션 선택의 기준 summary가 필요할 때 사용한다
tags:
  - area-pattern
  - product-summary
  - price-summary
  - sheet
  - option-context
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23519`
- Capture: `source/area-product-summary-sheet.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Product summary sheet는 옵션 선택 화면의 기준 정보 area다. 사용자가 이후 결합 할인, USIM/eSIM, 배송 방법, 보상, 배송지를 선택할 때 기준이 되는 현재 상품과 월 납부금액을 상단에 짧게 고정한다.

이 reference는 상품 상세 hero가 아니다. 상품을 탐색하거나 설득하는 영역이 아니라, 이미 선택된 상품을 확인하고 필요하면 펼치거나 바꿀 수 있는 compact summary다.

## Structure Example

- Area
  - `Sheet`: product summary wrapper
    - thumbnail/logo
    - product name
    - monthly price
    - price qualifier: `/월`, 부가세/할부수수료 포함
    - optional trailing icon/action

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- screen contents의 첫 area로 둔다.
- 상품명과 월 납부금액을 한 영역 안에서 함께 보여준다.
- 가격이 주요 판단값이므로 상품명보다 금액 위계를 높인다.
- `/월`, 부가세 포함, 할부수수료 포함 같은 조건은 금액 옆의 보조 text로 낮은 위계에 둔다.
- thumbnail은 상품 식별 보조 요소이며, 별도 card나 hero image로 확장하지 않는다.
- trailing icon/action은 summary 상세 보기나 변경 가능성을 암시하는 보조 affordance로만 둔다.

## SourceSpec Additions

SourceSpec이 component를 직접 명시하지 않아도, 옵션 선택 맥락을 유지하기 위해 아래 보강은 허용된다.

- 선택 상품 thumbnail 또는 logo
- 상품명 또는 요금제명
- 월 납부금액
- `/월` 같은 가격 단위
- 부가세, 할부수수료, 약정 조건 같은 짧은 qualifier
- 상세 보기/변경 가능성을 암시하는 trailing icon

## Component Candidates

- `Sheet`
- thumbnail/logo
- product title text
- price text
- price qualifier text
- trailing icon/action

## Avoid

- 이 area를 상품 상세 hero나 marketing card로 확장하지 않는다.
- option group보다 아래에 배치하지 않는다. 이후 선택의 기준이므로 상단에 둔다.
- 가격 보조 문구를 primary price와 같은 위계로 만들지 않는다.
- source에 없는 혜택 badge, banner, promotion block을 추가하지 않는다.
- 최종 결제 금액 ledger처럼 만들지 않는다. 최종 금액 검토는 `detail-confirmation` 계열에서 처리한다.
