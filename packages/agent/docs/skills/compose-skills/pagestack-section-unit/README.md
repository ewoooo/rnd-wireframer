---
id: pagestack-section-unit
stage: compose
task: composition-planning
role: area-layout-selection
priority: required
---

# pagestack-section-unit

Contents 영역의 각 섹션은 PageStack 패밀리 area 레이아웃을 기본 단위로 쓴다. Figma SOT에서 `Pagestack`은 "섹션 제목과 섹션 본문을 묶는 기본 단위"이고, 섹션 사이는 `4px` divider로 의미 경계를 만든다. (근거: `docs/design/reference/figma-sot-observations.md` §4.5, §4.6, §4.7)

## Rule

- `targetRegion: "contents"`의 각 section은 PageStack 패밀리 area 레이아웃을 strategy로 지정한다.
- `layout.area.areaVertical`은 **last-resort fallback**이다. usedFor가 매칭되는 PageStack area가 하나도 없을 때만 쓴다. catalog description이 명시한다: "다른 area pattern이 매칭 안 됐을 때 fallback".
- area를 고를 때는 catalog의 `usedFor` intent를 먼저 매칭한다. 매칭되면 그 area를 strategy에 id로 적고 어떤 usedFor에 근거했는지 한 줄로 남긴다.

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

## Output obligation

- 각 contents section strategy는 area layout id를 명시하고, areaVertical을 쓸 경우 "어떤 PageStack area도 매칭 안 됨"을 명시 근거로 적는다.
