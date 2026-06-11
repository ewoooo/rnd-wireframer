---
id: section-divider-rhythm
stage: compose
task: screen-generation
role: divider-rhythm
priority: required
---

# section-divider-rhythm

섹션 사이의 구분과 간격을 PageStack area의 divider prop으로 표현한다. Figma SOT에서 contents는 `Pagestack` 단위 섹션 반복이고, 섹션 사이는 `4px` divider로 의미 경계를 만든다. (근거: `docs/design/reference/figma-sot-observations.md` §4.5, §4.6)

## Rule

- 행/섹션 구분은 **area의 `props.divider`로** 표현한다. `Divider` leaf 노드를 children에 끼우지 않는다.
- `props.divider` 값:
  - `"section"` = 섹션 사이 `4px` 구분 (PageStack 섹션 묶음 경계)
  - `"contents"` = 행 사이 `1px` hairline (리스트 row 구분)
  - `"none"` = gap만으로 분리
- 같은 area layout이 이미 divider default를 가지면(catalog default가 의도와 일치하면) `props.divider`를 재명시하지 않는다.
- Contents region에 section이 1개뿐이면 `props.divider: "section"`을 쓰지 않는다. section divider는 같은 region 안의 여러 PageStack area 사이에만 쓴다.

## Rhythm (SOT 기준)

- 섹션 좌우 outer padding `12px`, 내부 contents padding `20px`.
- 섹션 제목 아래 `16px` 여백으로 본문과 분리.
- TextField stack은 `8px` 간격 반복.

## Anti-pattern

- 행 구분을 위해 `Divider` leaf component를 area children에 삽입하지 않는다. divider는 area stack prop이다.
- 카드 내부에 섹션 divider를 남발하지 않는다. divider는 의미 덩어리 경계에만.
- 단독 message stack, 단독 fieldStack, 완료/결과 화면의 단일 contents section 뒤에 section divider를 붙이지 않는다.
- 모든 섹션을 동일 간격으로 평평하게 두지 않는다 — 의미 단위가 다르면 rhythm으로 위계를 만든다.
