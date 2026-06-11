---
id: area-linked-address-field
situation: 사용자가 주소나 생활지역을 직접 입력하기 전에 기존 가입자/배송지/청구지 정보와 동일하게 재사용할 수 있는 선택지를 먼저 확인해야 한다
whenToUseThisReference: SourceSpec에 주 생활지역, 배송지, 설치 주소, 청구지처럼 기존 정보와 동일하게 재사용 가능한 주소성 field group이 있고 동일 정보 선택과 주소 조회 field를 함께 보여줘야 할 때 사용한다
tags:
  - area-pattern
  - linked-address
  - reuse-existing-info
  - address-lookup
  - helper-text
---

## Related References

- Figma file: `SKT GenUI Test 0514`
- Figma node: `10095:23494`
- Capture: `source/area-linked-address-field.png`
- Figma node tree sketch: `source/figma-node-tree-sketch.json`
- RenderTree sketch: `source/render-tree-sketch.json`

## Area Pattern

연동 주소 field는 주소 입력 자체보다 기존 정보 재사용 여부가 먼저 오는 field group이다. SOT에서는 `Pagestack` 안에 `TitleSection`을 두고, `ListSelected`로 `가입자 정보와 동일` 선택 상태를 먼저 표시한 뒤, 우편번호/주소 찾기 field와 조회된 주소 field, helper text를 이어서 배치한다.

이 reference는 `area-form-address`를 대체하지 않는다. `area-form-address`는 주소 입력/조회/상세 주소 보강의 기본 패턴이고, `area-linked-address-field`는 그 앞에 동일 정보 재사용 control이 붙는 변형이다.

## Structure Example

- Area
  - `Pagestack`: linked address/reuse section wrapper
    - `TitleSection`: 주소 또는 생활지역의 업무 의미
    - `ListSelected`: 기존 정보와 동일하게 재사용하는 선택 row
    - spacing
    - disabled `TextField` + field-local `Button`: 우편번호/주소 찾기
    - disabled `TextField`: 조회된 기본 주소
    - helper text: 입력/확인 목적 보조 설명

`source/*-sketch.json`은 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- section title은 재사용할 주소/지역의 업무 의미를 드러낸다.
  - 예: `주 생활지역`, `배송지`, `설치 주소`, `청구지`
- 동일 정보 재사용 row는 address field stack보다 먼저 둔다.
- 재사용 row는 `ListSelected`나 checkbox-like row로 표현한다.
- 주소 찾기 action은 field-local button으로 두고 bottom CTA로 승격하지 않는다.
- 조회된 주소는 readonly/disabled field로 보여준다.
- helper text는 재사용/조회 목적이 필요할 때 field group 하단에 짧게 둔다.
- 상세 주소 입력이 필요한 순수 주소 보강 흐름이면 `area-form-address`를 우선한다.

## SourceSpec Additions

SourceSpec이 동일 정보 재사용 여부를 짧게만 제공하더라도, 흐름을 이해시키기 위해 아래 보강은 허용된다.

- `가입자 정보와 동일`, `배송지와 동일`, `청구지와 동일` 같은 reuse row
- 우편번호 또는 주소 검색 field
- `주소 찾기` 같은 field-local lookup action
- 조회된 주소를 보여주는 readonly/disabled field
- 5G 가용지역 확인, 배송 가능 지역 확인 같은 짧은 helper text

## Component Candidates

- `Pagestack` section
- `TitleSection`
- `ListSelected`
- checkbox-like row
- disabled `TextField`
- field-local `Button`
- helper text

## Avoid

- 동일 정보 재사용 선택 없이 일반 주소 입력만 있으면 `area-form-address`를 사용한다.
- 재사용 row를 bottom primary CTA로 승격하지 않는다.
- helper text를 긴 안내문이나 marketing copy로 확장하지 않는다.
- source에 없는 상세 주소 field를 무조건 추가하지 않는다. 상세 주소가 필요한 일반 주소 입력은 `area-form-address`로 분리한다.
- 조회된 주소를 사용자가 직접 입력해야 하는 editable field처럼 보이게 하지 않는다.
