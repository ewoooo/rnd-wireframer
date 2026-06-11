---
id: area-linked-recipient-address-field
situation: 사용자가 배송지나 수령 정보를 기존 가입자 정보와 동일하게 재사용하거나, 수령자 연락처와 주소를 보강한다
whenToUseThisReference: SourceSpec에 배송지, 수령 정보, T기프트 배송 정보처럼 동일 정보 재사용 선택과 받는 사람/연락처/주소 field stack이 함께 필요할 때 사용한다
tags:
  - area-pattern
  - linked-recipient-address
  - reuse-existing-info
  - recipient-fields
  - address-lookup
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23511` (`배송지`)
- Figma node: `10095:23515` (`T기프트 배송 정보`)
- Capture: `source/linked-recipient-address-shipping.png`
- Capture: `source/linked-recipient-address-gift.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

Linked recipient address field는 기존 가입자 정보를 배송/수령 정보로 재사용할 수 있는 선택 row와, 실제 수령자 field stack을 함께 두는 area다. SOT에서는 `Pagestack` 안에 `TitleSection`, `ListSelected`, 받으시는 분, 연락처, 주소 찾기, 기본 주소, 상세 주소 field가 순서대로 온다.

이 reference는 `area-linked-address-field`보다 범위가 넓다. `area-linked-address-field`가 주소/생활지역 재사용에 집중한다면, 이 reference는 수령자 이름과 연락처까지 포함한 배송/수령 정보 묶음을 담당한다.

SourceSpec에 수령자 이름이나 연락처가 함께 있으면 `area-linked-address-field`보다 이 reference를 우선한다. SOT의 받으시는 분/연락처 field는 사용자가 보강할 수 있는 prefilled typed field에 가깝고, 조회된 우편번호/기본 주소는 readonly/disabled field로 구분된다.

## Structure Example

- Area
  - `Pagestack`: recipient/address section wrapper
    - `TitleSection`: 배송지, 배송 정보, 수령 정보 등
    - optional badge: 배송 같은 업무 구분
    - `ListSelected`: 가입자 정보와 동일
    - prefilled typed `TextField`: 받으시는 분
    - prefilled typed `TextField`: 연락처
    - disabled `TextField` + field-local `Button`: 우편번호/주소 찾기
    - disabled `TextField`: 조회된 기본 주소
    - editable `TextField`: 상세 주소

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- 동일 정보 재사용 row는 수령자 field stack보다 먼저 둔다.
- 수령자 이름과 연락처는 주소 field보다 먼저 두고, prefilled typed field로 표현한다.
- 주소 field는 `주소 찾기` field-local action, 조회된 기본 주소, 상세 주소 순서로 둔다.
- 조회된 우편번호와 기본 주소는 readonly/disabled state로 두고, 상세 주소는 사용자가 보강 가능한 editable state로 둔다.
- `주소 찾기` action은 field-local button이며 bottom CTA로 승격하지 않는다.
- title badge는 업무 구분이 필요한 경우에만 title 옆에 작게 둔다.
- 배송지와 T기프트 배송 정보는 같은 구조를 공유하므로 title과 badge만 바꾸고 같은 reference를 사용한다.
- 기존 정보 재사용 + 주소만 있으면 `area-linked-address-field`를 검토하고, 수령자 이름/연락처까지 있으면 이 reference를 우선한다.

## SourceSpec Additions

SourceSpec이 component를 직접 명시하지 않아도, 배송/수령 정보 입력 흐름을 이해시키기 위해 아래 보강은 허용된다.

- `가입자 정보와 동일` 같은 reuse row
- 받는 사람 또는 수령자 이름 prefilled typed field
- 연락처 prefilled typed field
- 우편번호 또는 주소 검색 field
- `주소 찾기` field-local action
- 조회된 기본 주소 readonly field
- 상세 주소 editable field
- 배송 같은 짧은 title badge

## Component Candidates

- `Pagestack` section
- `TitleSection`
- optional badge
- `ListSelected`
- `TextField`
- readonly/disabled `TextField`
- field-local `Button`

## Avoid

- 배송지와 T기프트 배송 정보를 별도 area type으로 나누지 않는다. 구조가 같으면 같은 reference를 재사용한다.
- 동일 정보 재사용 선택 없이 순수 주소만 입력하는 경우에는 `area-form-address` 또는 `area-linked-address-field`를 우선 검토한다.
- 주소 찾기 action을 bottom primary CTA로 승격하지 않는다.
- 수령자 이름/연락처 field를 주소 field 뒤로 보내지 않는다.
- source에 없는 지도, 배송 추적 card, marketing banner를 추가하지 않는다.
