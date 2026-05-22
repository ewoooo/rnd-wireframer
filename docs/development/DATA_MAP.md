# RND Screen Generator 데이터 맵

## 1. 문서 책임

이 문서는 RND Screen Generator의 데이터 종류와 소비 데이터 계약을 정의한다.

제품 범위는 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 기술 경계는 [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md)를 따른다.

현재 데이터는 두 타입으로 나눈다.

| 타입 | 역할 | 대표 위치 |
|---|---|---|
| 공급 데이터 | 화면 생성/렌더링에 필요한 원천, 어휘, 패턴, 구현 자산을 제공한다. | 첨부 명세, [docs/pattern-store](/Users/plusx/Documents/rnd-screen-generator/docs/pattern-store), [packages/component](/Users/plusx/Documents/rnd-screen-generator/packages/component), [packages/layout](/Users/plusx/Documents/rnd-screen-generator/packages/layout), [packages/token](/Users/plusx/Documents/rnd-screen-generator/packages/token) |
| AI import 데이터 | AI가 생성한 등록 후보 bundle이다. 검증 후 소비 데이터 테이블로 등록한다. | [database/ai-imports](/Users/plusx/Documents/rnd-screen-generator/database/ai-imports) |
| 소비 데이터 | workbench, resolver, renderer가 실제 화면 단위로 소비하는 정규화 입력이다. | [database/tables](/Users/plusx/Documents/rnd-screen-generator/database/tables) |

우선순위는 소비 데이터 강화다. 공급 데이터는 소비 데이터를 만들기 위한 근거와 어휘로 쓰되, workbench가 직접 공급 원본을 해석하도록 만들지 않는다.
`docs/data-mockups`는 원천 입력과 단계별 fixture를 보관한다. `apps/web` workbench는 `docs/data-mockups`를 직접 해석하지 않고, `database/tables` 계약 또는 동일 shape의 loader 결과를 소비한다.

데이터 흐름 관계를 시각 검토할 때는 [DATA_FLOW.dbml](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_FLOW.dbml)을 사용한다. 이 DBML은 migration 스키마가 아니라 공급 데이터가 소비 데이터로 정규화되는 흐름과 참조 관계를 표현한 산출물이다.

## 2. 데이터 흐름

```text
공급 데이터
  ├─ 첨부 screen/organism 명세
  ├─ pattern preset
  ├─ @cx/components
  ├─ @cx/layout
  └─ @cx/tokens
        |
        v
parser / normalizer / resolver
        |
        v
AI import 데이터
  ├─ agent-assets.generated.json
  └─ agent-assets.mock.generated.json
        |
        v
registerAssetsToTables
        |
        v
소비 데이터
  ├─ screen_routes.json
  ├─ screen_variants.json
  ├─ screens.json
  ├─ screen_mock_data.json
  ├─ organisms.json
  └─ components.json
        |
        v
@cx/renderer validation
        |
        v
@cx/renderer
        |
        v
apps/web
```

## 3. 공급 데이터

공급 데이터는 "무엇을 만들 수 있는가"와 "어떤 근거로 만들었는가"를 제공한다.

| 공급원 | 책임 | 소비 데이터 반영 방식 |
|---|---|---|
| 첨부 screen markdown | 화면 ID, 화면명, 화면 구성, 화면 전환, 케이스 분기, 정책/기능 참조 | `screenRoutes`, `screenVariants`, `screens.screen.regions`, `sourceRef` |
| 첨부 organism markdown | OGN ID, OGN명, 노출 조건, 상태 분기, 컴포넌트 상세, 정책/기능 참조 | `organisms`, `components`, organism/composite metadata |
| `docs/pattern-store/*.json` | screen/organism/composite preset, layout recipe, pageStack/divider 규칙 | `screens[].pattern`, `organisms[].patternId`, pattern-owned props |
| `packages/component` | 실제 leaf component 구현 어휘 | `components[].type`, renderer mapping |
| `packages/layout` | `Screen.*`, `Layout.*`, chrome/primitive 구현 | `screens[].screen.regions[*].type`, layout props |
| `packages/token` | Tailwind v4 `@theme` spacing token | layout spacing props, style token 값 |

공급 데이터 원칙:

- 첨부 원본은 파괴적으로 수정하지 않는다.
- 공급 데이터는 workbench 직접 입력이 아니라 소비 데이터 생성 근거다.
- `docs/pattern-store/*.json`은 공급 데이터다. 소비 데이터는 pattern 전체를 복사하지 않고 `pattern.id`, `pattern.variant`만 참조한다.
- pattern store의 layout recipe는 parser/resolver/generator 단계에서 `WireframeNode` 구조로 materialize한다. `@cx/renderer`는 pattern store를 직접 읽지 않고 materialize된 node만 렌더링한다.
- `packages/component`, `packages/layout`, `packages/token`은 런타임 구현 어휘다. 소비 데이터의 `type`, `pattern`, `props`는 이 어휘로 해석 가능해야 한다.

## 4. 소비 데이터

소비 데이터는 [database/tables](/Users/plusx/Documents/rnd-screen-generator/database/tables)의 테이블 JSON 구조를 기준으로 한다.

| 파일 | 최상위 키 | 책임 |
|---|---|---|
| [screen_routes.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screen_routes.json) | `screenRoutes` | 사용자가 탐색하는 화면 흐름 단위 |
| [screen_variants.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screen_variants.json) | `screenVariants` | route 아래 base/edge 생성 대상 |
| [screens.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screens.json) | `screens` | 실제 렌더 가능한 화면 인스턴스 |
| [screen_mock_data.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/screen_mock_data.json) | `screenMockData` | AI가 추론한 화면별 preview/mock data |
| [organisms.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/organisms.json) | `organisms` | 화면 region에 배치되는 OGN 섹션 |
| [components.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/components.json) | `components` | OGN 또는 screen region에서 참조하는 concrete render node |

용어 기준:

- `components`는 `database/tables/components.json`의 파일명과 최상위 키다.
- `composite`는 renderer가 소비하는 concrete render node 개념이다.
- 따라서 `components[]`의 각 row는 composite node를 저장하며, `compositeId`는 `components[].metadata.id`를 참조한다.

소비 데이터 관계는 아래 방향만 허용한다.

```text
screenRoute
└─ screenVariant.screenRouteCode
      └─ screen.screenVariantCode
         └─ screen.regions.{header,contents,bottom}.children[]
         ├─ compositeId -> components[].metadata.id
         └─ organismId -> organisms[].id
            └─ organism.composites[].compositeId -> components[].metadata.id
```

역방향 배열 FK는 기본으로 두지 않는다. 예를 들어 route가 screen 목록을 직접 들고 있지 않고, `screen.screenVariantCode`가 variant를 바라본다.

## 5. 소비 데이터 계약

### screenRoutes

`screenRoutes`는 사용자가 workbench에서 고르는 흐름 단위다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `code` | route 고유 코드. 예: `mbr-join` |
| `module` | 업무 모듈. 예: `mbr` |
| `name` | 탐색 UI에 표시할 이름 |
| `order` | route 정렬 순서 |

선택 필드:

| 필드 | 설명 |
|---|---|
| `processCode` | 정책/업무 프로세스와 연결할 때 사용하는 코드 |
| `sourceRef` | 첨부 원본 묶음, 파일명, 문서 버전 등 추적 정보 |

### screenVariants

`screenVariants`는 route 아래 생성 대상 화면 묶음이다. base와 edge를 같은 레벨에서 다룬다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `code` | variant 고유 코드 |
| `screenRouteCode` | 상위 route 코드 |
| `name` | variant 이름 |
| `order` | route 안의 variant 정렬 순서 |
| `variantType` | `base` 또는 `edge` |

선택 필드:

| 필드 | 설명 |
|---|---|
| `baseVariantCode` | edge variant가 기준으로 삼는 base variant |
| `trigger` | edge 발생 조건 |
| `differenceFromBase` | base 대비 차이 |
| `followUp` | 후속 처리 |
| `sourceRef` | 첨부 screen markdown의 케이스 분기 row 추적 정보 |

### screens

`screens`는 workbench와 `tablesToRenderTree`가 직접 소비하는 화면 인스턴스다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | 화면 고유 ID. `metadata.id`와 같아야 한다. |
| `screenVariantCode` | 소속 variant 코드 |
| `version` | wireframe schema version |
| `minRendererVersion` | 최소 renderer version |
| `metadata` | `@cx/renderer` schema metadata |
| `pattern.id` | 공급 pattern 참조 |
| `screen.type` | 항상 `Screen` |
| `screen.componentVersion` | screen node component version |
| `screen.metadata` | screen node metadata |
| `screen.regions.header` | `Screen.Header` region |
| `screen.regions.contents` | `Screen.Contents` region |
| `screen.regions.bottom` | `Screen.Bottom` region |

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
{ "kind": "composite", "compositeId": "top-navigation" }
{ "kind": "organism", "organismId": "ogn-mbr-term-list" }
```

### organisms

`organisms`는 화면 region에 배치되는 섹션 단위다.

소비 데이터의 canonical OGN 코드는 `organisms[].id`다.
`props.organismCode`는 source JSON에서 직접 관리하지 않고, render tree 생성 단계에서 `id`로부터 파생해 넣는다.
생성된 `Organism` node는 원천 OGN 추적을 위해 `props.organismCode`를 유지한다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `id` | OGN 고유 ID. 첨부 명세의 `오가니즘 ID`와 맞춘다. |
| `type` | `Organism` |
| `componentVersion` | OGN node version |
| `metadata` | `@cx/renderer` node metadata |
| `composites` | 이 OGN이 참조하는 concrete render node 목록 |

권장 필드:

| 필드 | 설명 |
|---|---|
| `props.name` | source OGN 명. `metadata.title`과 별도로 원천 명칭을 보존해야 할 때 사용 |
| `patternId` | 공급 pattern 참조 |
| `patternVariant` | pattern variant |
| `states` | default/loading/error 등 상태별 visible composite id |
| `sourceRef` | 원천 organism markdown 추적 정보 |
| `policyRefs` | 관련 정책 코드 |
| `featureRefs` | 관련 기능 코드 |

`organisms[].composites[].compositeId`는 [components.json](/Users/plusx/Documents/rnd-screen-generator/database/tables/components.json)의 `components[].metadata.id`를 바라본다.

### components

`components`는 renderer가 실제 leaf node 또는 작은 render subtree로 렌더링할 concrete composite node다.

필수 필드:

| 필드 | 설명 |
|---|---|
| `type` | renderer mapping 대상 node type. 예: `HeaderBase`, `ListCell`, `TextField`, `SectionMessage` |
| `componentVersion` | composite node version |
| `metadata` | `@cx/renderer` node metadata. `metadata.id`가 참조 키다. |

권장 필드:

| 필드 | 설명 |
|---|---|
| `props` | component props 또는 binding 값 |
| `events` | `@cx/renderer` action contract |
| `display` | 상태별 노출 조건 |
| `sourceRef` | 첨부 organism markdown의 컴포넌트 상세 row 추적 정보 |

component row의 `type`은 `@cx/renderer` mapping 또는 fallback renderer로 해석 가능해야 한다.

## 6. 첨부 명세 변환 규칙

첨부 예시: `/Users/plusx/Desktop/SB-MBR-UC01_02-0513`

### screen markdown

screen markdown은 아래처럼 소비 데이터로 변환한다.

| 원천 | 소비 데이터 |
|---|---|
| frontmatter `화면 ID` | `screens[].metadata.id`, `screens[].sourceRef.screenId` |
| frontmatter `화면 명` | `screens[].metadata.title` |
| frontmatter `관련 정책 그룹` | `screens[].sourceRef.policyGroupRefs` |
| frontmatter `관련 기능` | `screens[].sourceRef.featureRefs` |
| `화면 구성` table | `screens[].screen.regions.*.children`, `organisms` 참조 |
| `화면 전환` table | 후속 route/read model에서 사용. 현재 소비 렌더 계약에는 직접 넣지 않는다. |
| `케이스 분기` table | `screenVariants[]`의 `edge` row |

`화면 구성`의 `오가니즘 ID`는 `organisms[].id`와 반드시 일치해야 한다. OGN 원천 markdown이 없는 경우에도 placeholder organism을 만들고 warning으로 표시한다.

### organism markdown

organism markdown은 아래처럼 소비 데이터로 변환한다.

| 원천 | 소비 데이터 |
|---|---|
| frontmatter `오가니즘 ID` | `organisms[].id` |
| frontmatter `오가니즘 명` | `organisms[].metadata.title`, `organisms[].props.name` |
| frontmatter `관련 정책서` | `organisms[].policyRefs` |
| frontmatter `관련 정책 그룹` | `organisms[].sourceRef.policyGroupRefs` |
| frontmatter `관련 기능` | `organisms[].featureRefs` |
| `오가니즘 정보` table | OGN metadata, layout, visibility summary |
| `케이스 분기` table | `organisms[].states`와 composite `display` 후보 |
| `컴포넌트 상세` table | `components[]` concrete composite node와 `organisms[].composites[]` usage |

`컴포넌트 상세`의 `컴포넌트 ID`는 공급 component package의 구현 타입 후보로 해석한다. row의 `컴포넌트 명`은 concrete composite `metadata.id` 후보로 사용한다.

## 7. 검증 규칙

소비 데이터는 아래 조건을 통과해야 한다.

- 모든 JSON 파일은 파싱 가능해야 한다.
- `screenVariants[].screenRouteCode`는 존재하는 `screenRoutes[].code`를 참조한다.
- `screens[].id`는 `screens[].metadata.id`와 일치해야 한다.
- `screens[].screenVariantCode`는 존재하는 `screenVariants[].code`를 참조한다.
- `screens[].screen.regions`는 `header`, `contents`, `bottom` 3개를 모두 가진다.
- region child의 `compositeId`는 존재하는 `components[].metadata.id`를 참조한다.
- region child의 `organismId`는 존재하는 `organisms[].id`를 참조한다.
- `organisms[].composites[].compositeId`는 존재하는 `components[].metadata.id`를 참조한다.
- `screens[].pattern.id`는 공급 `docs/pattern-store/*.json`의 `patterns[].id`를 참조한다.
- 모든 `metadata.id`는 같은 렌더 트리 안에서 중복되지 않아야 한다.
- `tablesToRenderTree` 결과는 `@cx/renderer` validation을 통과해야 한다.

## 8. 현재 강화 백로그

| 우선순위 | 작업 | 완료 기준 |
|---|---|---|
| P0 | 첨부 screen/organism markdown을 소비 데이터 초안으로 변환하는 parser 추가 | `screen_routes`, `screen_variants`, `screens`, `organisms`, `components` 초안 생성 |
| P0 | 소비 데이터 참조 무결성 validator 추가 | 누락 route/variant/screen/organism/composite/pattern을 리포트 |
| P0 | sample 데이터를 소비 계약 기준으로 정리 | `sourceRef`, state, edge variant 후보가 표현됨 |
| P1 | 공급 `docs/pattern-store/*.json`과 소비 `pattern.id` 관계 검사 | 누락 pattern warning 표시 |
| P1 | composite type과 `@cx/renderer` mapping 관계 검사 | fallback renderer 사용 항목 리포트 |
| P2 | 소비 데이터에서 DB/read model로 승격할 필드 선별 | 후속 DB 설계 문서와 충돌하지 않음 |
