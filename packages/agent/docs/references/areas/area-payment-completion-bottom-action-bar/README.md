---
id: area-payment-completion-bottom-action-bar
situation: 사용자가 결제를 완료한 뒤 다른 구독 탐색과 확인 중 후속 action을 선택한다
whenToUseThisReference: SourceSpec에 결제 완료 후 화면 하단 고정 action으로 보조 탐색 action과 확인 action을 함께 제공해야 할 때 사용한다
tags:
  - area-pattern
  - payment-completion
  - bottom-action
  - fixed-action-bar
  - post-completion-actions
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:144413`
- Capture: `source/area-payment-completion-bottom-action-bar.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Payment completion bottom action bar는 결제 완료 화면의 bottom chrome에 고정되는 후속 action area다. SOT에서는 `ActionButton` wrapper가 상단 border와 blur/white background를 만들고, 내부 brand-filled button 하나 안에 icon, 탐색 action label, divider, 확인 action label을 배치한다.

이 reference는 결제 실행 CTA가 아니다. 사용자는 이미 결제를 마쳤고, bottom action은 다른 구독 탐색과 현재 완료 화면 확인/종료를 제공한다.

## Structure Example

- Bottom area
  - `ActionButton`: fixed bottom wrapper
    - brand-filled button
      - leading icon
      - secondary exploration label
      - internal vertical divider
      - confirm label

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- 이 reference는 `Screen.Bottom` 또는 fixed bottom action area에 배치한다.
- bottom wrapper는 화면 content와 구분되는 surface, top border, safe-area padding을 가진다.
- 내부 action은 하나의 brand-filled bar 안에서 두 label을 divider로 구분한다.
- 왼쪽 action은 탐색/발견 같은 post-completion secondary action으로 둔다.
- 오른쪽 action은 확인, 닫기, 완료 같은 completion confirm action으로 둔다.
- 결제 전 화면의 irreversible payment CTA로 사용하지 않는다.
- header close action과 중복되더라도 역할을 구분한다. header는 화면 닫기, bottom은 후속 선택이다.

## SourceSpec Additions

SourceSpec이 완료 후 action 일부만 제공하더라도, bottom action 판단을 위해 아래 보강은 허용된다.

- fixed bottom action wrapper
- leading icon
- exploration action label
- confirm action label
- internal divider between actions

## Component Candidates

- `ActionButton`
- fixed bottom wrapper
- brand-filled button
- leading icon
- internal divider
- secondary action label
- confirm action label

## Avoid

- 이 area를 결제 전 `결제하기` CTA로 사용하지 않는다.
- 두 action을 서로 다른 floating cards로 분리하지 않는다.
- 결제 ledger, 상품 정보, 배송지 정보, 안내 bullet을 bottom action 안에 넣지 않는다.
- header close icon을 bottom confirm action으로 대체하지 않는다.
- source에 없는 주요 action을 추가하지 않는다.
