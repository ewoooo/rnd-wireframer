---
id: screen-activation-completion-summary
situation: 사용자가 휴대폰 개통을 완료한 뒤 개통된 기기, 요금제, 납부금액을 확인하고 데이터 이전 또는 확인 action을 선택한다
whenToUseThisReference: SourceSpec에 개통 완료 상태와 기기/요금제/납부금액 같은 핵심 결과값, 그리고 데이터 이전 같은 완료 후 follow-up action이 있으면 사용한다
tags:
  - screen-pattern
  - activation-completion
  - completion-result
  - result-summary
  - follow-up-actions
sotNodeRef: 10090:58791
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58791`
- Capture: `source/screen-activation-completion-summary.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Screen Pattern

SourceSpec에 휴대폰 개통 완료 headline, 개통 결과 summary, 완료 후 데이터 이전/확인 action이 함께 있으면 `screen-activation-completion-summary` pattern으로 본다.

이 pattern은 결제 완료 상세 화면이 아니다. 사용자는 이미 개통을 끝냈고, 화면은 개통 성공을 확인시킨 뒤 실제 적용된 기기/요금제/납부금액을 짧게 요약한다. 하단 action도 결제 실행이 아니라 데이터 이전 같은 후속 이용 action과 확인 action을 제공한다.

## Structure Example

- Screen
  - Header: `StatusBar` + close-only `AppBar`
  - Contents
    - `Pagestack`: activation completion result summary
      - `TitleMain` Complete variant
        - optional device context
        - activation completion headline
        - short availability sub text
      - `CardContentsFilled`
        - `TitleContents`: 개통 정보
        - `ListText`: device row
        - `ListText`: plan row
        - `ListText`: monthly payment row
  - Bottom: fixed `ActionButton`
    - helper text for follow-up action
    - leading icon
    - data-transfer action
    - confirm action

SOT의 핵심은 완료 headline 하나가 아니라, 개통 완료 상태와 실제 적용 결과를 한 화면에서 확인시키고 하단에서 다음 행동을 선택하게 하는 compact completion flow다.

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- `Header`는 `StatusBar` + close-only `AppBar` 구조를 쓴다.
- `Contents`는 단일 completion summary `Pagestack`을 기본으로 한다.
- 완료 사실은 `TitleMain` Complete variant 수준으로 먼저 말한다.
- 기기명/모델명 같은 source context는 headline 위의 title sub text로 둘 수 있다.
- 개통 결과값은 `CardContentsFilled` summary card 안에 `TitleContents`와 key-value `ListText` rows로 구성한다.
- summary card에는 휴대폰, 요금제, 납부금액처럼 개통 완료 후 즉시 확인해야 하는 핵심 결과만 둔다.
- `Bottom`은 fixed `ActionButton`으로 두되, 데이터 이전 같은 post-completion follow-up action과 확인 action을 제공한다.
- 결제 ledger, 배송지, 추천 상품, 안내 bullet이 필요하면 `screen-payment-completion-detail`을 검토한다.

## SourceSpec Additions

SourceSpec이 개통 완료와 일부 결과값만 제공하더라도, 완료 후 확인 흐름을 이해시키기 위해 아래 보강은 허용된다.

- activation completion headline
- device or model context
- availability sub text
- activation information summary title
- device row
- plan row
- monthly payment row
- fixed bottom data-transfer and confirm actions

## Area And Component Candidates

- `StatusBar`
- area reference: `area-close-only-app-bar`
- area reference: `area-completion-result-summary`
- `Pagestack` result section
- `TitleMain` Complete variant
- `CardContentsFilled`
- `TitleContents`
- `ListText`
- area reference: `area-activation-completion-data-transfer-action-bar`

## Avoid

- 이 화면을 결제 완료 상세 화면으로 분류하지 않는다.
- 결제 ledger, 배송지 정보, 추천 상품 carousel, 안내 bullet을 임의로 추가하지 않는다.
- summary card 안에 CTA, 배너, 마케팅 문구를 섞지 않는다.
- 하단 action을 `결제하기` 같은 irreversible payment execution CTA로 만들지 않는다.
- source에 없는 기기명, 요금제, 납부금액을 만들어 넣지 않는다.
