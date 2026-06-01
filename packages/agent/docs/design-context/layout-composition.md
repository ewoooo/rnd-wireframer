# Layout Composition Bundle

Bundle id: `layout-composition`

Source docs: `docs/design/COMPOSITION_LAYERS.md`, `docs/design/SECTION_PATTERNS.md`, `docs/design/SCREEN_PATTERN_SUMMARY.md`, `docs/design/LAYOUT_SPACING_CONTRACT.md`

이 번들은 Screen/Region/Area 조합과 섹션 그룹핑 규칙을 제공한다. 우선순위는 **source evidence ≥ schema/catalog > 이 번들 규칙**이다.

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
- 섹션(area) **사이** 4px 구분: 앞 area 노드에 `props.sectionDivider: true`. 마지막 섹션·카드 그룹 화면에선 생략. (행 **내부** 구분은 `props.divider`로 — 둘은 직교.)

## 화면 유형별 구성 (8패턴 요약)

- 메인/브라우즈: 하단 `BottomNavigation`(88px). 카드/리스트 섹션 반복.
- 리스트(카드/텍스트): 반복 item + 섹션 제목. empty/long item 고려.
- 상세: 핵심 정보 우선순위 → section grouping → 하단 `ActionButton`.
- 폼: 그룹 제목 + 필드 묶음, 하단 primary CTA.
- 완료: 결과 메시지 + next action(2버튼: Secondary 탐색 / Primary 확인·홈).
- 바텀시트/팝업: 오버레이 frame 위 배치, 자체 action slot.
- 액션존 이분법: BottomNavigation(메인) 또는 ActionButton(상세/폼) 중 하나만. 동시 사용 없음.

## Boundaries

- pattern id는 `context.patternSelection` 또는 `context.layerCandidates`에서만. layout id를 발명하지 않는다.
- 후보 집합이 좁아도 새 screen/region/area/composite 패턴을 발명하지 않는다.
- 신규 component가 필요하면 확정하지 말고 component-proposal 아티팩트로 제안한다.
