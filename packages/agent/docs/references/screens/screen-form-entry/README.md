---
id: screen-form-entry
situation: 사용자가 여러 입력값을 제공하거나 확인된 선행 상태를 바탕으로 남은 정보를 입력해 다음 단계로 진행한다
whenToUseThisReference: SourceSpec에 사용자 입력 field가 여러 개 있고, 입력값들이 서로 다른 의미 단위로 나뉘며, 주요 task가 최종 확정보다 field completion에 가까울 때 사용한다
tags:
  - screen-pattern
  - form-entry
  - input-heavy
  - sectioned-input
  - progression-cta
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23484`
- Capture: `source/screen-form-entry.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Screen Pattern

SourceSpec에 사용자 입력 field가 여러 개 있고, 입력값들이 서로 다른 의미 단위로 나뉘면 `form-entry` screen pattern으로 본다.

이 pattern은 정보를 최종 확인하는 화면이 아니라, 다음 단계 진행에 필요한 정보를 수집하거나 보강하는 화면이다. 따라서 summary-first confirmation 구조보다 field group을 읽기 쉽게 나누는 구조를 우선한다.

## Structure Example

- Screen
  - Header: `StatusBar` + `AppBar`(`가입자 정보 입력`)
  - Contents
    - `Pagestack`: 기기변경 휴대폰 번호
      - disabled `TextField`: 기준 휴대폰 번호
    - `Divider`: section
    - `Pagestack`: 본인인증 완료
      - `ListText`: 인증 완료 상태 문장
    - `Divider`: section
    - `Pagestack`: 가입자 주소
      - disabled `TextField` + field-local `Button`: 우편번호/주소 찾기
      - disabled `TextField`: 조회된 기본 주소
      - typed `TextField`: 상세 주소
    - `Divider`: section
    - `Pagestack`: 주 생활지역
      - `ListSelected`: 가입자 정보와 동일
      - disabled `TextField` + field-local `Button`: 우편번호/주소 찾기
      - disabled `TextField`: 조회된 기본 주소
      - helper text: 5G 가용지역 확인 동의 안내
    - `Divider`: section
    - `Pagestack`: 이메일
      - typed `TextField`: 이메일 주소
  - Bottom: primary `ActionButton`(`다음`)

SOT의 핵심은 "입력 field가 많은 화면"이 아니라, 기준 정보, 인증 완료 상태, 주소 보강, 동일 정보 재사용, 이메일 입력을 각각 독립 section으로 분리하는 것이다.

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- `Header`는 `StatusBar` + `AppBar` 구조를 쓴다.
- `Contents`는 `Pagestack` section 반복을 기본 골격으로 쓴다.
- `Bottom`은 고정 `ActionButton` 하나로 screen-level progression을 담당한다.
- section 사이에는 full-width `4px` divider를 둔다. SOT는 5개 `Pagestack` 사이에 section divider를 둔다.
- 모든 field를 하나의 긴 area에 몰지 않고, 의미 단위가 바뀌면 section을 나눈다.
- field group이 3개 이상이면 section divider로 스캔 경계를 만든다.
- 각 section은 제목을 가져야 한다. 제목 없이 field만 반복하지 않는다.
- 모든 section이 입력 section일 필요는 없다. 기준 휴대폰 번호처럼 disabled field만 있는 section, 본인인증 완료처럼 `ListText` 상태만 있는 section도 독립 `Pagestack`으로 둔다.
- 동일 정보 재사용 row는 주소 field stack 앞에 두고, bottom CTA로 승격하지 않는다.

## SourceSpec Additions

SourceSpec이 직접 component를 명시하지 않아도, 입력 흐름을 이해시키기 위해 아래 보강은 허용된다.

- 이미 확정된 기준 정보 표시: 휴대폰 번호, 가입 대상 번호, 고객명처럼 flow 기준이 되는 값을 readonly 또는 disabled field로 보여준다.
- 선행 조건 완료 상태 표시: 본인인증 완료, 조회 완료, 인증번호 확인 완료처럼 입력 전제 조건이 충족됐음을 짧은 status row 또는 text section으로 보여준다.
- field-local 보조 action: 주소 찾기, 인증 확인, 중복 확인, 재요청 같은 action은 해당 field group 안에 둔다.
- 동일 정보 재사용 선택: 가입자 정보와 동일, 배송지와 동일, 청구지와 동일처럼 기존 정보를 재사용할 수 있으면 별도 입력 field보다 먼저 둔다.
- helper text: 입력 목적, 조회 목적, 동의/확인 목적이 필요한 경우 field group 하단에 짧게 둔다.

## Area And Component Candidates

- `Pagestack` section
- `TitleSection`
- `TextField`
- readonly/disabled `TextField`
- action slot이 있는 `TextField`
- `ListText`
- `ListSelected`
- area reference 후보: `area-auth-completion-status`
- area reference 후보: `area-form-address`
- checkbox-like row
- helper text
- bottom `ActionButton`

## Avoid

- 모든 field를 하나의 section에 평면 나열한다.
- 입력 화면을 summary-first confirmation 화면처럼 만든다.
- source에 없는 장식 card, banner, marketing block을 추가한다.
- 주소 찾기/인증 확인 같은 보조 action을 하단 primary CTA로 승격한다.
- 선행 상태와 사용자 입력 field를 같은 area 안에 섞어 상태/입력 구분을 흐린다.
- `detail-confirmation`으로 분류하지 않는다. 사용자가 정보를 검토하고 확정하는 것이 아니라, 아직 입력/보강해야 할 field가 있다.
- `list-selection`으로 분류하지 않는다. 주요 task가 row 선택이 아니라 field completion이다.
- `completion-feedback`으로 분류하지 않는다. 결과를 알리는 화면이 아니라 다음 단계 전 입력 단계다.
