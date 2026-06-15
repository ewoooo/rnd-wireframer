---
id: area-activation-completion-data-transfer-action-bar
situation: 사용자가 휴대폰 개통을 완료한 뒤 사진, 연락처, 앱을 새 휴대폰으로 옮길지 선택하고 완료 화면을 확인한다
whenToUseThisReference: SourceSpec에 개통 완료 후 데이터 이전을 유도하는 helper text와 데이터 이전/확인 action이 fixed bottom bar로 제공되어야 할 때 사용한다
tags:
  - area-pattern
  - activation-completion
  - data-transfer
  - bottom-action
  - fixed-action-bar
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10069:144385`
- Capture: `source/area-activation-completion-data-transfer-action-bar.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Activation completion data transfer action bar는 개통 완료 화면의 bottom chrome에 고정되는 follow-up action area다. SOT에서는 `ActionButton` wrapper가 상단 border와 blur/white background를 만들고, 먼저 helper text로 데이터 이전을 제안한 뒤 brand-filled button 하나 안에 icon, `데이터 옮기기`, divider, `확인` label을 배치한다.

이 reference는 결제 완료 후 구독 탐색 action이 아니다. 사용자는 이미 개통을 마쳤고, bottom action은 새 휴대폰으로 사진/연락처/앱을 옮기는 후속 이용 action과 완료 확인을 제공한다.

## Structure Example

- Bottom area
  - `ActionButton`: fixed bottom wrapper
    - helper text: data transfer prompt
    - brand-filled button
      - leading icon
      - data transfer action label
      - internal vertical divider
      - confirm label

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- 이 reference는 `Screen.Bottom` 또는 fixed bottom action area에 배치한다.
- bottom wrapper는 화면 content와 구분되는 surface, top border, safe-area padding을 가진다.
- helper text는 button 위에 두고, 데이터 이전의 목적을 짧게 제안한다.
- 내부 action은 하나의 brand-filled bar 안에서 두 label을 divider로 구분한다.
- 왼쪽 action은 데이터 이전, 마이그레이션, 새 기기 설정 같은 post-activation follow-up action으로 둔다.
- 오른쪽 action은 확인, 닫기, 완료 같은 completion confirm action으로 둔다.
- 결제 전 화면의 결제 실행 CTA나 가입 진행 CTA로 사용하지 않는다.
- helper text가 없고 단순 탐색/확인만 있으면 결제 완료 bottom action reference와 구분해 판단한다.

## SourceSpec Additions

SourceSpec이 완료 후 action 일부만 제공하더라도, 데이터 이전 유도 흐름을 이해시키기 위해 아래 보강은 허용된다.

- fixed bottom action wrapper
- data transfer helper text
- leading icon
- data transfer action label
- confirm action label
- internal divider between actions

## Component Candidates

- `ActionButton`
- fixed bottom wrapper
- helper text
- brand-filled button
- leading icon
- internal divider
- data transfer action label
- confirm action label

## Avoid

- 이 area를 결제 전 `결제하기` CTA나 가입 진행 CTA로 사용하지 않는다.
- 데이터 이전 helper text를 summary card나 completion headline 안에 섞지 않는다.
- 두 action을 서로 다른 floating cards로 분리하지 않는다.
- 개통 결과 summary, 결제 ledger, 배송지 정보, 안내 bullet을 bottom action 안에 넣지 않는다.
- source에 없는 주요 action을 추가하지 않는다.
