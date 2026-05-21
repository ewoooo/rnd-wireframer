# Layout / Spacing Contract

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리. 정식 spacing token scale과 semantic token의 원천은 `DESIGN_FOUNDATION.md`다.

## 공통 Layout / Spacing Contract

이 문서는 화면 패턴 구조와 spacing 운영을 함께 소유한다. 과거 spacing 전용 문서의 실측 운영 규칙은 이 섹션과 각 패턴의 `Spacing Contract`로 흡수했다.

정식 spacing token scale과 semantic token의 원천은 `DESIGN_FOUNDATION.md`다. Figma 실측에서 token scale에 없는 값이 보이면 임의 token으로 승격하지 않고 가장 가까운 정식 token 또는 component-owned layout으로 정렬한다.

### Width Rails

| Rail | Width | 용도 |
|---|---:|---|
| Full bleed | 393px | StatusBar, AppBar, ActionButton, Divider, BottomSheet shell |
| Section | 369px | Pagestack, CardCarousel, CardSection, card/list group |
| Content | 361px | 일반 본문, 상세/폼 콘텐츠, 2열 grid |
| Inner content | 329px | TitleSection, ListText, TextField, Accordion |
| Popup text | 297px | 361px Popup card 내부에서 좌우 32px inset |

361px tier는 393/369/329 grid를 대체하지 않는다. 369px는 카드형 section wrapper와 리스트 그룹, 361px는 일반 본문 콘텐츠와 폼/상세 화면의 기본 콘텐츠 폭으로 사용한다.

### Chrome Sizes

| Element | Size / Rhythm |
|---|---|
| StatusBar | 393×59px |
| AppBar | 393×48px |
| Header total | 107px = StatusBar 59 + AppBar 48 |
| BottomNavigation | 393×88px |
| ActionButton | 393×102px |
| Bottom safe area | 36px |

### Component Measurement Cheatsheet

| Component | Contract |
|---|---|
| Button | Small 28px, Medium 36px, Large 48px, XLarge 56px; 버튼은 action pattern 또는 organism slot 안에서 사용 |
| TextField | input 48px, field gap 12px, group title gap 8px, group vertical rhythm 24px |
| Chip | ChipItem 37px, row 57px, icon-text gap 2px, row gap 4px |
| CardSection | outer width 369px, inner padding 28px, inner gap 24px |
| ListText | row 22px + padB 4px, left flex / right fixed, gap 16px |
| InfoTextList | row gap 4px, key-value gap 40px, total row top Divider required |
| BottomSheet | Handle 32px, Title 68px, ActionButton 102px |
| Popup | card 361px, text inset 32px, PopupActionButton 361×60px |

`StatusBar`는 wireframe 생성 데이터에 포함하지 않고 `@cx/layout`의 `AppScreen` chrome에서 항상 렌더링한다. `Screen.Header`는 AppBar, progress bar 등 앱 상단 콘텐츠 영역만 표현한다.

### Spacing 운영 원칙

- 0-4px: 같은 원자적 요소 내부.
- 8-12px: 같은 컴포넌트 내부 인접 요소.
- 16-20px: 카드/컨테이너 내부 padding, 화면 기본 좌우 padding.
- 24-28px: 카드 상하 padding, section 구분.
- 32-40px: 큰 영역 구분, bottom sheet title, footer/filter sorting 계열.
- 컴포넌트 간 간격은 외부 margin보다 부모 container의 `gap` 또는 `padding`으로 제어한다.
- 화면 route에서 raw spacing으로 기준선을 보정해야 하면 pattern 또는 layout primitive로 올릴 수 있는지 먼저 확인한다.
- section 간 구분은 gap 보정보다 `Divider`나 해당 pattern의 section contract를 우선한다.

---

<a name="section-main"></a>
