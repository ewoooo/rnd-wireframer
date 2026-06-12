---
id: area-completion-result-summary
situation: 사용자가 개통, 요금제 변경, 신청 처리 같은 주요 업무를 완료했고 결과 headline과 핵심 결과값을 같은 area에서 확인해야 한다
whenToUseThisReference: SourceSpec에 완료/변경/개통 같은 result state와 함께 휴대폰, 요금제, 납부금액, 적용일, 혜택처럼 완료 결과를 확인할 key-value summary가 있을 때 사용한다
tags:
  - area-pattern
  - completion-result
  - result-summary
  - title-main-complete
  - summary-card
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10090:58795`
- Figma node: `10090:58800`
- Capture: `source/completion-result-summary-activation.png`
- Capture: `source/completion-result-summary-plan-change.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

완료 결과 요약 area는 완료 headline과 핵심 결과값 확인을 한 묶음으로 제공한다. SOT에서는 `Pagestack` 안에 `TitleMain` Complete variant로 완료 결과를 먼저 선언하고, `ContentsSlot`에 `CardContentsFilled` summary card를 붙여 사용자가 결과 세부값을 바로 확인하게 한다.

이 reference는 완료 메시지만 필요한 `area-completion-hero`보다 정보 밀도가 높다. 완료 후 사용자가 실제 적용된 상품, 요금, 적용일, 혜택, 기기 정보 같은 결과값을 확인해야 할 때 사용한다.

## Structure Example

- Area
  - `Pagestack`: completion/result summary section wrapper
    - `ContentsTitle`
      - `TitleMain` Complete variant: 완료 headline
        - optional title sub text: 대상 기기/상품 같은 context
        - title lines: 완료 사실
        - sub text: 결과 의미나 사용 가능 상태
    - `ContentsSlot`
      - `CardContentsFilled`: result summary card
        - `TitleContents`: summary group title
        - `ListText`: key-value result row
        - `ListText`: key-value result row
        - optional navigable `ListText`: 상세로 이동 가능한 row

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack`을 기본으로 쓴다.
- completion/result 문장은 `ContentsTitle` 안의 `TitleMain` Complete variant로 표현한다.
- `ContentsSlot`은 숨기지 않고, 한 개의 summary card를 둔다.
- summary card는 `CardContentsFilled` 안에 `TitleContents` + `ListText` row 반복으로 구성한다.
- row는 결과 확인에 필요한 key-value 항목만 둔다.
  - 예: 휴대폰 / 요금제 / 납부금액
  - 예: 선택 약정 할인 금액 / 공유 데이터 / 적용일
- 상세 확인이 필요한 항목은 row 우측에 value 대신 chevron/action affordance를 둘 수 있다.
- summary card는 완료 headline을 보강하는 결과 확인 영역이며, 별도 marketing card나 혜택 배너가 아니다.

## SourceSpec Additions

SourceSpec이 완료 상태와 일부 결과값만 제공하더라도, 완료 결과 확인에 필요한 아래 보강은 허용된다.

- 완료 사실을 나타내는 high-emphasis title line
- 대상 기기, 상품, 사용자명처럼 source에 있는 context를 title sub text로 표시
- 완료 후 사용 가능 상태나 절감/가치 효과를 짧은 sub text로 표시
- source에 있는 결과값을 `CardContentsFilled`의 key-value row로 재구성
- 상세가 필요한 결과 항목의 chevron/action affordance

## Component Candidates

- `Pagestack` result section
- `ContentsTitle`
- `TitleMain` Complete variant
- `ContentsSlot`
- `CardContentsFilled`
- `TitleContents`
- `ListText`
- optional chevron/action affordance

## Avoid

- 결과 summary card가 없으면 `area-completion-hero`를 사용한다.
- 완료 결과를 낮은 위계의 `TitleSection` + `ListText` status area로 만들지 않는다.
- summary card 안에 CTA, 배너, 추천 상품, 마케팅 문구를 섞지 않는다.
- source에 없는 금액, 상품명, 혜택 값을 만들어 넣지 않는다.
- 여러 개의 card를 한 area 안에 반복하지 않는다. 카드가 여러 개 필요하면 별도 area로 분리한다.
