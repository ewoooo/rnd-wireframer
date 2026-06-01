# Visual Foundation Bundle

Bundle id: `visual-foundation`

Source docs: `docs/design/LAYOUT_SPACING_CONTRACT.md`, `docs/design/VISUAL_FOUNDATION_OBSERVATIONS.md`, `docs/design/COMPONENT_INVENTORY.md`

이 번들은 화면의 구분선·간격·시각 위계 운영 규칙을 제공한다. 이 규칙은 보조 기준이며 우선순위는 **source evidence ≥ schema/catalog > 이 번들 규칙**이다.

## Divider 규칙 (언제 구분하는가)

구분선은 기본적으로 **area stack 노드의 `props.divider`**로 표현한다(렌더러가 stack children 사이에 자동으로 그림). 별도 Divider leaf 노드를 행 구분용으로 끼우지 않는다.

- 리스트/체크박스/필드 stack(예: `layout.area.listStack`, `layout.area.checkboxStack`)의 행 사이 1px 구분: 해당 area 노드에 `props.divider: true`(또는 `"contents"`).
- 섹션 단위 4px 구분: `props.divider: "section"`.
- 카드/그룹 컨테이너(`Card 0/PagestackItem`, `Local_CardSection`, `CardSection`)가 이미 시각적 분리를 제공하면 `props.divider`를 켜지 않는다(생략/false).
- 같은 카드 내부 인접 요소 분리에 divider를 남발하지 않는다(그 경우 spacing으로 처리).
- 예외: AccordionList의 `Accordion ↔ Divider` 교번, InfoTextList total 행 위 구분처럼 **패턴이 명시적으로 Divider 노드를 조합하는 경우**에만 Divider leaf component를 쓴다. raw border/그림자는 금지.

## Spacing 운영 (외부 margin보다 부모 gap/padding)

- 0–4px: 같은 원자적 요소 내부.
- 8–12px: 같은 컴포넌트 내부 인접 요소.
- 16–20px: 카드/컨테이너 내부 padding, 화면 기본 좌우 padding.
- 24–28px: 카드 상하 padding, section 구분.
- 32–40px: 큰 영역 구분, bottom sheet title, footer/filter 계열.
- section 간 구분은 gap 보정보다 `Divider` 또는 해당 pattern의 section contract를 우선한다.
- token scale에 없는 값은 임의 token으로 승격하지 말고 가장 가까운 정식 token 또는 component-owned layout으로 정렬한다.

## Width Rails (참고)

- 393px 풀블리드: StatusBar, AppBar, ActionButton, 섹션 Divider, BottomSheet shell.
- 369px: 카드형 section wrapper, 리스트 그룹(Pagestack, CardCarousel, CardSection).
- 361px: 일반 본문, 상세/폼 콘텐츠, 2열 grid.
- 329px: TitleSection, ListText, TextField, Accordion 내부 콘텐츠.
- StatusBar는 생성 데이터에 포함하지 않는다(`@cx/layout`의 AppScreen chrome이 렌더). `Screen.Header`는 AppBar/progress 등 상단 콘텐츠만.

## 시각 위계·강조

- 위계는 component 선택으로 만든다: 섹션 제목 `TitleSection`, 레이블+값 행 `ListText`, 강조 안내 `Callout`.
- 강조는 component props(variant/emphasis 등 카탈로그가 제공하는 prop)로만 표현한다.
- 임의 색/그라디언트/장식 일러스트/이모지 아이콘/카탈로그에 없는 시각 역할을 만들지 않는다.
- 가독성은 섹션 순서·component 선택·source 기반 텍스트로 확보하고, 발명한 시각 장식으로 만들지 않는다.

## Boundaries

- 카탈로그(component/prop/layout id)·source ref 밖의 값을 발명하지 않는다.
- 번들 규칙과 source evidence가 충돌하면 source evidence와 schema/catalog 계약을 우선한다.
