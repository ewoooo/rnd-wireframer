---
id: area-readonly-identity-field
situation: 사용자가 입력을 계속하기 전에 기준이 되는 대상 번호, 고객명, 회선 번호 같은 확정 정보를 읽기 전용 field로 확인해야 한다
whenToUseThisReference: SourceSpec에 기기변경 휴대폰 번호, 가입 대상 번호, 고객명, 회선 번호처럼 사용자가 수정하지 않는 기준 식별값이 있고 form-entry 안에서 독립 section으로 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - readonly-identity
  - reference-field
  - disabled-field
  - form-entry
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23488`
- Capture: `source/area-readonly-identity-field.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

읽기 전용 기준 field는 사용자가 입력할 값이 아니라 이후 입력의 대상이나 기준을 확인시키는 section이다. SOT에서는 `Pagestack` 안에 `TitleSection`으로 기준 정보의 업무 의미를 제목화하고, disabled `TextField` 하나로 확정된 값을 보여준다.

이 pattern의 핵심은 정보를 수집하는 것이 아니라, 남은 입력이 어떤 대상에 적용되는지 사용자에게 고정된 context를 제공하는 것이다.

## Structure Example

- Area
  - `Pagestack`: readonly identity/reference section wrapper
    - `TitleSection`: 기준 정보의 업무 의미
    - disabled `TextField`: 수정할 수 없는 기준값

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 기준값의 업무 의미를 직접 드러낸다.
  - 예: `기기변경 휴대폰 번호`, `가입 대상 번호`, `고객명`, `회선 번호`
- 기준값은 disabled 또는 readonly `TextField`로 보여준다.
- field-local action, clear button, edit affordance를 붙이지 않는다.
- 입력 가능한 field와 같은 area에 섞지 않고 독립 section으로 둔다.
- 이 area는 화면의 기준 context를 고정하는 역할이며, 사용자의 completion task 자체가 아니다.

## SourceSpec Additions

SourceSpec이 기준값을 별도 component로 명시하지 않아도, 입력 흐름을 이해시키기 위해 아래 보강은 허용된다.

- source에 있는 대상 번호, 고객명, 가입 번호, 회선 번호를 readonly field로 표시
- 값이 마스킹돼 있으면 마스킹 상태를 유지
- section title을 source의 업무 용어에 맞게 정리

## Component Candidates

- `Pagestack` section
- `TitleSection`
- disabled `TextField`
- readonly `TextField`

## Avoid

- 사용자가 수정해야 하는 field처럼 보이게 하지 않는다.
- 주소 찾기, 인증 확인 같은 보조 action을 붙이지 않는다.
- 상태 완료 문장만 있는 경우에는 `area-prerequisite-status`를 사용한다.
- 주소 입력/조회가 필요한 경우에는 `area-form-address` 또는 `area-linked-address-field`를 사용한다.
- 기준값을 hero/title처럼 과하게 강조하지 않는다.
