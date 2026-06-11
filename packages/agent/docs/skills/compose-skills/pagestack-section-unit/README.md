---
id: pagestack-section-unit
stage: compose
task: composition-planning
role: area-layout-selection
priority: required
---

# pagestack-section-unit

Contents 영역의 각 섹션은 PageStack 패밀리 area 레이아웃을 기본 단위로 쓴다.

Use this skill when `Contents` contains a titled decision unit, input group, notice group, repeated row group, agreement group, or any source-backed section that should be represented as one semantic area.

## Rule

- `targetRegion: "contents"`의 각 section은 PageStack 패밀리 area 레이아웃을 strategy로 지정한다.
- SourceSpec에서 하나의 판단 단위, 입력 묶음, 안내 묶음, 반복 row 묶음이 확인되면 임의 wrapper보다 PageStack 계열 section area 후보를 먼저 검토한다.
- `layout.area.areaVertical`은 **last-resort fallback**이다. usedFor가 매칭되는 PageStack area가 하나도 없을 때만 쓴다. catalog description이 명시한다: "다른 area pattern이 매칭 안 됐을 때 fallback".
- area를 고를 때는 catalog의 `usedFor` intent를 먼저 매칭한다. 매칭되면 그 area를 strategy에 id로 적고 어떤 usedFor에 근거했는지 한 줄로 남긴다.
- Contents section이 1개뿐이면 section rhythm에 `4px section divider`를 적지 않는다. 단독 section은 PageStack 자체 spacing으로 끝난다.
- section 사이의 의미 경계는 component leaf `Divider`가 아니라 area stack의 divider/rhythm props로 표현한다.

## Area selection guide (usedFor 매칭)

| 섹션 내용 신호 | area 레이아웃 | usedFor |
|---|---|---|
| 안내/상태 메시지 묶음 (TitleSection + Callout + 보조 버튼) | `layout.area.fieldStack` | "메시지 스택" |
| 입력 필드 묶음 / 체크·동의 항목 | `layout.area.fieldStack` | "필드 스택" / "체크박스 스택" |
| 반복 row·항목 리스트 (검증 결과, 내역, 선택 목록) | `layout.area.listStack` | 리스트형 세로 배치 |
| 위 어디에도 매칭 안 됨 | `layout.area.areaVertical` | (fallback) |

## Anti-pattern (반드시 피한다)

- **errorPolicy '영역 전체 숨김'을 근거로 `areaVertical`을 고르지 않는다.** PageStack area(fieldStack/listStack)도 단일 dynamic area라 통째로 토글된다. errorPolicy whole-area hide는 fallback을 요구하지 않는다.
- 매칭되는 PageStack area가 있는데 generic `areaVertical`로 떨어지면 품질 회귀다. SOT 위반으로 본다.
- 단독 PageStack area 뒤에 `divider: "section"`을 붙여 region 경계를 흉내내지 않는다. section divider는 같은 region 안의 section 간 경계 전용이다.

## Output obligation

- 각 contents section strategy는 area layout id와 source evidence를 함께 명시한다.
- `areaVertical`을 쓸 경우 "어떤 PageStack area도 매칭 안 됨"을 명시 근거로 적는다.
- screen-level reference가 제시한 큰 흐름을 깨지 않는 선에서 PageStack section 단위를 적용한다.
