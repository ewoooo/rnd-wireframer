---
id: area-close-only-app-bar
situation: 사용자가 완료/상세/모달형 화면에서 뒤로가기나 title 없이 우측 닫기 action만 제공받는다
whenToUseThisReference: SourceSpec에 화면을 닫는 단일 action이 있고 header chrome이 title, logo, back action 없이 close icon만 가져야 할 때 사용한다
tags:
  - area-pattern
  - screen-chrome
  - app-bar
  - close-only
  - header
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58815`
- Capture: `source/area-close-only-app-bar.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Close-only AppBar는 본문 content area가 아니라 `Screen.Header`에 들어가는 screen chrome reference다. SOT에서는 `AppBar`가 left item, logo, title을 모두 끄고 right item의 close icon button만 노출한다. 화면 본문이 완료 결과나 상세 내용을 충분히 설명하고, header title이 필요하지 않은 경우에 사용한다.

이 reference는 일반 back navigation AppBar와 다르다. 이전 화면으로 단계 이동하는 affordance가 아니라 현재 화면을 닫거나 완료 흐름을 종료하는 action을 제공한다.

## Structure Example

- Header area
  - `AppBar`: close-only chrome
    - right item
      - icon button
        - close icon

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- 이 reference는 `Screen.Header` 또는 header chrome area에 배치한다.
- `AppBar`의 left item, logo, title은 사용하지 않는다.
- close action은 우측 icon button 하나로 제공한다.
- 본문 title과 중복되는 header title을 만들지 않는다.
- 완료 화면, 닫기 가능한 상세, modal-like flow에서 사용한다.
- 뒤로가기 step navigation이 필요한 화면이면 back AppBar reference를 사용한다.

## SourceSpec Additions

SourceSpec이 닫기 action만 제공하더라도, header chrome 판단을 위해 아래 보강은 허용된다.

- close-only AppBar
- right aligned close icon button
- no header title
- no back action

## Component Candidates

- `AppBar`
- right item
- icon button
- close icon

## Avoid

- 이 reference를 본문 content section으로 사용하지 않는다.
- close icon 옆에 title, logo, back icon을 함께 넣지 않는다.
- back navigation이 필요한 화면에 close-only AppBar를 사용하지 않는다.
- 결제 실행, 확인, 저장 같은 primary CTA를 header close button으로 대체하지 않는다.
- 본문에 있어야 할 완료 headline이나 상세 정보를 AppBar에 넣지 않는다.
