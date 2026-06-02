# Figma Reference Skill Structure Plan

## 1. Purpose

이 문서는 Figma 디자인 정본을 screen inference pipeline이 읽고 검증할 수 있는 Markdown reference와 domain design skill 구조로 분해하는 계획을 정의한다.

목표는 Open Design의 `SKILL.md` + `references/*.md` + `DESIGN.md` 구조를 그대로 복제하는 것이 아니라, 이 프로젝트의 Figma SOT를 기준으로 다음 세 가지를 안정화하는 것이다.

- 화면 유형별 design skill을 Figma-derived reference에 근거하게 한다.
- component proposal/promotion 로직이 "카탈로그 gap"과 "생성 품질 문제"를 구분할 수 있게 한다.
- `trace.json`, `composition-plan.json`, `quality-review.json`에서 어떤 디자인 reference가 판단 근거였는지 감사 가능하게 한다.

이 문서는 Figma SOT 확인 전후의 실행 계획이다. 등록된 Figma SOT 링크는 [figma-source.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-source.md)를 기준으로 관리하고, 상세 skill 후보와 reference 문서 내용은 실제 관찰 결과로 갱신한다.

## 2. Current Context

현재 screen generation은 아래 논리 레이어를 사용한다.

```text
Understand -> Compose -> Revise
```

현재 구현된 관련 요소:

- `CompositionPlan`은 `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, `rejectedPatterns`를 가진다.
- `DesignSkillSelection`은 초기 domain skill 3종(`detail-confirmation-screen`, `form-entry-screen`, `list-selection-screen`)을 선택하고 `trace.json`에 기록한다.
- `component-proposal`은 비파괴 catalog gap proposal artifact로 존재한다.
- `packages/agent/docs/design-context/*`는 공통 design-context bundle 본문을 소유한다.
- `docs/design/*`는 Figma 기반 디자인 문서의 사람용 정본이다.

문제:

- Figma SOT 자체는 강한 정답지지만, agent/pipeline이 단계별로 읽을 수 있는 reference contract로 아직 충분히 쪼개져 있지 않다.
- 현재 domain skill 문서가 Figma-derived reference를 명시적으로 선택/근거화하는 구조가 약하다.
- component promotion 강화 작업이 참조할 "승격 가능성 기준"이 별도 정본으로 분리돼 있지 않다.

## 2.1 Current Working Decision

현재 작업은 pipeline 구현 변경보다 Figma SOT 기반 skill 후보 수집을 우선한다.

결정:

- 우선 Figma SOT를 화면 묶음별로 조회하고, scenario/domain/atomic skill 후보를 최대한 빠짐없이 모은다.
- 수집 단계에서는 `@cx/schema`, `@cx/orchestration`, `@cx/pipeline`을 변경하지 않는다.
- 수집된 skill 후보는 곧바로 RenderTree node type으로 만들지 않는다.
- 각 후보에는 반드시 SOT file/node/frame, 화면 의도, 적용될 node-tree level, 작성 예정 규칙을 함께 기록한다.
- 실제 skill 문서를 만들기 직전에는 기록된 SOT node를 한 번 더 조회해 최신 frame 구조와 component state를 확인한다.
- pipeline 연결은 skill 후보가 충분히 모인 뒤, reference selection과 trace 구조를 함께 조정하는 후속 작업으로 진행한다.

작업 순서:

```text
Figma SOT 등록
-> SOT frame 관찰
-> skill 후보 수집
-> skill creation lookup plan 작성
-> skill 문서 작성
-> pipeline reference selection 연결
-> validation/revision 연결
```

이 결정의 목적은 초기 설계가 특정 화면 1~2개에 과적합되지 않도록 하고, component promotion 강화 작업과 같은 방향의 reference evidence를 확보하는 것이다.

## 3. Non-goals

- Figma 원본을 런타임 중 직접 읽는 시스템을 만든다.
- Open Design처럼 scenario skill, atom skill, domain skill을 모두 분리한 범용 skill runtime을 만든다.
- `docs/design/reference/*`가 `@cx/schema`, `@cx/orchestration`, `@cx/pipeline`의 구현 세부사항을 소유한다.
- component promotion을 자동 확정한다. promotion은 proposal/근거 산출까지이며 catalog mutation은 별도 승인 흐름이다.
- golden RenderTree 하나를 화면 정답으로 고정한다.

## 4. Target Directory Structure

### 4.1 Design SOT references

```text
docs/design/
  reference/
    README.md
    figma-source.md
    screen-archetypes.md
    component-usage.md
    layout-rhythm.md
    visual-hierarchy.md
    interaction-states.md
    source-to-screen-mapping.md
    anti-patterns.md
    promotion-readiness.md
```

`docs/design/reference/`는 Figma SOT를 agent와 사람이 함께 읽을 수 있게 압축한 프로젝트 디자인 정본이다.

| 문서 | 책임 |
|---|---|
| `README.md` | reference 문서 목록, 갱신 원칙, Figma SOT와의 관계 |
| `figma-source.md` | Figma file/page/node, 분석 범위, 갱신일, provenance |
| `screen-archetypes.md` | 화면 유형별 Figma 정답 구조와 사용 조건 |
| `component-usage.md` | component/variant 사용 기준, 금지/허용 대체, source evidence |
| `layout-rhythm.md` | rail, spacing, divider, section rhythm, bottom action rhythm |
| `visual-hierarchy.md` | 정보 우선순위, CTA/summary/list/detail 위계 판단 |
| `interaction-states.md` | form, agreement, list, overlay, validation, disabled 상태 기준 |
| `source-to-screen-mapping.md` | SourceSpec 신호를 화면 유형/section role로 번역하는 규칙 |
| `anti-patterns.md` | Figma 정본에서 벗어나는 실패 패턴 |
| `promotion-readiness.md` | component proposal/promotion 후보와 제외 기준 |

### 4.2 Agent-facing reference index

```text
packages/agent/docs/
  design-references/
    README.md
    reference-index.md
    reference-selection-rules.md
```

`packages/agent/docs/design-references/`는 `docs/design/reference/*`를 agent input에 어떻게 노출할지 설명하는 얇은 index다. 원문 정본은 `docs/design/reference/*`에 남긴다.

| 문서 | 책임 |
|---|---|
| `README.md` | agent-facing design reference 운영 기준 |
| `reference-index.md` | reference id, source path, 요약, 적용 stage |
| `reference-selection-rules.md` | screen family/design skill별 required/optional reference 선택 규칙 |

### 4.3 Domain design skills

```text
packages/agent/docs/design-skills/
  detail-confirmation-screen.md
  form-entry-screen.md
  list-selection-screen.md
  ...
```

Domain design skill은 화면 유형별 Compose 판단을 돕는 문서다. 정답 내용을 모두 복제하지 않고, 필요한 Figma-derived reference를 가리키는 라우터로 둔다.

각 skill 문서 기본 구조:

```md
# <Skill Name>

## When to use
## Required references
## Optional references
## Composition obligations
## Pattern selection hints
## Component proposal signals
## Promotion readiness signals
## Rejected patterns
## Quality gates
## Revision hints
```

### 4.4 Skill candidate levels and RenderTree application

수집한 skill 후보는 RenderTree node type과 1:1로 대응하지 않는다. skill은 node-tree를 만들기 전과 만드는 중에 사용하는 판단 규칙이다.

| Skill level | 예시 | 적용 위치 | RenderTree 영향 |
|---|---|---|---|
| Scenario skill | `form-entry-screen`, `checkout-payment-screen`, `cart-review-screen` | `DesignSkillSelection`, `CompositionPlan` | `Screen`, `Screen.Header`, `Screen.Contents`, `Screen.Bottom`, section order, primary CTA |
| Domain skill | `address-input`, `payment-summary-ledger`, `cart-product-list` | `CompositionPlan.sections`, `PatternSelection`, `component-proposal` | `area.static`/`area.dynamic` grouping, composite 후보, repeated component composition |
| Atomic skill | `text-field-states`, `bottom-fixed-cta`, `section-divider-rhythm` | `Generate RenderTree`, `Validate`, `Revise` | catalog component props/state, spacing rhythm, CTA placement, divider usage |

적용 원칙:

- Skill은 임의의 새 `node.type`을 만들지 않는다.
- 실제 RenderTree는 `@cx/components/catalog`와 허용된 layout candidates 안에서만 생성한다.
- catalog에 없는 domain pattern은 바로 node type으로 쓰지 않고 `component-proposal` 후보로 남긴다.
- Scenario skill은 화면 전체 구조를 결정하고, domain skill은 area/composite grouping을 돕고, atomic skill은 component props/state와 rhythm을 보정한다.

예시:

```text
checkout-payment-screen
-> Screen title, section order, bottom CTA obligation 결정

payment-summary-ledger
-> "결제 금액" area 안의 금액 row/discount/total 조합 결정

bottom-fixed-cta
-> Screen.Bottom의 primary action 존재 여부와 label clarity 검증
```

결과적으로 skill 후보는 나중에 아래 위치에 연결된다.

```text
SourceSpec
-> ScreenIntent
-> DesignSkillSelection
-> DesignReferenceSelection
-> CompositionPlan
-> PatternSelection
-> RenderTree
-> Validation / Revision
```

## 5. Figma SOT Review Procedure

Figma 링크가 제공되면 아래 순서로 확인한다.

1. Figma file/page/node와 분석 범위를 `figma-source.md`에 기록한다.
2. 화면 목록을 유형별로 묶는다.
   - 상세/확인
   - 입력/폼
   - 리스트/선택
   - 완료/피드백
   - bottom sheet/overlay
   - main task/dashboard
   - 상태/알림/account status
3. 각 화면 유형마다 다음을 추출한다.
   - primary user action
   - section order
   - visible hierarchy
   - bottom action rhythm
   - repeated row/list pattern
   - state/validation behavior
   - component/variant usage
   - anti-pattern
4. 기존 `docs/design/*`와 비교해 중복/누락을 분리한다.
5. 필요한 domain design skill 후보와 우선순위를 정한다.
6. component promotion 로직이 참조해야 할 promotion signal을 `promotion-readiness.md`에 분리한다.

현재 등록된 SOT node:

- 메인 페이지: `10042:57541`
- 사용자 정보입력: `10095:23483`
- 상품 상세화면: `10069:97828`
- 텍스트 리스트: `10042:46203`
- 카드 리스트: `9896:91122`
- 결과 및 확인 완료: `10090:60588`

## 6. Initial Skill Hypothesis

Figma SOT 확인 전 가설이다. 실제 skill 목록은 Figma 분석 후 조정한다.

| 우선순위 | Skill id | 목적 | 주요 reference |
|---|---|---|---|
| P1 | `detail-confirmation-screen` | 요약, 상세, 확인 CTA | `screen-archetypes`, `visual-hierarchy`, `layout-rhythm`, `component-usage` |
| P1 | `form-entry-screen` | 입력, 검증, 동의, 제출 | `interaction-states`, `source-to-screen-mapping`, `layout-rhythm`, `component-usage` |
| P1 | `list-selection-screen` | 반복 row, 선택, 비교 | `screen-archetypes`, `component-usage`, `layout-rhythm`, `visual-hierarchy` |
| P2 | `completion-feedback-screen` | 완료/실패/대기/영수증 | `screen-archetypes`, `interaction-states`, `visual-hierarchy` |
| P2 | `bottom-sheet-decision` | bottom sheet 선택/확인/필터 | `interaction-states`, `layout-rhythm`, `anti-patterns` |
| P2 | `account-status-alert` | 휴면/자격/제한/경고 | `source-to-screen-mapping`, `visual-hierarchy`, `component-usage` |
| P3 | `main-task-screen` | 초기 진입/대시보드성 화면 | `screen-archetypes`, `visual-hierarchy`, `layout-rhythm` |

지금 단계에서는 Open Design식 scenario skill과 atomic skill을 런타임 구조로 바로 만들지 않는다. 다만 Figma SOT 관찰 기록에서는 scenario/domain/atomic 후보를 분리해 수집하고, 실제 skill 문서와 pipeline 연결은 후보가 충분히 모인 뒤 진행한다.

## 6.1 Skill Collection Backlog

Figma SOT 관찰을 진행하면서 아래 목록을 계속 갱신한다. 이 목록은 구현 대상 확정이 아니라 skill 후보 pool이다.

### Scenario skill candidates

| Skill id | 근거 SOT | 상태 | 나중에 작성할 핵심 규칙 |
|---|---|---|---|
| `form-entry-screen` | `10095:23484` | 후보 등록 | 개인정보 입력 section order, field state, 주소 검색, bottom CTA |
| `checkout-additional-info` | `10095:23501` | 후보 등록 | 상품 요약 sheet, 옵션 선택, 배송 정보 반복 입력, 다음 CTA |
| `checkout-payment-screen` | `10161:49136` | 후보 등록 | 결제 수단, 포인트/할인, 약관, payment ledger, 결제 CTA |
| `cart-review-screen` | `10161:49258` | 후보 등록 | 배송 요약, 카트 상품 목록, 인증/안내, 예상 금액, 약관 CTA |
| `main-task-screen` | `10042:57541` | 후보 등록 | 메인 shell, 관리/검색/쇼핑 home 분기, BottomNavigation |
| `management-home-screen` | `10042:58271`, `10095:44460` | 후보 등록 | account/task management card stack, segment variant |
| `search-home-screen` | `10082:59886` | 후보 등록 | search hero, keyword chip cloud, SearchBar primary action |
| `shopping-home-feed-screen` | `10042:58251` | 후보 등록 | BannerShop, ChipImage, repeated HomeCardCarousel feed |
| `product-detail-screen` | `10069:97828` | 후보 등록 | 상품 상세 공통 hero, 가격/혜택 위계, 상품 유형별 CTA |
| `subscription-product-detail-screen` | `10069:97829` | 후보 등록 | 구독 상품의 가격/혜택 accordion, 추천 상품, dual CTA |
| `gifticon-product-detail-screen` | `10069:97927` | 후보 등록 | 금액권 price, 사용처 meta, 안내사항, 구매 CTA |
| `device-product-detail-screen` | `10069:121732` | 후보 등록 | 색상/용량/배송 옵션 선택, guided CTA |
| `text-list-screen` | `10042:46203` | 후보 등록 | 내역형/안내형 분기, summary/filter/search/row primitive 선택 |
| `usage-history-list-screen` | `10082:58057` | 후보 등록 | 이용 내역 summary, section grouping, InfoTextList rhythm |
| `point-history-list-screen` | `10082:58364` | 후보 등록 | 포인트 summary, chip filter, point value emphasis, month group |
| `discount-history-list-screen` | `10082:58227` | 후보 등록 | 할인 summary, chip filter, monthly discount row list |
| `faq-guide-list-screen` | `10082:43724` | 후보 등록 | tab, chip, search, FAQ accordion open/closed state |
| `notice-text-list-screen` | `10082:47225` | 후보 등록 | summary/filter 없는 dense notice row list |
| `card-list-screen` | `9896:91122` | 후보 등록 | card list 상품군 분기, chip/filter/sort, card type 선택 |
| `subscription-card-list-screen` | `9792:110378` | 후보 등록 | 구독상품 image card grid, price/badge hierarchy |
| `device-card-grid-screen` | `9792:110351` | 후보 등록 | 단말기 image grid, capacity badge, discount price |
| `benefit-card-list-screen` | `9754:62082` | 후보 등록 | 혜택/브랜드 horizontal card list |
| `plan-card-list-screen` | `9754:62038` | 후보 등록 | 요금제 data/price card, grouped sections |
| `add-on-service-card-list-screen` | `9754:62108` | 후보 등록 | chip 없는 service card list, count/sort/filter |
| `internet-card-list-screen` | `9754:62134` | 후보 등록 | 인터넷 속도/월 이용료 중심 card list |
| `completion-feedback-screen` | `10090:60588` | 후보 등록 | 완료/결제/해지/변경 분기, hero message, next action |
| `activation-completion-screen` | `10090:58791` | 후보 등록 | 개통 완료 summary, data transfer secondary action |
| `plan-change-completion-screen` | `10090:58796` | 후보 등록 | 요금제 변경 완료 summary, 적용일/요금제 정보 |
| `cancellation-completion-screen` | `10090:58816` | 후보 등록 | 해지 완료 message, recommendation/refund actions |
| `payment-receipt-completion-screen` | `10090:58801` | 후보 등록 | receipt ledger, product/delivery/gift sections |

### Domain skill candidates

| Skill id | 근거 SOT | 상태 | 나중에 작성할 핵심 규칙 |
|---|---|---|---|
| `address-input` | `10095:23484`, `10095:23501` | 후보 등록 | 우편번호 row, 주소 찾기, 기본 주소, 상세 주소, 동일 정보 shortcut |
| `same-as-info-shortcut` | `10095:23484`, `10095:23501` | 후보 등록 | 가입자 정보와 동일, 배송지 정보 재사용, checked state |
| `option-selection-group` | `10095:23501` | 후보 등록 | radio/checkbox 선택 묶음, callout 연결 |
| `delivery-address-group` | `10095:23501`, `10161:49258` | 후보 등록 | 수령자 이름, 연락처, 주소, 배송 summary |
| `payment-method-selection` | `10161:49136` | 후보 등록 | 결제 수단 선택과 selected/default state |
| `point-redemption-input` | `10161:49136` | 후보 등록 | 포인트/할인 입력, 사용 가능 금액, validation hint |
| `payment-summary-ledger` | `10161:49136`, `10161:49258` | 후보 등록 | 금액 row, 할인 row, total emphasis, divider |
| `agreement-gate-cta` | `10161:49136`, `10161:49258` | 후보 등록 | 약관 동의와 결제/진행 CTA의 의존 관계 |
| `cart-product-list` | `10161:49258` | 후보 등록 | 상품 row/card 반복, 수량/옵션/가격 정보 |
| `product-summary-sheet` | `10095:23501` | 후보 등록 | 선택 상품 요약 sheet, 월 납부 금액, expand affordance |
| `product-hero-info` | `10069:97829`, `10069:97927`, `10069:121732` | 후보 등록 | Thumbnail, ProductInfo, price, badge, coupon action |
| `product-price-benefit-summary` | `10069:97829` | 후보 등록 | 할인율, 월 구독가, 배송/혜택 정보 accordion |
| `product-detail-media-section` | `10069:97829`, `10069:121732` | 후보 등록 | UnderlineTab, 상세 이미지, dim, ButtonMore |
| `notice-accordion-list` | `10069:97829`, `10069:97927`, `10069:121732` | 후보 등록 | 안내/고시/판매자 정보 accordion row list |
| `device-option-selection` | `10069:121732` | 후보 등록 | 색상/용량/배송 옵션 selected/default/recommended state |
| `merchant-usage-meta` | `10069:97927` | 후보 등록 | 금액권 사용처, 교환처, 사용 조건 meta |
| `summary-card-ledger` | `10082:58057`, `10082:58364`, `10082:58227` | 후보 등록 | 목록 상단 aggregate metric, secondary row, optional action |
| `info-text-list-row` | `10082:58057`, `10082:58364`, `10082:58227`, `10082:47225` | 후보 등록 | title/right value/sub meta/date/divider/chevron surface |
| `filter-chip-row` | `10082:58364`, `10082:58227`, `10082:43724` | 후보 등록 | active/inactive chip state, horizontal filter semantics |
| `month-grouped-info-list` | `10082:58364`, `10082:58227` | 후보 등록 | month title, repeated InfoTextList, divider rhythm |
| `faq-accordion-list` | `10082:43724` | 후보 등록 | Q/A row, open body, closed row, search/filter 연결 |
| `home-card-section-stack` | `10042:58271`, `10095:44460` | 후보 등록 | CardSection 반복, ButtonItem 더보기, banner insertion |
| `home-card-carousel-feed` | `10042:58251` | 후보 등록 | TitleMain + carousel slot 반복, section vertical rhythm |
| `card-list-filter-bar` | `9792:110378`, `9792:110351`, `9754:62082`, `9754:62038`, `9754:62108`, `9754:62134` | 후보 등록 | count, sort, filter icon/button row |
| `product-card-grid` | `9792:110378`, `9792:110351` | 후보 등록 | 2-column product cards, image/title/price/badge |
| `product-horizontal-card-list` | `9754:62082`, `9754:62038` | 후보 등록 | full-width ListProductHorizontal stack |
| `service-card-list` | `9754:62108`, `9754:62134` | 후보 등록 | service/internet card copy density and tag chips |
| `completion-summary-card` | `10090:58791`, `10090:58796` | 후보 등록 | 완료 결과 key/value summary card |
| `receipt-ledger-section` | `10090:58801` | 후보 등록 | payment rows, final amount emphasis, divider |
| `completion-recommendation-carousel` | `10090:58816`, `10090:58801` | 후보 등록 | 완료 후 추천 상품 carousel |

### Atomic skill candidates

| Skill id | 근거 SOT | 상태 | 나중에 작성할 핵심 규칙 |
|---|---|---|---|
| `text-field-states` | `10095:23484`, `10095:23501` | 후보 등록 | disabled, typed, help text, validation state 구분 |
| `bottom-fixed-cta` | 여러 checkout/form frame | 후보 등록 | Screen.Bottom primary action, label clarity, content와 action rail 분리 |
| `section-divider-rhythm` | 여러 form/checkout frame | 후보 등록 | `Pagestack` 반복, 4px divider, section spacing |
| `callout-after-selection` | `10095:23501` | 후보 등록 | 선택 직후 안내 callout 배치와 정보 밀도 |
| `list-row-emphasis` | `10082:58057`, `10082:58364`, `10082:58227`, `10082:47225`, `9896:91122` | 후보 등록 | row/card title/meta/subtext/right value/chevron priority |
| `bottom-navigation-shell` | `10042:57541` | 후보 등록 | home shell navigation, bottom CTA 금지 조건 |
| `completion-bottom-actions` | `10090:58791`, `10090:58796`, `10090:58816`, `10090:58801` | 후보 등록 | confirm/next task split, input CTA carryover 금지 |

수집 단계의 완료 기준:

- 등록된 SOT node마다 최소 1개 이상의 scenario skill 후보를 가진다.
- 반복되는 area/composite 후보는 domain skill로 따로 기록한다.
- component state와 spacing처럼 여러 화면에 걸친 규칙은 atomic skill로 분리한다.
- 각 후보는 실제 skill 작성 전 재조회할 node와 작성할 내용을 가진다.

## 7. Orchestration Direction

후속 구현은 아래 계약을 목표로 한다.

### 7.1 Schema

후보 계약:

```ts
type DesignReferenceRef = {
  id: string;
  path: string;
  title: string;
  reason: string;
  requiredBy?: string[];
};

type DesignReferenceSelection = {
  schemaVersion: "design-reference-selection.v0.1";
  selected: DesignReferenceRef[];
  skipped?: Array<{
    id: string;
    reason: string;
  }>;
};
```

`@cx/schema`는 reference selection DTO만 소유한다. Markdown 본문이나 선택 알고리즘은 소유하지 않는다.

### 7.2 Orchestration

후보 helper:

```ts
buildDesignReferenceSelection({
  sourceSpec,
  screenIntent,
  compositionPlan,
  designSkillSelection,
  layerCandidates,
}): DesignReferenceSelection
```

경계:

- `@cx/orchestration`은 reference id/path/reason만 선택한다.
- 파일을 읽지 않는다.
- Figma 링크를 조회하지 않는다.
- quality score나 validation 결과를 판정하지 않는다.

### 7.3 Pipeline

`@cx/pipeline`은 다음을 담당한다.

- 선택된 reference Markdown 본문 로드
- agent input context에 reference content 주입
- `trace.json.designReferenceSelection` 기록
- `trace.json.designReferenceContents` 또는 요약/provenance 기록
- `manifest.json`에는 standalone result artifact만 포인터로 유지

후보 trace shape:

```json
{
  "designSkillSelection": {},
  "designReferenceSelection": {
    "selected": [
      {
        "id": "layout-rhythm",
        "path": "docs/design/reference/layout-rhythm.md",
        "reason": "form-entry-screen requires spacing and bottom action rhythm"
      }
    ]
  },
  "compositionReferenceGrounding": {
    "visualHierarchy": ["visual-hierarchy", "screen-archetypes"],
    "sectionRhythm": ["layout-rhythm"],
    "patternRationale": ["screen-archetypes", "component-usage"]
  }
}
```

### 7.4 Agent Input

`plan-composition`, `select-pattern`, `generate-render-tree`, `propose-components`, `review-quality`, `revise-render-tree-if-invalid`가 selected references를 사용할 수 있다.

우선순위:

```text
SourceSpec evidence
> schema/catalog/layout candidates
> Figma-derived reference
> generic design-context bundle
> model preference
```

## 8. Artifact Direction

물리 artifact는 계속 flat하게 유지한다.

```text
data/runs/screen-generation/<run-id>/
  manifest.json
  artifacts/
    source-spec.json
    screen-intent.json
    composition-plan.json
    decoration-plan.json
    pattern-selection.json
    agent-result.json
    final-result.json
    validation-report.json
    quality-review.json
    component-proposal.json
    pipeline-result.json
    trace.json
```

새로운 standalone 파일을 남길지는 후속 구현 때 결정한다. 기본 방향은 reference selection을 `trace.json`에 두고, result artifact 수를 늘리지 않는 것이다.

권장:

- `trace.json.designReferenceSelection`
- `trace.json.designReferenceGrounding`
- `composition-plan.json.referenceDecisions`는 schema 변경이 필요할 때만 도입
- `quality-review.json`에는 reference conformance finding code를 추가
- `component-proposal.json`에는 promotion readiness 근거를 추가

## 9. Component Promotion Integration

옆 세션의 component promotion 강화 작업은 다음 reference와 연결한다.

필수 reference:

- `docs/design/reference/component-usage.md`
- `docs/design/reference/promotion-readiness.md`
- `docs/design/reference/anti-patterns.md`

후보 proposal/promotion 필드:

```ts
type ComponentPromotionEvidence = {
  figmaReferenceIds: string[];
  sourceRefs: string[];
  nearestCatalogMatch: string;
  repeatedPatternEvidence?: string;
  promotionReadinessReason: string;
  notPromotedReason?: string;
};
```

판단 기준:

- Figma reference에 대응 component/variant가 있다.
- 기존 catalog component로 반복적으로 근사하고 있다.
- source evidence가 명확하다.
- 단일 화면 copy 차이나 임시 조합이 아니다.
- promotion 후 schema/catalog surface가 명확하다.

## 10. Implementation Phases

### Phase 1 - Figma SOT Review

- Figma link 확인
- `figma-source.md` 작성
- screen archetype/component/layout/state/promotion signal 초안 추출
- skill 후보와 우선순위 확정

### Phase 2 - Directory Structure

- `docs/design/reference/` 생성
- `packages/agent/docs/design-references/` 생성
- `docs/design/README.md`, `packages/agent/docs/README.md` 연결
- 기존 `design-skills` 문서에 required references 섹션 정리

### Phase 3 - Reference Content

- Figma-derived reference md 작성
- P0/P1/P2 gate 문장으로 정리
- `promotion-readiness.md`를 component promotion 작업과 맞춘다

### Phase 4 - Orchestration Contract

- `DesignReferenceSelection` schema 도입 여부 결정
- `buildDesignReferenceSelection()` 구현
- agent input에 selected reference refs/content 연결

### Phase 5 - Artifact and Review

- `trace.json.designReferenceSelection` 기록
- quality review에 reference conformance finding 추가
- component proposal/promotion에 Figma reference evidence 연결
- smoke explorer에 selected references 표시 여부 결정

## 11. Verification Criteria

문서 구조 단계:

- `find docs/design/reference packages/agent/docs/design-references -maxdepth 2 -type f`로 예상 파일 확인
- `rg -n "Required references|promotion-readiness|figma-source" docs packages/agent/docs`
- Markdown이 formatter/linter 대상에서 제외될 경우 `git diff --check`로 whitespace 검증

후속 구현 단계:

- `trace.json.designReferenceSelection.selected`가 존재한다.
- selected reference는 선택된 domain design skill의 required references를 포함한다.
- `composition-plan.json`의 디자인 판단 필드가 selected reference와 모순되지 않는다.
- `quality-review.json`이 reference conformance 문제를 bounded finding으로 표현한다.
- `component-proposal.json` 또는 promotion candidate가 Figma reference 근거를 가진다.

## 12. Open Questions

- Figma SOT를 어느 granularity로 reference md에 반영할 것인가?
- Figma screenshot/golden image를 smoke visual baseline과 연결할 것인가, 아니면 md reference만 정본으로 둘 것인가?
- `DesignReferenceSelection`을 `@cx/schema` 정식 artifact kind로 둘 것인가, `trace.json` 내부 구조로만 둘 것인가?
- `CompositionPlan`에 `referenceDecisions` 필드를 추가할 것인가?
- component promotion 최종 승인 흐름은 pipeline artifact 이후 어디에서 일어나는가?
