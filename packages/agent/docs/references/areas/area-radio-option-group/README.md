---
id: area-radio-option-group
situation: 사용자가 하나의 업무 질문에 대해 여러 상호 배타적인 선택지 중 하나를 고른다
whenToUseThisReference: SourceSpec에 결합 할인, USIM/eSIM, 배송 방법처럼 같은 주제 안에서 하나만 선택해야 하는 option set이 있고 radio-like 선택 row 반복이 필요할 때 사용한다
tags:
  - area-pattern
  - radio-option-group
  - single-choice
  - list-selected
  - optional-callout
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23505` (`결합 할인`)
- Figma node: `10095:23507` (`USIMㆍ이심(eSIM)`)
- Figma node: `10095:23509` (`휴대폰 배송 방법`)
- Capture: `source/radio-option-group-bundle-discount.png`
- Capture: `source/radio-option-group-usim-esim.png`
- Capture: `source/radio-option-group-delivery-method.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Radio option group은 하나의 section title 아래에서 상호 배타적인 선택지를 `ListSelected` row 반복으로 보여주는 area다. SOT에서는 `Pagestack` 안에 `TitleSection`을 두고, `ContentsSlot`에 `ListSelected`를 2개 이상 세로로 반복한다.

선택지 개수는 업무 주제마다 달라질 수 있다. `결합 할인`은 2개, `USIMㆍ이심(eSIM)`은 3개 + 안내 `Callout`, `휴대폰 배송 방법`은 4개 선택지를 가진다. 이 차이는 별도 area type이 아니라 같은 `area-radio-option-group`의 content variant로 본다.

## Structure Example

- Area
  - `Pagestack`: option group section wrapper
    - `TitleSection`: 선택 주제
    - `ListSelected`: option row
    - `ListSelected`: option row
    - optional `ListSelected`: 추가 option row
    - optional spacing
    - optional `Callout`: 선택 주제에 딸린 안내

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 option group의 질문 또는 업무 주제를 드러낸다.
  - 예: `결합 할인`, `USIMㆍ이심(eSIM)`, `휴대폰 배송 방법`
- option row는 `ListSelected` 반복으로 표현한다.
- 선택지는 상호 배타적이어야 한다. 여러 개를 동시에 고르는 checklist면 이 reference를 쓰지 않는다.
- option row 사이에 별도 divider를 끼우지 않는다. 같은 선택지 묶음은 하나의 rhythm으로 읽히게 둔다.
- 특정 option group에만 필요한 설명은 마지막 선택지 뒤에 spacing을 두고 `Callout`으로 붙인다.
- `Callout`은 option group의 보조 설명이다. 별도 promotional banner나 screen-level notice로 승격하지 않는다.

## SourceSpec Additions

SourceSpec이 component를 직접 명시하지 않아도, single-choice 흐름을 이해시키기 위해 아래 보강은 허용된다.

- option set을 대표하는 section title
- 선택 상태가 보이는 radio-like `ListSelected` row
- 추천, 기본값, 현재 선택 상태를 드러내는 row state
- option group의 조건이나 주의사항을 설명하는 짧은 `Callout`
- 선택지 설명을 보강하는 짧은 sub text

## Component Candidates

- `Pagestack` section
- `TitleSection`
- `ListSelected`
- selected/unselected row state
- spacing
- optional `Callout`

## Avoid

- 같은 주제의 option rows를 서로 다른 section으로 쪼개지 않는다.
- 단일 선택지를 별도 screen-level CTA로 승격하지 않는다.
- option group을 summary/confirmation row처럼 readonly 정보 나열로 만든다.
- 여러 선택지를 동시에 고르는 checkbox group에 이 reference를 적용하지 않는다.
- source에 없는 card, banner, marketing block을 추가하지 않는다.
- `Callout`이 있는 variant를 별도 area type으로 분리하지 않는다. 안내는 같은 `area-radio-option-group`의 optional child로 둔다.
