---
id: divider-usage-rules
kind: skill
family: generate
stages:
  - compose
  - generate
tasks:
  - intent-composition
  - composition-planning
  - screen-generation
role: divider-usage
priority: required
whenToUse: "Use when deciding whether a section, contents, or row divider is semantically justified."
tags:
  - divider
  - section-boundary
  - visual-rhythm
---

# divider-usage-rules

Divider는 반복되는 행이나 여러 의미 섹션 사이를 분리할 때만 사용한다. 단독 섹션 또는 이미 frame/card로 묶인 콘텐츠에 의미 없는 section divider를 추가하지 않는다.

## Rule

- Contents region에 section이 1개뿐이면 `props.divider: "section"`을 쓰지 않는다. 단독 PageStack section의 앞뒤 경계는 화면 구조와 spacing으로 충분하다.
- `props.divider: "section"`은 같은 region 안에 PageStack area가 2개 이상 있고, 두 area가 서로 다른 판단 단위일 때만 앞 area에 붙인다.
- `props.divider: "contents"`는 반복 row 사이 1px hairline이 필요한 list/ledger 내부에만 쓴다.
- Card, Callout, CardContentsFilled처럼 자체 background/frame이 있는 컴포넌트 내부나 직후에는 section divider를 덧붙이지 않는다.
- Header, Contents, Bottom region 경계를 표현하려고 contents area에 `divider: "section"`을 넣지 않는다. region 경계는 screen shell과 bottom action chrome이 담당한다.

## Complete / Result Screens

- 완료/결과 화면처럼 contents가 `TitleMain` 하나 또는 `TitleMain + 안내 card/callout` 한 묶음이면 divider 기본값은 `"none"` 또는 생략이다.
- bottom CTA 위 hairline이 필요한 경우는 bottom action component/chrome 책임으로 보고, contents area의 trailing section divider로 표현하지 않는다.

## Anti-pattern

- 단일 `fieldStack`이나 단일 message stack 뒤에 `divider: "section"`을 붙여 화면 중간을 끊지 않는다.
- sparse 화면의 밀도를 높이기 위해 divider를 장식처럼 추가하지 않는다.
- `section-divider-rhythm`의 "섹션 사이" 규칙을 "region 사이" 또는 "단독 section 뒤"로 확대 해석하지 않는다.
