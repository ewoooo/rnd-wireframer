---
id: component-layout-ref
kind: skill
family: generate
stages:
  - generate
tasks:
  - screen-generation
role: component-layout-ref
priority: required
whenToUse: "Use when emitting any kiki.* component node, to attach the required layout.composite.* ref and satisfy required props on the first pass."
tags:
  - layout-ref
  - component-contract
  - validation-first-pass
---

# component-layout-ref

트리 자리에 놓인 모든 `kiki.*` component node는 `node.layout`에 `layout.composite.*` id를 반드시 가진다. 이 ref가 없으면 deterministic validation이 `required-field-missing` error를 내고 revision 루프가 강제된다.

## Rule

- Screen region/area/layout wrapper의 children으로 배치된 모든 `kiki.*` node에 `layout: "layout.composite.<id>"`를 붙인다. 예외 없음.
- node-slot prop 값으로 들어간 node(예: `Button.props.children`에 담긴 `kiki.Badge`)는 트리 자리가 아니므로 layout ref가 필요 없다.
- layout id는 layout catalog의 `target: "composite"` 엔트리에서만 고른다. id를 발명하지 않는다.
- 대부분의 composite id는 component 이름을 그대로 따른다: `kiki.X` → `layout.composite.componentX`.
- 이름이 그대로 매칭되는 엔트리가 catalog에 없으면, composite 엔트리의 `description`을 읽고 의미가 가장 가까운 패턴을 고른다.

## Known mappings (validation-passing runs)

이름 불일치로 자주 누락되는 매핑. catalog에 같은 이름이 없을 때 이 표를 먼저 적용한다.

| component | layout ref |
| --- | --- |
| `kiki.Callout` | `layout.composite.componentSectionMessage` |
| `kiki.TitleMain` | `layout.composite.componentTitleSection` |

이름 그대로 매칭되는 예: `kiki.AppBar` → `componentAppBar`, `kiki.TextField` → `componentTextField`, `kiki.Button` → `componentButton`, `kiki.ActionButton` → `componentActionButton`.

## Required props

component catalog 엔트리에서 `required: true`인 prop은 전부 채운다. 자주 빠지는 계약:

- `kiki.ActionButton`: `text`(string)와 `left`(number, 보통 `0`)가 둘 다 required.
- catalog에 `type: "node"`로 선언된 prop(예: `kiki.Button.children`)은 string이 아니라 render node 객체를 받는다. 라벨 텍스트만 필요하면 string children을 받는 leaf component node로 감싼다.

## Preflight checklist

최종 JSON을 반환하기 전에 트리 전체를 한 번 훑어 확인한다.

1. 트리 자리의 모든 `kiki.*` node에 `layout`이 있는가?
2. 모든 `layout` 값이 catalog에 존재하는 `layout.composite.*` id인가?
3. 각 component의 `required: true` prop이 전부 채워졌는가?
4. `type: "node"` prop에 string을 넣지 않았는가?
