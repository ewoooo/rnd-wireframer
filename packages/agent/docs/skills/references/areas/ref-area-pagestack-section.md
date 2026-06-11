---
id: ref-area-pagestack-section
stage: compose
task: composition-planning
role: area-reference
priority: recommended
situation: Contents 안에서 제목이 있는 판단 단위나 반복 항목 묶음을 하나의 PageStack 계열 section area로 구성한다
tags:
  - area-reference
  - pagestack
  - section-rhythm
  - contents-section
  - divider
---

## 상황

이 reference는 화면 전체 pattern이 아니라 `Contents` region 안의 section 단위 조합을 고를 때 사용한다. SourceSpec에서 하나의 판단 단위, 입력 묶음, 안내 묶음, 반복 row 묶음이 확인되면 area를 임의 wrapper로 만들지 않고 PageStack 계열 section area 후보로 먼저 해석한다.

## 선택 기준

- 섹션 제목과 본문이 함께 있으면 PageStack section 단위로 묶는다.
- 입력 필드, 체크박스, 약관, 상태 안내처럼 field 의미가 강하면 `layout.area.fieldStack` 후보를 우선 검토한다.
- 반복 row, 선택 목록, 내역, 검증 결과처럼 list 의미가 강하면 `layout.area.listStack` 후보를 우선 검토한다.
- 위 신호가 약하거나 catalog의 `usedFor`와 맞지 않을 때만 `layout.area.areaVertical`을 fallback으로 둔다.
- section 사이의 의미 경계는 component leaf `Divider`가 아니라 area stack의 divider/rhythm props로 표현한다.

## CompositionPlan 반영

- section strategy에는 선택한 area layout id와 source evidence를 함께 남긴다.
- fallback을 쓴 경우에는 어떤 PageStack 계열 후보도 맞지 않았는지 이유를 남긴다.
- screen-level reference가 제시한 큰 흐름을 깨지 않는 선에서 area-level reference를 적용한다.
