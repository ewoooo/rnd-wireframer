---
id: screen-option-configuration
situation: 사용자가 선택한 상품을 기준으로 할인, USIM/eSIM, 배송 방법, 보상, 배송지 같은 추가 옵션을 섹션별로 선택하거나 보강해 다음 단계로 진행한다
whenToUseThisReference: SourceSpec에 상품/요금 summary와 여러 독립 option group, 배송/보상/주소 관련 추가 입력이 함께 있고 최종 확정보다 옵션 구성과 다음 단계 진행이 주요 task일 때 사용한다
tags:
  - screen-pattern
  - option-configuration
  - product-summary
  - multi-section-selection
  - progression-cta
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23501`
- Capture: `source/screen-option-configuration.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Screen Pattern

SourceSpec에 선택된 상품 summary가 먼저 있고, 이후 여러 독립 option group을 선택하거나 보강해야 하면 `screen-option-configuration` pattern으로 본다.

이 pattern은 단일 정보를 입력하는 form도 아니고, 결제 직전의 final confirmation도 아니다. 사용자는 상품을 바꾸는 것이 아니라 이미 선택한 상품을 기준으로 할인, USIM/eSIM, 배송 방식, 보상, 배송지 같은 주문 옵션을 구성해 다음 단계로 이동한다.

## Structure Example

- Screen
  - Header: `StatusBar` + `AppBar`(`추가 정보 입력`)
  - Contents
    - `Sheet`: 선택 상품/월 납부금액 summary
    - `Pagestack`: 결합 할인
      - `ListSelected`: radio option rows
    - `Divider`: section
    - `Pagestack`: USIMㆍ이심(eSIM)
      - `ListSelected`: radio option rows
      - `Callout`: 기존 USIM 사용 안내
    - `Divider`: section
    - `Pagestack`: 휴대폰 배송 방법
      - `ListSelected`: radio option rows
    - `Divider`: section
    - `Pagestack`: 배송지/수령 정보
      - `ListSelected`: 가입자 정보와 동일
      - labeled `TextField`: 받으시는 분 / 연락처
      - disabled `TextField` + field-local `Button`: 우편번호/주소 찾기
      - disabled `TextField`: 조회된 기본 주소
      - typed `TextField`: 상세 주소
    - `Divider`: section
    - `Pagestack`: 바로보상 안내
      - `ListText`: 보상 요약
      - `TextField`: 보상 입력/조회
      - field-local `Button`: 바로보상 신청
      - `Callout`: 바로보상 설명
    - `Divider`: section
    - `Pagestack`: T기프트 배송 정보
      - `ListSelected`: 가입자 정보와 동일
      - labeled fields + address lookup fields
  - Bottom: primary `ActionButton`(`다음`)

SOT의 핵심은 "여러 선택 row가 있는 화면"이 아니라, 상품 summary를 기준으로 서로 다른 주문 옵션을 독립 section으로 나누고 마지막에 다음 단계 CTA로 진행시키는 것이다.

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- `Header`는 `StatusBar` + `AppBar` 구조를 쓴다.
- `Contents`의 첫 영역은 현재 선택된 상품/가격 summary를 보여주는 `Sheet` 또는 equivalent summary area로 둔다.
- 이후 영역은 `Pagestack` section 반복을 기본 골격으로 쓴다.
- option group은 하나의 `Pagestack` 안에서 `ListSelected` radio rows로 표현한다.
- 서로 다른 option group 사이에는 full-width section divider를 둔다.
- 안내성 보강은 해당 option group 내부의 `Callout`으로 둔다. 독립 banner나 marketing block으로 승격하지 않는다.
- 배송지/수령 정보처럼 선택 row와 입력 field가 함께 오는 경우, 동일 정보 재사용 row를 먼저 두고 field stack을 뒤에 둔다.
- `Bottom`은 고정 `ActionButton` 하나로 screen-level progression을 담당한다.

## SourceSpec Additions

SourceSpec이 직접 component를 명시하지 않아도, 옵션 구성 흐름을 이해시키기 위해 아래 보강은 허용된다.

- 선택 상품 summary: 상품명, 월 납부금액, 약정/할인 상태처럼 이후 옵션 선택의 기준이 되는 정보를 상단에 둔다.
- radio option rows: 결합 할인, USIM/eSIM, 배송 방법처럼 상호 배타적인 선택지는 `ListSelected` 반복으로 표현한다.
- option-local 안내: 특정 선택지의 조건, 기존 USIM 사용 가능 여부, 보상 신청 조건은 해당 section 내부 `Callout`으로 둔다.
- 동일 정보 재사용 선택: 가입자 정보와 동일, 배송지와 동일처럼 기존 정보를 재사용할 수 있으면 field stack보다 먼저 둔다.
- field-local 보조 action: 주소 찾기, 보상 신청, 조회 같은 action은 관련 field group 안에 둔다.

## Area And Component Candidates

- `Sheet` product summary
- `Pagestack` section
- `TitleSection`
- `ListSelected` radio option rows
- `Callout`
- `ListText`
- `TextField`
- readonly/disabled `TextField`
- field-local `Button`
- area reference: `area-product-summary-sheet`
- area reference: `area-radio-option-group`
- area reference: `area-linked-recipient-address-field`
- area reference: `area-compensation-application`
- bottom `ActionButton`

## Avoid

- 옵션 구성 화면을 결제 직전 `detail-confirmation`처럼 summary-first final review로 만든다.
- 모든 option group과 배송/보상 입력을 하나의 section에 평면 나열한다.
- radio option group을 별도 `list-selection` screen으로 분리해 현재 화면의 progression 흐름을 끊는다.
- source에 없는 장식 card, banner, marketing block을 추가한다.
- USIM 안내나 보상 안내 같은 보조 정보를 화면 상단 hero나 독립 promotional area로 승격한다.
- 주소 찾기, 보상 신청 같은 field-local action을 하단 primary CTA로 승격한다.
- area 내부의 세부 field composition을 screen reference에서 고정한다. screen reference는 section 배열과 area 후보만 제시하고, area 내부 구조는 별도 area reference가 담당한다.
