---
id: area-compensation-application
situation: 사용자가 사용하던 휴대폰 반납 보상 조건을 확인하고 기기 검색 후 바로보상을 신청한다
whenToUseThisReference: SourceSpec에 바로보상, 중고폰 반납, 보상 금액, 기기 검색, 신청 action이 함께 있고 보상 안내와 신청 field를 한 section에서 처리해야 할 때 사용한다
tags:
  - area-pattern
  - compensation
  - device-search
  - field-local-action
  - informational-callout
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23513`
- Capture: `source/area-compensation-application.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Compensation application은 보상 제도 안내, 기기 검색 field, 예상 보상 금액, 신청 action, 제도 설명 callout이 한 section 안에서 이어지는 area다. SOT에서는 `Pagestack` 안에 title icon이 있는 `TitleSection`을 두고, right affordance가 있는 `ListText`, `TextField` + 검색 button, 보상금액 row, full-width 신청 `Button`, `Callout` 순서로 구성한다.

이 reference는 단순 안내 area가 아니다. 사용자가 기기를 검색하고 보상 신청 action을 수행할 수 있어야 하므로 field-local action과 section-local 신청 button을 모두 포함한다.

## Structure Example

- Area
  - `Pagestack`: compensation section wrapper
    - `TitleSection`: 바로 보상 안내 + info icon
    - `ListText`: 보상 제도 요약 + right affordance
    - `TextField` + field-local `Button`: 기기 검색
    - helper text: 검색 예시
    - `ListText`: 보상 금액 summary + brand-emphasized amount
    - full-width `Button`: 바로보상 신청
    - `Callout`: 바로보상 설명

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- 보상 제도 자체를 설명하는 첫 row를 먼저 두고, 펼침/상세보기처럼 보이는 right affordance를 붙일 수 있다.
- 기기명 검색 field와 검색 button은 같은 field group 안에 둔다.
- 검색 예시는 field helper text로 낮은 위계에 둔다.
- 예상 보상 금액은 label/value row로 보여주고 금액만 brand emphasis로 강조한다.
- `바로보상 신청`은 section-local action으로 둔다. screen bottom primary CTA와 역할을 섞지 않는다.
- 제도 설명은 마지막 `Callout`에 접어두듯 낮은 위계로 둔다.

## SourceSpec Additions

SourceSpec이 component를 직접 명시하지 않아도, 바로보상 흐름을 이해시키기 위해 아래 보강은 허용된다.

- 보상 제도 요약 row
- 보상 제도 요약 row의 right affordance
- 기기명 검색 field
- `검색` field-local action
- 기기명 입력 예시 helper text
- 예상 보상 금액 row와 brand-emphasized amount
- section-local 신청 button
- 바로보상 조건 설명 `Callout`
- title 옆 info icon

## Component Candidates

- `Pagestack` section
- `TitleSection`
- title icon/info affordance
- `ListText`
- row right affordance
- `TextField`
- field-local `Button`
- helper text
- full-width section `Button`
- `Callout`

## Avoid

- 보상 신청 button을 screen bottom primary CTA로 승격하지 않는다.
- 바로보상 설명을 hero나 marketing banner로 확장하지 않는다.
- 기기 검색 field와 검색 action을 서로 다른 section으로 분리하지 않는다.
- 보상 금액을 최종 결제 금액 ledger처럼 다루지 않는다.
- 단순 공지/상태 통보라면 `area-prerequisite-status`나 completion 계열 reference를 사용한다.
