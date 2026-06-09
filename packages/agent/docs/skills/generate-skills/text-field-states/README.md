---
id: text-field-states
stage: compose
task: screen-generation
role: field-state
priority: recommended
---

# text-field-states

입력/표시 정보는 동일한 TextField로 평탄화하지 않고 시각 상태로 구분한다. Figma SOT는 read-only 정보와 editable 정보를 상태로 구분한다(`TextFieldDisabled` vs `TextFieldTyped`). (근거: `docs/design/reference/figma-sot-observations.md` §4.5, §4.7)

## Rule

- read-only/기존 정보 확인 = `componentTextField`의 disabled 상태. 사용자가 수정하지 않는 값.
- 사용자가 입력/수정하는 값 = typed 상태(편집 가능).
- 보조 설명이 필요한 field는 help text를 함께 둔다(예: "주 생활지역 주소가 왜 필요한지").
- source/screenIntent가 async·form·검증 surface를 드러내면 필요한 state(disabled, typed, help, validation/error)를 누락하지 않는다. 단 모든 화면에 모든 state를 강제하지 않는다 — surface가 암시할 때만.

## Composition hint

- 주소 입력은 단일 field가 아니라 `우편번호(disabled) + 주소 찾기 button + 기본 주소(disabled) + 상세 주소(typed)` 조합 패턴으로 본다.
- validation/error placement는 해당 field 근처에 둔다.

## Anti-pattern

- 모든 정보를 typed TextField로 균질 처리하지 않는다 — 확인용 정보와 입력용 정보의 상태 구분이 사라진다.
