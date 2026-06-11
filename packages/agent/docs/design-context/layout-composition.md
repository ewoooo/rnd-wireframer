# Layout Composition Bundle

Bundle id: `layout-composition`

Source docs: `packages/agent/docs/skills/design-skills/design-fundamentals/source/COMPOSITION_LAYERS.md`, `packages/agent/docs/skills/design-skills/design-fundamentals/source/SECTION_PATTERNS.md`, `packages/agent/docs/skills/design-skills/design-fundamentals/source/SCREEN_PATTERN_SUMMARY.md`, `packages/agent/docs/skills/design-skills/design-fundamentals/source/LAYOUT_SPACING_CONTRACT.md`

이 번들은 Screen/Region/Area 조합과 섹션 그룹핑 규칙을 제공한다. 우선순위는 **source evidence ≥ schema/catalog > 이 번들 규칙**이다.

## CompositionPlan 디자인 판단 필드

`CompositionPlan`은 섹션 목록만 남기지 않고, 이후 pattern selection과 RenderTree generation이 참조할 디자인 판단을 명시한다.

- `visualHierarchy`: 사용자가 가장 먼저 보고 이해해야 하는 정보 순서. `COMPOSITION_LAYERS.md`의 Screen/Area 조합 원칙과 `SCREEN_PATTERN_SUMMARY.md`의 화면 유형별 위계를 따른다.
- `primaryUserAction`: 핵심 CTA 또는 주 행동의 의미와 위치. `INTERACTION_PATTERNS.md`의 CTA/Overlay 규칙과 bottom action slot 원칙을 따른다.
- `sectionRhythm`: 섹션 제목, PageStack 반복, divider cadence, bottom action 전환 리듬. `SECTION_PATTERNS.md`와 `LAYOUT_SPACING_CONTRACT.md`를 따른다.
- `density`: `low`, `medium`, `high` 중 하나. 정보량과 반복 항목 수, 폼 필드 수, 섹션 수를 기준으로 정하고 spacing/section divider 판단에 연결한다.
- `patternRationale`: 선택한 화면 구성 패턴이 intent와 source evidence에 맞는 이유. `SCREEN_PATTERN_SUMMARY.md`의 8가지 화면 구성 패턴을 근거로 쓴다.
- `rejectedPatterns`: 검토했지만 쓰지 않은 대안 패턴과 배제 이유. 후보 밖 layout id를 만들지 않고, 왜 `main`, `list`, `detail`, `form`, `completion`, `overlay` 계열이 맞지 않는지 짧게 남긴다.

## 조합 레이어

- 어휘는 `Component → Pattern → Area → Screen`으로 해석한다. 외부 `Atom` 분류를 직접 쓰지 않는다.
- 기초 component(`Button`, `Badge`, `Ico`, `RadioText`, `CheckboxText`)는 화면에 직접 배치하지 않고 pattern 또는 area의 이름 있는 slot 안에 둔다.
- primary `Button`은 콘텐츠 중간 직접 배치 금지. `SinglePrimaryAction`, 카드 CTA slot, `PopupActionButton`, bottom sheet action slot 안에 둔다.
- `Screen`은 하위 `Area` 섹션을 소유한다. Area는 정책 의미 단위다.

## 화면 골격

- 스켈레톤 보존: `Screen` > `Screen.Header`/`Screen.Contents`/`Screen.Bottom` > source area wrapper(area.static/area.dynamic) > (선택) PageStack/layout wrapper > components.
- header/contents/bottom region을 각각 Screen.Header/Screen.Contents/Screen.Bottom에 매핑한다.
- `ScreenIntent`로 화면 존재 이유를 정하고, `CompositionPlan`의 section role·targetRegion·priority·sourceRefs를 추적 가능하게 유지한다.
- source area는 schema/validation이 wrapper를 요구하지 않는 한 그룹을 유지한다.

## SDUI 슬롯 패턴

- `Pagestack`이 서버 주도 UI의 핵심 범용 컨테이너다. 구조: `Pagestack > ContentsTitle(TitleSection) > ContentsSlot > [Default 20 | Card 0]/PagestackItem > 콘텐츠`.
- `Default 20/PagestackItem`: 텍스트/폼 콘텐츠 슬롯. `Card 0/PagestackItem`: 카드형 콘텐츠 슬롯.
- 상세/폼 화면 기본 구조는 `Pagestack + Divider(393×4px)` 반복(섹션 구분).
- 섹션 그룹핑·list rail·divider-separated section이 필요하면 PageStack/layout wrapper를 쓴다.
- 섹션(area) **사이** 4px 구분: 앞 area 노드에 `props.divider: "section"`. 마지막 섹션·카드 그룹 화면에선 생략. 행 **내부** 반복 row 구분은 `props.divider: "contents"`로만 표현한다.

## 화면 유형별 구성 (8패턴 요약)

- 메인/브라우즈: 하단 `BottomNavigation`(88px). 카드/리스트 섹션 반복.
- 리스트(카드/텍스트): 반복 item + 섹션 제목. empty/long item 고려.
- 상세: 핵심 정보 우선순위 → section grouping → 하단 `ActionButton`.
- 폼: 그룹 제목 + 필드 묶음, 하단 primary CTA.
- 완료: 결과 메시지 + next action(2버튼: Secondary 탐색 / Primary 확인·홈).
- 바텀시트/팝업: 오버레이 frame 위 배치, 자체 action slot.
- 액션존 이분법: BottomNavigation(메인) 또는 ActionButton(상세/폼) 중 하나만. 동시 사용 없음.

## Boundaries

- layout id는 `context.references.layoutCatalog`, `compositionPlan`, 또는 mounted selected reference 문서에서 확인된 값만 사용한다. layout id를 발명하지 않는다.
- 후보 집합이 좁아도 새 screen/region/area/composite 패턴을 발명하지 않는다.
- 신규 component가 필요하면 확정하지 말고 component-proposal 아티팩트로 제안한다.
