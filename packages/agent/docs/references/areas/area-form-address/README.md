---
id: area-form-address
situation: 사용자가 주소를 입력하거나 조회된 주소를 확인한 뒤 상세 주소를 보강한다
whenToUseThisReference: SourceSpec에 주소, 우편번호, 배송지, 설치 주소, 가입자 주소처럼 주소성 field group이 있고 외부 주소 조회 또는 상세 주소 보강이 필요할 때 사용한다
tags:
  - area-pattern
  - form-address
  - address-lookup
  - readonly-address
  - field-local-action
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23492`
- Capture: `source/area-form-address.png`

## Area Pattern

주소 입력은 단일 `TextField`가 아니라 lookup과 보강이 결합된 field group으로 본다. SOT에서는 `Pagestack` section 안에 주소 관련 field를 묶고, 우편번호 조회 action과 조회된 주소, 사용자가 직접 보강하는 상세 주소를 같은 area 안에서 순서대로 제공한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 주소의 업무 의미를 드러낸다.
  - 예: `가입자 주소`, `배송지 주소`, `설치 주소`
- 첫 field는 우편번호/주소 검색 entry로 두고 field-local action을 함께 둔다.
- 조회된 기본 주소는 readonly 또는 disabled field로 보여준다.
- 사용자가 직접 입력해야 하는 상세 주소는 editable/typed field로 기본 주소 뒤에 둔다.
- 주소 field group 안에서는 row divider를 끼우지 않고 field stack rhythm으로 연결한다.
- 주소 찾기 action은 해당 field group의 보조 action이며 screen-level CTA와 분리한다.

## SourceSpec Additions

SourceSpec이 주소성 field를 하나만 제공하더라도, 주소 입력 완성에 필요한 아래 보강은 허용된다.

- 우편번호 또는 주소 검색 field
- `주소 찾기` 같은 field-local lookup action
- 조회된 기본 주소를 보여주는 readonly/disabled field
- 상세 주소를 입력하는 editable field
- 주소 입력 목적을 설명하는 짧은 helper text

## Component Candidates

- `Pagestack` section
- `TitleSection`
- `TextField`
- readonly/disabled `TextField`
- typed/editable `TextField`
- field-local `Button`
- helper text

## Avoid

- 주소 검색 action을 bottom primary CTA로 승격하지 않는다.
- 우편번호, 기본 주소, 상세 주소를 서로 다른 screen section으로 과도하게 분리하지 않는다.
- 조회된 기본 주소를 사용자가 직접 입력해야 하는 field처럼 보이게 하지 않는다.
- 상세 주소 입력 field를 생략하지 않는다. SourceSpec에 상세 주소가 명시되지 않아도 주소 보강 여지가 있으면 후보로 둔다.
- source에 없는 지도, 카드, 배너 같은 장식성 address module을 추가하지 않는다.
