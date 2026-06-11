---
id: area-completion-hero
situation: 사용자가 신청, 변경, 해지, 제출 같은 주요 업무를 완료했고 결과 상태를 화면 상단에서 강하게 확인해야 한다
whenToUseThisReference: SourceSpec에 완료, 성공, 해지 완료, 신청 완료, 접수 완료처럼 사용자의 주 업무가 끝났음을 알리는 result state와 완료 기준일, 종료일, 접수일 같은 보조 메타 정보가 있을 때 사용한다
tags:
  - area-pattern
  - completion-result
  - high-emphasis-status
  - title-main-complete
  - result-hero
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58820`
- Capture: `source/area-completion-hero.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

완료 hero는 사용자가 방금 끝낸 업무의 결과를 가장 먼저 확정해 주는 high-emphasis area다. SOT에서는 `Pagestack` 안에 `ContentsTitle`을 두고, `TitleMain`의 `Complete` variant로 완료 문장을 크게 노출한 뒤 완료일, 종료일, 접수일 같은 보조 메타 정보를 짧은 row로 붙인다.

이 reference는 prerequisite 충족 여부나 낮은 가중치의 상태 안내가 아니다. 화면의 핵심 결과를 대표하는 완료/결과 hero로만 사용한다.

## Structure Example

- Area
  - `Pagestack`: completion/result hero section wrapper
    - `ContentsTitle`: 완료 결과 title group
      - `TitleMain` Complete variant: 완료 headline
        - `TitleText`: 완료 사실
        - `TitleText`: 후속 인사나 결과 보강 문장
      - sub text row: `label | value` 형식의 완료 관련 메타 정보
    - hidden `ContentsSlot`: 이 reference에서는 slot content를 사용하지 않는다

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- completion/result 문장은 `ContentsTitle` 안의 `TitleMain` Complete variant로 표현한다.
- 첫 title line은 완료 사실을 명확하게 말한다.
  - 예: `해지가 완료되었어요`, `신청이 완료되었어요`, `접수가 완료되었어요`
- 두 번째 title line은 필요할 때만 후속 인사, 다음 단계 요약, 결과 보강 문장을 둔다.
- 보조 정보는 title 아래에 한 줄 row로 둔다.
  - 예: `구독 종료일 | 2026.05.06`, `접수일 | 2026.05.06`
- `ContentsSlot`은 숨김 상태로 유지한다. 추가 상세, 혜택 카드, 안내 배너는 별도 area에서 다룬다.
- 이 area는 screen-level CTA나 상세 안내 section을 소유하지 않는다.

## SourceSpec Additions

SourceSpec이 완료 상태만 제공하더라도, 완료 결과를 화면에서 확정하는 데 필요한 아래 보강은 허용된다.

- 완료 사실을 나타내는 high-emphasis title line
- 업무 맥락에 맞는 짧은 보조 title line
- 완료일, 종료일, 접수일, 처리일 같은 단일 메타 row
- 완료 상태에 맞는 `Complete` title treatment

## Component Candidates

- `Pagestack` result section
- `ContentsTitle`
- `TitleMain` Complete variant
- `TitleText`
- sub text row

## Avoid

- 이 reference를 약관 충족, 준비 상태, prerequisite 확인 같은 low-weight status area로 사용하지 않는다.
- 결과 요약 카드가 필요하면 `area-completion-result-summary`를 사용한다.
- 완료 hero 안에 CTA, 상세 설명 카드, 배너, 목록을 섞지 않는다.
- 완료 메타 정보를 여러 row나 복잡한 table로 확장하지 않는다.
- `ContentsSlot`에 source에 없는 장식성 content를 추가하지 않는다.
- 완료 사실보다 날짜나 부가 설명을 더 강하게 보이게 하지 않는다.
