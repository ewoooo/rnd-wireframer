# RND Screen Generator 데이터 맵

## 1. 문서 책임

이 문서는 RND Screen Generator의 데이터 종류와 소비 데이터 계약을 정의한다.

제품 범위는 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 기술 경계는 [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md)를 따른다.

현재 데이터는 아래 생명 주기로 나눈다.

| 타입 | 역할 | 대표 위치 |
|---|---|---|
| 원천 import 데이터 | 사용자가 올린 수급 원본이다. 파괴적으로 수정하지 않는다. | [database/client-imports](/Users/plusx/Documents/rnd-screen-generator/database/client-imports) |
| 공급 데이터 | 화면 생성/렌더링에 필요한 어휘, 패턴, 구현 자산을 제공한다. | [packages/component](/Users/plusx/Documents/rnd-screen-generator/packages/component), [packages/layout](/Users/plusx/Documents/rnd-screen-generator/packages/layout), [packages/token](/Users/plusx/Documents/rnd-screen-generator/packages/token) |
| AI import 데이터 | AI가 생성한 등록 후보 bundle과 table 후보 산출물이다. 소비 데이터가 아니다. | [database/ai-imports](/Users/plusx/Documents/rnd-screen-generator/database/ai-imports) |
| 소비 데이터 | workbench, resolver, renderer가 실제 화면 단위로 소비하는 승인된 정규화 입력이다. | [database/tables](/Users/plusx/Documents/rnd-screen-generator/database/tables) |

우선순위는 소비 데이터 강화다. 공급 데이터는 소비 데이터를 만들기 위한 근거와 어휘로 쓰되, workbench가 직접 공급 원본을 해석하도록 만들지 않는다.
`apps/web` workbench는 `database/client-imports`, `database/ai-imports`, `@cx/layout/catalog`를 화면 데이터처럼 직접 해석하지 않고, `database/tables` 계약 또는 동일 shape의 loader 결과만 소비한다.

생명 주기 강제 규칙:

- `database/client-imports`는 업로드 원본 보관소다. 원본을 수정해 정규화하지 않는다.
- `database/ai-imports`는 생성/정규화/검수 후보 산출물 보관소다. 여기의 `*.materialized.json`은 table 후보일 뿐이며 앱 소비 데이터가 아니다.
- `database/tables`는 승인된 소비 데이터만 둔다. AI 생성 API나 parser가 이 디렉토리를 직접 덮어쓰지 않는다.
- `@cx/layout/catalog`는 reference catalog다. 소비 데이터는 pattern 전체를 복사하지 않고 `pattern.id`, `pattern.variant`만 참조한다.
- 후보 산출물을 소비 데이터로 반영하려면 별도 promote/import 단계를 거쳐 참조 무결성, renderer validation, 변경 이력 기록을 통과해야 한다.

데이터 흐름 관계를 시각 검토할 때는 [DATA_FLOW.dbml](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_FLOW.dbml)을 사용한다. 이 DBML은 migration 스키마가 아니라 공급 데이터가 소비 데이터로 정규화되는 흐름과 참조 관계를 표현한 산출물이다.

## 2. 데이터 흐름

```text
원천 import 데이터
  └─ database/client-imports/{importId}/...
공급 데이터
  ├─ @cx/layout catalog
  ├─ @cx/components
  ├─ @cx/layout
  └─ @cx/tokens
        |
        v
parser / normalizer / resolver
        |
        v
AI import 데이터
  ├─ agent-assets.json             (GeneratedNodeTree, Claude SDK 원본)
  ├─ agent-assets.registered.json  (RegisteredNodeTree, Register 결과)
  ├─ agent-assets.composed.json    (ComposedNodeTree, Composer 결과)
  ├─ agent-assets.decorated.json   (DecoratedNodeTree, Decorator 결과)
  ├─ agent-assets.design-review.json   (DesignReview patch/report)
  ├─ agent-assets.reviewed.json   (DesignReview patch 적용 DecoratedNodeTree)
  └─ agent-assets.materialized.json   (MaterializedNodeTree, DB 변환 결과)
        |
        v
promote / import
        |
        v
소비 데이터
  ├─ screen_routes.json
  ├─ screen_variants.json
  ├─ screens.json
  ├─ areas.json
  └─ components.json
        |
        v
@cx/renderer tablesToRenderTree
        |
        v
RenderTree DTO
        |
        v
@cx/renderer validation / React render
        |
        v
@cx/layout / @cx/components
        |
        v
apps/web
```

## 3. 공급 데이터

공급 데이터는 "무엇을 만들 수 있는가"와 "어떤 근거로 만들었는가"를 제공한다.

| 공급원 | 책임 | 소비 데이터 반영 방식 |
|---|---|---|
| `database/client-imports/{importId}` screen markdown | 화면 ID, 화면명, 화면 구성, 화면 전환, 케이스 분기, 정책/기능 참조 | AI import 후보를 거쳐 `screenRoutes`, `screenVariants`, `screens.screen.regions`, `sourceRef` |
| `database/client-imports/{importId}` area markdown | OGN ID, OGN명, 노출 조건, 상태 분기, 컴포넌트 상세, 정책/기능 참조 | AI import 후보를 거쳐 `areas`, `components`, area/component metadata |
| `@cx/component-pattern-store` | primitive/componentPattern 조합으로 만든 재사용 semantic UI block registry | Compose 단계의 `reuse-pattern`, `proposedComponentPatterns` 큐레이션/재사용 |
| `@cx/layout/catalog` | screen/region/area/composite children layout preset, pageStack/divider 규칙 | `screens[].pattern`, `areas[].pattern`, composite wrapper `components[].pattern` |

PRDD 원천 import는 기본 생성 비용을 낮추기 위해 `database/client-imports/PRDD/screen/*.md`에는 `*-0.md` base 화면만 둔다. `*-1.md`, `*-2.md`, `*-E1.md` 같은 비-base 화면은 `database/client-imports/PRDD/variants/`에 보관하며, 명시적 variant/retry 생성 또는 edge-case 검증 때만 입력으로 승격한다.
| `packages/component` | 실제 leaf component 구현 어휘 | `components[].type`, renderer mapping |
| `packages/layout` | `Screen.*`, `Layout.*`, chrome/primitive 구현, layout pattern component, catalog/resolver | `screens[].screen.regions[*].type`, layout props, pattern refs |
| `packages/token` | Tailwind v4 `@theme` spacing token | layout spacing props, style token 값 |
| `packages/renderer/src/component-catalog.ts` | compose/AI/editor가 참조하는 component prop/variant 계약 | `components[].props`, `components[].hooks`, AI gap 판정 |

공급 데이터 원칙:

- 원천 import는 파괴적으로 수정하지 않는다.
- 공급 데이터는 workbench 직접 입력이 아니라 소비 데이터 생성 근거다.
- `@cx/component-pattern-store`는 의미 있는 UI 조합 계약이다. `@cx/layout/catalog`의 composite pattern은 componentPattern이 아니라 composite children layout recipe다.
- `@cx/layout/catalog`는 공급 데이터다. 소비 데이터는 pattern 전체를 복사하지 않고 `pattern.id`, `pattern.variant`만 참조한다.
- layout catalog의 recipe는 parser/resolver/generator 단계에서 `pattern.id`, `pattern.variant` 참조로만 소비 데이터에 남기고, `@cx/renderer`의 `tablesToRenderTree`가 RenderTree DTO로 projection할 때 layout recipe를 materialize한다. React render 단계는 layout catalog JSON을 직접 읽지 않는다.
- layout catalog가 주입할 수 있는 값은 `layoutProps`다. Leaf component의 텍스트, 상태, variant, hook, binding props는 `database/tables/components.json`이 소유한다.
- `packages/component`, `packages/layout`, `packages/token`은 런타임 구현 어휘다. 소비 데이터의 `type`, `pattern`, `props`는 이 어휘로 해석 가능해야 한다.

Design Review 단계는 DecoratedNodeTree 이후 디자인 품질을 보정하는 patch 단계다. `moveComponent`, `updatePattern`, `createNewPattern`, `createComponent`, `createComposite`, `setDisplay`, `updateComponentProps` 같은 제한된 operation만 제안할 수 있으며, 각 finding/operation은 반드시 [packages/agent/docs/skills/references/design](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs/skills/references/design)의 책임 문서를 `designReferences`로 인용해야 한다. AI는 tree 전체를 재생성하지 않고 Design Review patch만 제안하며, deterministic code가 patch를 적용하고 검증한다.

## 4. 소비 데이터

소비 데이터는 [database/tables](/Users/plusx/Documents/rnd-screen-generator/database/tables)의 테이블 JSON 구조를 기준으로 한다.

| 파일 | 최상위 키 | 책임 |
|---|---|---|
| [screen_routes.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screen_routes.json) | `screenRoutes` | 사용자가 탐색하는 화면 흐름 단위 |
| [screen_variants.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screen_variants.json) | `screenVariants` | route 아래 base/edge 생성 대상 |
| [screens.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screens.json) | `screens` | 실제 렌더 가능한 화면 인스턴스 |
| [areas.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/areas.json) | `areas` | 화면 region에 배치되는 OGN 섹션 |
| [components.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/components.json) | `components` | OGN 또는 screen region에서 참조하는 concrete render node |

용어 기준:

`component`와 `composite`는 **서로 다른 범위의 어휘**다.

- **component** — `database/tables/components.json`의 일반 render row다. 단일 `@cx/components` leaf일 수도 있고, 후속 composite wrapper일 수도 있다. region/area child entry는 이 row를 `kind: "component"`로 참조한다.
- **composite** — 최소 2개 이상의 `@cx/components`를 결합한 합성 컴포넌트다. `@cx/layout/catalog`의 `composite-patterns.json`은 이 합성 wrapper 내부의 children/slot layout만 다룬다.
- **catalog source** — `source: "react-component" | "renderer-composite" | "layout-primitive"`는 `packages/renderer/src/component-catalog.ts`에서 구현 출처를 설명하는 보조 정보다.

따라서 일반 render row를 composite라고 부르지 않는다. composite 용어는 합성 wrapper가 실제로 존재할 때만 쓴다.

소비 데이터 관계는 아래 방향만 허용한다.

```text
screenRoute
└─ screenVariant.screenRouteId
      └─ screen.screenVariantId
         └─ screen.regions.{header,contents,bottom}.children[]
         ├─ { kind: "component", id } -> components[].id
         └─ { kind: "area", id } -> areas[].id
            └─ area.children[].id -> components[].id
```

역방향 배열 FK는 기본으로 두지 않는다. 예를 들어 route가 screen 목록을 직접 들고 있지 않고, `screen.screenVariantId`가 variant를 바라본다.

## 5. 소비 데이터 계약

### screenRoutes

`screenRoutes`는 사용자가 workbench에서 고르는 흐름 단위다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | route 고유 ID. 예: `mbr-join` |
| `moduleId` | 업무 모듈. 예: `mbr` |
| `name` | 탐색 UI에 표시할 이름 |
| `order` | route 정렬 순서 |

선택 필드:

| 필드 | 설명 |
|---|---|
| `processId` | 정책/업무 프로세스와 연결할 때 사용하는 ID |
| `sourceRef` | 첨부 원본 묶음, 파일명, 문서 버전 등 추적 정보 |

### screenVariants

`screenVariants`는 route 아래 생성 대상 화면 묶음이다. base와 edge를 같은 레벨에서 다룬다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | variant 고유 ID |
| `screenRouteId` | 상위 route ID |
| `name` | variant 이름 |
| `order` | route 안의 variant 정렬 순서 |
| `variantType` | `base` 또는 `edge` |

선택 필드:

| 필드 | 설명 |
|---|---|
| `baseVariantId` | edge variant가 기준으로 삼는 base variant |
| `trigger` | edge 발생 조건 |
| `differenceFromBase` | base 대비 차이 |
| `followUp` | 후속 처리 |
| `sourceRef` | 첨부 screen markdown의 케이스 분기 row 추적 정보 |

### screens

`screens`는 workbench와 `@cx/renderer`의 `tablesToRenderTree`가 직접 소비하는 화면 인스턴스다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | 화면 고유 ID |
| `screenVariantId` | 소속 variant ID |
| `version` | RenderTree schema version |
| `minRendererVersion` | 최소 renderer version |
| `metadata` | `@cx/renderer` schema metadata |
| `pattern.id` | 공급 pattern 참조 |
| `screen.type` | 화면 surface. `screen.page`, `screen.bottomSheet`, `screen.popup` 중 하나 |
| `screen.regions.header` | `Screen.Header` region |
| `screen.regions.contents` | `Screen.Contents` region |
| `screen.regions.bottom` | `Screen.Bottom` region |

node type 용어는 아래 축으로 분리한다.

| 축 | 예시 | 소유자 | 의미 |
|---|---|---|---|
| screen surface | `screen.page`, `screen.bottomSheet`, `screen.popup` | `screens[].screen.type` | 화면 표시 형태. RenderTree node type이 아니다. |
| screen region | `Screen.Header`, `Screen.Contents`, `Screen.Bottom` | `screens[].screen.regions.*.type` | RenderTree의 3분할 region node type이다. |
| area behavior | `area.static`, `area.dynamic` | `areas[].type` | OGN 섹션의 노출/상태 동작이다. |
| layout/wrapper | `Layout.Flex`, `Layout.Grid`, `PageStack` | `@cx/renderer` projection | pattern이 materialize하는 구조 node type이다. |
| component | `Accordion`, `ListCell`, `TextField`, `accordion` alias | `components[].type`, `component-catalog` | 실제 render component 또는 renderer composite 타입이다. |

따라서 `*.page`와 `*.static` 같은 namespace type은 데이터 구조/동작 축이고, `Accordion`/`accordion`은 component catalog 축이다. 새 타입을 추가할 때는 같은 `type` 문자열을 재사용하더라도 먼저 어느 축의 계약인지 정한다.

시스템 상태 영역(StatusBar/SystemHeader)은 소비 데이터의 region child로 넣지 않는다. 모바일 프리뷰에서 항상 필요한 화면 chrome이므로 `@cx/layout`의 `AppScreen`이 자동으로 렌더링한다.

권장 필드:

| 필드 | 설명 |
|---|---|
| `order` | 같은 variant 안의 화면 step 순서 |
| `theme` | 렌더 theme |
| `data` | binding 대상 화면 데이터 |
| `sourceRef` | 원천 screen markdown 추적 정보 |

region child entry는 두 종류만 허용한다.

```json
{ "kind": "component", "id": "top-navigation" }
{ "kind": "area", "id": "ogn-mbr-term-list" }
```

### areas

`areas`는 화면 region에 배치되는 섹션 단위다.

소비 데이터의 canonical OGN 코드는 `areas[].id`다.
`props.areaCode`는 source JSON에서 직접 관리하지 않고, render tree 생성 단계에서 `id`로부터 파생해 넣는다.
생성된 `Area` node는 원천 OGN 추적을 위해 `props.areaCode`를 유지한다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | OGN 고유 ID. 첨부 명세의 `오가니즘 ID`와 맞춘다. |
| `type` | `area.static` 또는 `area.dynamic` |
| `version` | OGN node version |
| `metadata` | `@cx/renderer` node metadata |
| `children` | 이 OGN이 참조하는 concrete render node 목록 |

권장 필드:

| 필드 | 설명 |
|---|---|
| `props.name` | source OGN 명. `metadata.title`과 별도로 원천 명칭을 보존해야 할 때 사용 |
| `pattern.id` | 공급 pattern 참조 |
| `pattern.variant` | pattern variant |
| `states` | default/loading/error 등 상태별 visible component id |
| `sourceRef` | 원천 area markdown 추적 정보 |
| `policyRefs` | 관련 정책 코드 |
| `featureRefs` | 관련 기능 코드 |

`areas[].children[].id`는 [components.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/components.json)의 `components[].id`를 바라본다.

### components

`components`는 renderer가 실제 leaf node 또는 작은 render subtree로 렌더링할 concrete component row다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | concrete component row 고유 ID |
| `type` | renderer mapping 대상 node type. 예: `HeaderBase`, `ListCell`, `TextField`, `SectionMessage` |
| `version` | component row version |
| `metadata` | `@cx/renderer` node metadata |
| `pattern` | composite wrapper일 때 내부 children/slot layout pattern 참조 |
| `children` | 실제 leaf component와 props를 담는 render child 목록 |

권장 필드:

| 필드 | 설명 |
|---|---|
| `props` | component props 또는 binding 값 |
| `hooks` | component interaction contract. `{ trigger, action, target?, params? }` 형태의 `NodeHook[]` |
| `display` | 상태별 노출 조건 |
| `sourceRef` | 첨부 area markdown의 컴포넌트 상세 row 추적 정보 |

component row의 `type`은 `@cx/renderer` mapping 또는 fallback renderer로 해석 가능해야 한다.
AI import 단계에서 첨부 표의 "이벤트" / "액션" / "액션 파라미터" 셀은 문자열 `events`로 저장하지 않고 `raw.hooks: NodeHook[]`로 구조화한다. Compose 이후에는 `component.hooks`로 승격하고 `raw`는 산출물에서 제거한다.

## 6. 첨부 명세 변환 규칙

첨부 예시: `/Users/plusx/Desktop/SB-MBR-UC01_02-0513`

### screen markdown

screen markdown은 아래처럼 소비 데이터로 변환한다.

| 원천 | 소비 데이터 |
|---|---|
| frontmatter `화면 ID` | `screens[].id`, `screens[].sourceRef.screenId` |
| frontmatter `화면 명` | `screens[].metadata.title` |
| frontmatter `관련 정책 그룹` | `screens[].sourceRef.policyGroupRefs` |
| frontmatter `관련 기능` | `screens[].sourceRef.featureRefs` |
| `화면 구성` table | `screens[].screen.regions.*.children`, `areas` 참조 |
| `화면 전환` table | 후속 route/read model에서 사용. 현재 소비 렌더 계약에는 직접 넣지 않는다. |
| `케이스 분기` table | `screenVariants[]`의 `edge` row |

`화면 구성`의 `오가니즘 ID`는 `areas[].id`와 반드시 일치해야 한다. OGN 원천 markdown이 없는 경우에도 placeholder area을 만들고 warning으로 표시한다.

### area markdown

area markdown은 아래처럼 소비 데이터로 변환한다.

| 원천 | 소비 데이터 |
|---|---|
| frontmatter `오가니즘 ID` | `areas[].id` |
| frontmatter `오가니즘 명` | `areas[].metadata.title`, `areas[].props.name` |
| frontmatter `관련 정책서` | `areas[].policyRefs` |
| frontmatter `관련 정책 그룹` | `areas[].sourceRef.policyGroupRefs` |
| frontmatter `관련 기능` | `areas[].featureRefs` |
| `오가니즘 정보` table | OGN metadata, layout, visibility summary |
| `케이스 분기` table | `areas[].states`와 component `display` 후보 |
| `컴포넌트 상세` table | `components[]` concrete component row와 `areas[].children[]` usage |

`컴포넌트 상세`의 `컴포넌트 ID`는 공급 component package의 구현 타입 후보로 해석한다. row의 `컴포넌트 명`은 concrete component row `id` 후보로 사용한다.

## 7. 검증 규칙

소비 데이터는 아래 조건을 통과해야 한다.

- 모든 JSON 파일은 파싱 가능해야 한다.
- `screenVariants[].screenRouteId`는 존재하는 `screenRoutes[].id`를 참조한다.
- `screens[].screenVariantId`는 존재하는 `screenVariants[].id`를 참조한다.
- `screens[].screen.regions`는 `header`, `contents`, `bottom` 3개를 모두 가진다.
- region child의 `{ kind: "component", id }`는 존재하는 `components[].id`를 참조한다.
- region child의 `{ kind: "area", id }`는 존재하는 `areas[].id`를 참조한다.
- `areas[].children[].id`는 존재하는 `components[].id`를 참조한다.
- `screens[].pattern.id`는 공급 `@cx/layout/catalog`의 `patterns[].id`를 참조한다.
- 모든 node/table `id`는 같은 RenderTree 안에서 중복되지 않아야 한다.
- `@cx/renderer`의 `tablesToRenderTree` 결과는 `@cx/renderer` validation을 통과해야 한다.

## 8. 현재 강화 백로그

| 우선순위 | 작업 | 완료 기준 |
|---|---|---|
| P1 | sample 데이터를 소비 계약 기준으로 보강 | `sourceRef`, state, edge variant 후보가 표현됨 |
| P2 | 소비 데이터에서 DB/read model로 승격할 필드 선별 | 후속 DB 설계 문서와 충돌하지 않음 |
