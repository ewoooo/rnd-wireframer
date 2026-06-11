---
id: area-prerequisite-status
situation: 사용자가 다음 입력 단계로 진행하기 전에 이미 충족된 선행 조건이나 확인 상태를 짧게 인지해야 한다
whenToUseThisReference: SourceSpec에 본인인증 완료, 조회 완료, 인증번호 확인 완료처럼 진행 중인 flow의 전제 조건이 충족됐음을 보여주는 상태 문장이 있을 때 사용한다
tags:
  - area-pattern
  - prerequisite-status
  - in-flow-status
  - auth-completion
  - readonly-status
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23490`
- Capture: `source/area-prerequisite-status.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

선행 조건 상태는 최종 완료 화면이 아니라 진행 중인 form/progress screen 안의 낮은 위계 section이다. SOT에서는 `Pagestack` 안에 `TitleSection`으로 상태의 업무 의미를 짧게 제목화하고, `ListText` 한 줄로 이미 완료된 prerequisite를 설명한다.

이 pattern의 핵심은 성공을 크게 축하하는 것이 아니라, 사용자가 남은 입력을 계속 진행해도 되는 이유를 확인시키는 것이다. 따라서 `TitleMain`이나 completion hero 대신 `TitleSection` + `ListText` 조합을 우선한다.

## Structure Example

- Area
  - `Pagestack`: 선행 조건/status section wrapper
    - `ContentsTitle`
      - `TitleSection`: 완료된 선행 조건의 이름
    - `ContentsSlot`
      - `ListText`: 완료 상태를 설명하는 짧은 문장

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 완료된 선행 조건의 업무 의미를 직접 드러낸다.
  - 예: `본인인증 완료`, `조회 완료`, `인증번호 확인 완료`
- 상태 설명은 `ListText` 한 줄을 기본으로 한다.
- 이 area는 입력 field나 선택 row와 섞지 않고 독립 section으로 둔다.
- form/progress screen 안에서 다음 입력 group 앞뒤에 배치해 진행 상태를 보강한다.
- final completion screen의 메인 메시지처럼 화면 최상위 title로 승격하지 않는다.

## SourceSpec Additions

SourceSpec이 선행 조건의 결과를 짧게만 제공하더라도, 진행 중인 flow를 이해시키기 위해 아래 보강은 허용된다.

- 완료된 prerequisite 이름을 section title로 정리한다.
- 고객명, 대상 번호, 인증 수단처럼 source에 명시된 확인 대상을 `ListText` 문장에 포함한다.
- 상태 row는 읽기 전용으로 표현한다.
- 이후 입력/진행을 위한 screen-level CTA는 이 area 밖의 bottom action으로 분리한다.

## Component Candidates

- `Pagestack` section
- `ContentsTitle`
- `TitleSection`
- `ContentsSlot`
- `ListText`

## Avoid

- `TitleMain`을 사용해 최종 완료 화면처럼 보이게 하지 않는다.
- 완료 icon, hero card, celebration banner 같은 장식성 completion treatment를 추가하지 않는다.
- 상태 설명을 editable `TextField`나 선택 가능한 row처럼 보이게 하지 않는다.
- 같은 area 안에 남은 입력 field를 함께 넣어 status와 input의 의미 경계를 흐리지 않는다.
- source에 없는 다음 단계 안내, 혜택, 마케팅 문구를 추가하지 않는다.
