# RND Screen Generator 개발 아키텍처

## 1. 문서 책임

이 문서는 기술 스택, 서비스 경계, 모듈 구조, API 표면만 정의한다.

중복을 피하기 위해 공급 데이터와 소비 데이터 계약은 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 기준으로 한다. 이 문서는 현재 구현된 로컬 렌더러 수직 슬라이스와 후속 API/Agent/Puck 경계를 정의한다.

## 2. 시스템 개요

```text
User
  |
  v
Next.js
  |
  v
@cx/workflow / @cx/engine / @cx/agent
  |
  v
@cx/layout / @cx/components / @cx/tokens

후속 연결:
Next.js
  |
  v
FastAPI
  |
  +--> Agent SDK
  |     +--> Local AI Session
  |     +--> Remote AI API
  +--> 운영 DB/Storage
  +--> Claude API
  +--> Codex Review
```

## 3. 레이어 책임

| 레이어 | 책임 |
|---|---|
| Next.js | 사용자 흐름, 화면 조회, 생성 요청, `@cx/engine` 기반 모바일 미리보기, Puck 기반 Screen/OGN 편집 |
| `@cx/types` | `database/tables` row shape, pattern-store 계약처럼 여러 패키지가 공유하는 타입 전용 패키지 |
| `@cx/tokens` | 색상, 타이포그래피, radius, spacing token SSOT와 Tailwind v4 `@theme` generated CSS |
| `@cx/components` | GitHub `ewoooo/cx-components` 기반의 모바일 미리보기와 Puck preview 기초 UI 컴포넌트 어휘 |
| `@cx/layout` | 기존 `cx-layout`을 흡수한 화면 chrome, rail, section, overlay layout primitive |
| `@cx/importer` | PRDD markdown parser, register, compose/decorate, table 후보 materializer |
| `@cx/workflow` | 명세, 품질 검수, 미리보기, 반영의 deterministic orchestration |
| `@cx/engine` | RenderTree schema, binding, registry, validation, `tablesToRenderTree` projection, React 렌더링 패키지 |
| `@cx/agent` | Claude/Codex/Agent SDK 기반 AI 실행, local-first runner, 원격 fallback |
| Puck | 생성된 Screen composition과 OGN 내부 컴포넌트를 제한된 구조/prop 단위로 후편집 |
| FastAPI | 후속 JSON 검증, 정규화, OGN 조합, AI 호출, 결과 검증 |
| Agent SDK | 후속 Claude 생성과 Codex 검수를 실행하는 공통 런타임 계층 |
| Local AI Session | 후속 로컬 AI 실행과 선택적 세션 재개 |
| Remote AI API | 후속 로컬 세션 실패 시 fallback |
| 운영 DB/Storage | 후속 관계형 데이터, 생성 이력, 원본 파일과 선택적 산출물 저장 |
| ERD 도구 | 후속 운영 DB 스키마의 관계 검토 |
| Claude API | 후속 `database/tables` shape table 후보 생성과 재생성 |
| Codex Review | 후속 Claude 생성 결과 검수 |

공급 데이터/소비 데이터의 현재 계약은 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다. DB 테이블, 컬럼, migration, ERD 산출물의 세부 책임은 소비 데이터 계약이 안정화된 뒤 확정한다.

## 4. 권장 저장소 구조

저장소 구조의 상세 운영 규칙은 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 기준으로 한다. 이 문서는 기술 경계와 주요 모듈만 요약한다.

```text
AGENTS.md
AGENTS_HISTORY.md
MASTER_PLAN.md
apps/
  web/
    src/
      app/
        api/
      components/
        ui/
        agent/
        layout/
        screen/
      model/
      data/
      adapters/
      agent/
packages/
  token/
  component/
  layout/
  engine/
    render/
  types/
  importer/
  workflow/
  agent/
services/
  api/
    app/
      api/
      services/
      schemas/
docs/
  development/
    DEVELOPMENT_ARCHITECTURE.md
    DATA_MAP.md
  design/
```

`packages/component`는 GitHub [`ewoooo/cx-components`](https://github.com/ewoooo/cx-components.git)를 기준 컴포넌트 라이브러리로 흡수한 `@cx/components` 패키지다. Tailwind v4 `@theme`로 `--skt-spacing-*` 토큰을 spacing utility에 매핑하는 generated CSS는 `packages/token/src/generated/tailwind-theme.css`에 둔다. `@cx/components/tailwind.css`는 호환용으로 `@cx/tokens/tailwind.css`를 import한다. 현재 앱은 component token variables를 위해 `@cx/components/styles.css`를 import하고, `@cx/layout`은 별도 `styles.css` export 없이 Tailwind class와 runtime fallback만 공개한다. JavaScript config export는 운영하지 않는다. `packages/layout`은 기존 `cx-layout`의 화면 chrome과 primitive를 흡수한 `@cx/layout` 패키지로 둔다. `@cx/layout` 컴포넌트의 spacing prop은 Tailwind v4 `@theme` spacing key인 `cx-*` utility class로 우선 매핑하고, 런타임 값이 필요한 높이, z-index, grid template, 미등록 spacing만 inline fallback으로 둔다. `packages/pattern-store`는 screen/region/area/composite layout pattern JSON과 조회 helper를 소유한 `@cx/pattern-store` 패키지다. Pattern store 타입과 runtime schema는 `packages/types`의 `@cx/types`가 SSOT로 관리한다. `packages/types`는 client import parse result, PRDD runtime tree, database table row, RenderTree, pattern-store, validation 타입의 단일 소유자다. `packages/importer`는 `@cx/importer` 패키지로 운영하며 PRDD parser/register/compose/decorate/materializer를 소유한다. `packages/workflow`는 importer, engine validation, quality report, apply 경계를 조합해 `명세 -> 품질 검수 -> 미리보기 -> 반영`을 오케스트레이션한다. `packages/engine`는 `@cx/engine` 패키지로 운영하며 RenderTree projection, validation, React render만 소유한다. Engine renderer는 `@cx/pattern-store`를 직접 import하지 않고 호출자가 주입한 `PatternStore` input만 해석한다. Component catalog 값은 `@cx/components/catalog`, catalog 계약 타입은 `@cx/types`가 소유한다. `packages/agent`는 AI 실행 adapter만 담당한다.

제품 비즈니스 흐름은 `명세 -> 품질 검수 -> 미리보기 -> 반영`이다. `packages/importer` 외부 subpath는 `@cx/importer/prdd`, `@cx/importer/materializer`, `@cx/importer/types`만 공개한다. `packages/workflow` 외부 subpath는 `@cx/workflow/spec`, `@cx/workflow/inspection`, `@cx/workflow/apply`를 우선 사용한다. `DraftTablesBundle`, `QualityReport`, `QualityBacklog`, `Promote`는 공개 설명용 단계가 아니라 내부 산출물/함수 이름이다. 기존 asset tree pipeline, design-review, deck builder는 제거했다. `packages/agent`에는 Agent SDK runtime, Claude/Codex runner, local-first/API fallback만 둔다.

`AGENTS.md`, `MASTER_PLAN.md`, `AGENTS_HISTORY.md`는 프로젝트 전역 문서이므로 루트에 둔다. 상세 개발/데이터/디자인 문서는 `docs/` 아래에 둔다. ERD 산출물 위치는 후속 DB 설계 시점에 다시 확정한다.

화면 생성 데이터는 생명 주기에 따라 `database/client-imports/`, `database/ai-imports/`, `database/tables/` 아래에 둔다. `database/client-imports`는 업로드 원본, `database/ai-imports`는 AI 생성 후보 bundle/table 후보, `database/tables`는 workbench가 소비하는 승인된 table dump다. Layout preset reference catalog는 `packages/pattern-store`의 `@cx/pattern-store`가 소유한다. `apps/web` workbench는 `database/tables` 계약 또는 동일 shape의 loader 결과만 소비한다. 공급 데이터와 소비 데이터의 구분은 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다.

## 5. FastAPI 모듈

Phase 5 보류 항목. `services/api/` 골격은 active MVP path가 안정화된 뒤 read model 도입 시점에 다시 생성한다. 현재는 저장소에 두지 않는다.

## 6. Next.js 모듈

```text
apps/web/
  src/
    app/
      page.tsx
      layout.tsx
      api/
    components/
      ui/
      agent/
      layout/
      screen/
      App.tsx
    model/
      store.ts
    data/
    adapters/
    agent/
    server/
```

`apps/web`은 단일 제품 앱이므로 `features/`, `widgets/`, 제품명 하위 namespace를 두지 않는다. `app/`은 Next.js route와 API route만 소유하고, 제품 코드는 `components/`, `model/`, `data/`, `adapters/`, `agent/`, `server/` 책임 디렉토리로 나눈다. `src/app/api/**/route.ts`는 HTTP request/response glue만 담당하고, 파일 시스템 접근과 Agent SDK/Claude orchestration은 `src/server/**`에 둔다. 화면 chrome과 section rail은 `@cx/layout`, leaf component는 `@cx/components`, 스타일 값은 `@cx/tokens`와 `@cx/tokens/tailwind.css` spacing mapping을 우선 사용한다. 앱 작업면은 렌더링 구현을 소유하지 않고, 화면 조회/탐색/검증 정보 표시를 담당한다.

Pattern은 앱 소비 데이터가 아니라 `@cx/pattern-store`의 reference store로 운영한다. Pattern store는 screen/region/area/composite의 flow, spacing, child ordering 같은 레이아웃 레시피를 소유한다. `Screen` 아래 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 3영역 생성은 deterministic code와 `database/tables` 계약이 담당한다. resolver/generator는 선택된 layout recipe를 `pattern.id`, `pattern.variant` 참조로 소비 데이터에 남기고, `@cx/engine`의 `tablesToRenderTree`가 RenderTree DTO로 projection할 때 주입받은 `PatternStore`를 materialize한다. React render 단계는 pattern store를 직접 읽지 않는다. `RenderTreeNode`는 저장/편집용 관리 모델이 아니라 `@cx/engine` 입력 DTO로만 취급한다.

ComponentPattern과 layout pattern은 서로 다른 층이다. ComponentPattern은 의미 block을 재사용 UI 조합으로 표현하는 계약이며, layout pattern은 screen/region/area/composite children을 배치하는 레시피다. 새 화면 품질을 높일 때 이 둘을 같은 JSON이나 같은 `type` 문자열로 합치지 않는다.

디자인 품질 보강은 품질 검수 단계의 `QualityReport`/`QualityBacklog` 결과를 근거로 수행한다. AI 보강이 필요한 경우에도 자유로운 RenderTree 생성은 금지하고, `database/tables` shape와 renderer projection/validation을 통과하는 후보만 반영한다.

앱 작업면은 반드시 아래 3가지 기능을 같은 작업 맥락에서 제공한다.

1. 렌더된 스크린 화면: `@cx/engine`가 `database/tables` shape를 RenderTree로 projection하고 검증한 뒤 `Screen`, `Screen.Header`, `Screen.Contents`, `Screen.Bottom`, `Area`, component node를 실제 모바일 프리뷰로 렌더링한다. StatusBar/SystemHeader는 생성 데이터가 아니라 `@cx/layout`의 `AppScreen` chrome에서 항상 제공한다.
2. 다른 screen 및 OGN 조회: 현재 화면을 유지한 채 다른 generated screen, screen source, area source, generated area을 탐색하거나 선택할 수 있는 목록/검색/탭 영역을 제공한다.
3. 렌더된 스크린 화면과 관련된 screen/OGN 정보: 현재 렌더 화면의 source screen, generated screen, 연결 OGN, OGN 상태, component 구성, 정책/기능 참조, 검증 경고를 함께 보여준다.

이 3가지 기능은 별도 제품으로 분리하지 않고, 미리보기/검수/편집 진입 전 단계의 기본 작업면으로 본다. Puck 편집기는 이 작업면에서 선택한 screen 또는 OGN을 편집 모드로 여는 후속 레이어다.

## 7. API 표면

아래 API 표면은 후속 백엔드 구현 후보이며, 요청/응답의 상세 JSON 필드는 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)의 소비 데이터 계약을 우선 따른다. 디스플레이 프리뷰의 조회용 read model은 [DISPLAY_PREVIEW_SCHEMA.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DISPLAY_PREVIEW_SCHEMA.md)를 따른다.

| Method | Path | 책임 |
|---|---|---|
| `POST` | `/source-imports` | 정책/화면/디자인 입력 JSON 검증 및 적재 |
| `GET` | `/screen-sources` | 화면 소스 목록 조회 |
| `GET` | `/screen-sources/{screen_code}` | 화면 상세와 연결 OGN 조회 |
| `GET` | `/screen-sources/{screen_code}/area-sources` | 생성 컨텍스트용 OGN 목록 조회 |
| `GET` | `/display-preview/screens/{screen_code}` | 디스플레이 프리뷰용 화면 상세 read model 조회 |
| `POST` | `/screen-sources/{screen_code}/generate` | 초기 table 후보 생성 |
| `GET` | `/generation-jobs/{job_id}` | 생성 작업과 최신 생성 묶음 조회 |
| `POST` | `/generation-jobs/{job_id}/regenerate` | 피드백 기반 생성 묶음 재생성 |
| `GET` | `/generated-screen-sets/{set_id}` | 생성 묶음과 하위 화면/OGN 섹션 조회 |
| `POST` | `/generated-screens/{generated_screen_id}/regenerate` | 특정 생성 화면 재생성 |
| `GET` | `/generated-screens/{generated_screen_id}` | 생성 화면과 하위 OGN 섹션 조회 |
| `PATCH` | `/generated-screens/{generated_screen_id}/composition` | Puck Screen 편집 결과를 screen composition draft로 저장 |
| `POST` | `/generated-screens/{generated_screen_id}/composition/publish` | screen composition draft를 새 편집 버전으로 발행 |
| `POST` | `/generated-areas/{generated_area_id}/regenerate` | 특정 OGN 섹션 재생성 |
| `PATCH` | `/generated-areas/{generated_area_id}/edit` | Puck 편집 결과를 `database/tables` shape의 area/component draft로 임시 저장 |
| `POST` | `/generated-areas/{generated_area_id}/publish` | 저장된 area/component draft를 새 편집 버전으로 발행 |
| `GET` | `/area-sources/{area_source_code}/versions` | 공유 OGN 편집 버전 이력 조회 |
| `POST` | `/generated-screen-sets/{set_id}/review` | Codex 기반 생성 묶음 검수 |
| `POST` | `/generated-screens/{generated_screen_id}/review` | Codex 기반 개별 화면 검수 |
| `POST` | `/generated-areas/{generated_area_id}/review` | Codex 기반 개별 OGN 섹션 검수 |

## 8. 생성 계약

Claude는 HTML이 아니라 `database/tables` shape의 table 후보 JSON을 반환해야 한다. RenderTree는 저장하지 않고 `@cx/engine`의 `tablesToRenderTree`가 프리뷰 직전에 생성한다.

생성 결과는 `generated_screen_sets`를 묶음 단위로 하고, 실제 화면은 `generated_screens`의 개별 row로 저장한다. 화면 안의 OGN 섹션과 하위 component JSON은 `generated_areas`에 저장한다.

`screen_variants`의 `variant_type = 'base'`는 기본 화면, `variant_type = 'edge'`는 케이스별 Screen Variant로 생성한다.

Codex는 Claude의 생성 결과를 검수한다. 검수 기준은 JSON 스키마 통과 여부, 정책/화면/디자인 입력 근거 반영 여부, 디자인 패턴 문서 준수 여부, 재생성 필요 여부다.

Claude 생성과 Codex 검수는 Agent SDK를 통해 실행한다. Claude는 로컬 실행을 우선 사용하되, 기본 생성 요청은 새 세션으로 실행한다. 기존 세션 재개는 명시적 재시도, 검수 반영, 이어쓰기 흐름에서만 옵션으로 사용한다. Codex 검수는 로컬 CLI 또는 로컬 런타임 실행기를 우선 사용한다. 로컬 실행이 없거나 실패하면 원격 API로 fallback한다.

현재 render tree 입력 스키마의 구현 기준은 `packages/engine`의 TypeScript 타입과 Zod validation이다. 이 스키마는 저장 포맷이 아니라 `database/tables`를 렌더러에 넘기기 위해 펼친 입력 DTO다. FastAPI 구현이 붙으면 공식 저장 계약은 `database/tables` shape로 유지하고, render tree validation은 preview/read model 검증 단계에 둔다.

생성 JSON의 `component.type`, `pattern.id`, `spacing`, `color`, `typography` 값은 가능한 한 `@cx/components`, `@cx/layout`, `@cx/tokens`, `@cx/pattern-store`의 공개 어휘에 매핑한다. spacing 값은 `@cx/tokens/tailwind.css`의 Tailwind v4 `@theme` spacing key로도 해석 가능해야 한다. Claude가 새 컴포넌트명을 임의로 만들기보다, 기존 패키지 어휘에 맞는 후보를 선택하도록 prompt contract를 구성한다.

## 9. Puck Screen/OGN 편집 정책

Puck은 생성 결과를 자유 배치형 디자인 툴로 바꾸기 위한 레이어가 아니다. Claude가 만든 화면을 사람이 검토하면서 Screen composition과 OGN 내부 컴포넌트를 제한된 구조로 조정하기 위한 후편집 레이어다.

공식 저장 포맷은 Puck 데이터나 render tree가 아니라 `database/tables` shape의 draft/edit version이다. Puck 데이터는 에디터 화면 안에서만 사용하는 임시 표현이고, render tree는 preview 렌더 직전에만 생성한다.

편집 범위는 두 단계로 나눈다.

| 편집 범위 | 대상 | 가능한 작업 | 저장 단위 |
|---|---|---|---|
| Screen editor | `generated_screens`의 composition | OGN 불러오기, 제거, 순서 변경 | `screen_edit_versions` |
| OGN editor | 공유 `area_sources` 기반 OGN | 내부 component 위치, 순서, Variant, Props 변경 | `area_edit_versions` |

```text
generated_screens + generated_areas
-> database/tables shape의 draft를 Puck data로 변환
-> Puck에서 사용자 편집
-> Puck data를 database/tables shape의 draft로 반영
-> screen_edit_versions 또는 area_edit_versions에 저장
```

Puck 편집 원칙:

- AI 생성 원본은 `generated_screens`, `generated_areas`에 보존하고, 사용자 편집본은 별도 edit version으로 저장한다.
- Screen editor는 OGN section의 추가, 제거, 순서 변경만 담당한다. OGN 내부 component prop은 수정하지 않는다.
- OGN editor는 component의 위치, 순서, Variant, Props만 수정한다. 해당 OGN을 어느 화면에 배치할지는 수정하지 않는다.
- OGN 편집본을 발행하면 같은 `area_source_id` 또는 `area_source_code`를 공유하는 다른 화면에도 최신 발행본이 반영된다.
- 특정 화면에서 공유 OGN 반영을 막아야 하는 경우에는 후속 기능으로 version pinning을 검토한다. MVP 기본값은 최신 발행본 반영이다.
- 간격, 정렬, 노출 여부, 문구, component Variant, Props처럼 안전한 prop만 편집 가능하게 연다.
- 간격 값은 자유 숫자가 아니라 `none`, `xs`, `sm`, `md`, `lg`, `xl` 같은 디자인 토큰으로 제한한다.
- Puck Screen block은 `generated_areas` 또는 공유 OGN edit version을 참조한다.
- Puck OGN block 내부 props/children은 `database/tables` shape의 area/component draft와 매핑한다.
- Puck preview는 `@cx/components`, `@cx/layout`, `@cx/tokens`를 사용하는 실제 모바일 미리보기 렌더러와 같은 component mapping을 사용한다.

렌더링 우선순위:

```text
screen_edit_versions latest published composition
-> generated_screens + generated_areas composition

area_edit_versions latest published tables draft
-> generated_areas tables draft
-> generated_areas layout + children tables
```

재생성 원칙:

- 화면 완성 후 사용자는 전체 화면, 특정 Screen Variant, 특정 OGN 단위로 재생성을 요청할 수 있다.
- 재생성은 기존 생성/편집 버전을 덮어쓰지 않고 새 `generated_screen_sets` 또는 새 edit version을 만든다.
- 재생성 prompt에는 현재 발행된 Screen composition과 공유 OGN edit version을 함께 넣는다.

초기 Puck 컴포넌트 후보:

| Puck 컴포넌트 | 역할 |
|---|---|
| `MobileScreen` | 모바일 화면 루트 |
| `Area` | OGN 섹션 블록 |
| `HeaderBar` | 상단 앱바/타이틀 영역 |
| `FormSection` | 입력 폼 OGN 섹션 |
| `TermList` | 약관/동의 OGN 섹션 |
| `CTAButton` | 주요 액션 컴포넌트 |
| `BottomSheet` | 바텀시트 OGN 섹션 |
| `AlertDialog` | 팝업/알럿 OGN 섹션 |
| `EmptyState` | 빈 상태/안내 OGN 섹션 |

## 10. Screen Variant 생성 정책

source screen은 `screen_routes -> screen_variants -> screen_sources` 관계로 관리하고, 각 `screen_variants` row는 별도 화면으로 누락하지 않고 생성한다.

| 구분 | 생성 대상 | 저장 위치 |
|---|---|---|
| Base Screen | `screen_variants.variant_type = 'base'` | `generated_screens.screen_type = 'base'` |
| Screen Variant | `screen_variants.variant_type = 'edge'` | `generated_screens.screen_type = 'variant'` |

Variant 생성 원칙:

- Variant의 `screen_code`는 source `screen_variants.code`와 추적 가능해야 한다.
- Variant는 Base 전체를 새로 만드는 것이 아니라 케이스 조건에 필요한 차이만 반영한다.
- Variant에는 `trigger`, `difference_from_base`, `follow_up`을 포함한다.
- 특정 Variant만 재생성할 수 있어야 한다.

Codex 검수 기준:

- source screen 케이스 분기 수와 생성된 Variant 수가 일치한다.
- 각 Variant의 `screen_code`가 원천 `case_screen_code`와 일치한다.
- Variant의 차이가 케이스 설명과 후속 처리에 부합한다.
- Variant가 Base 구조를 불필요하게 변경하지 않는다.

## 11. Agent SDK 실행 정책

| 상황 | 실행 방식 |
|---|---|
| 로컬 Claude 실행 가능 | 기본 생성 요청은 새 세션으로 실행 |
| 명시적 재시도/검수 반영/이어쓰기 | Claude Agent SDK의 `resume` 또는 `continue`로 기존 세션 재사용 |
| 로컬 Claude 실행 불가 | Claude API 사용 |
| 로컬 Codex CLI 사용 가능 | Codex CLI 또는 OpenAI 로컬 런타임을 검수 실행기로 사용 |
| 로컬 Codex CLI 사용 불가 | 설정된 Codex Review API 사용 |
| 로컬 실행 실패 | 실패 사유 기록 후 원격 API fallback |

로컬 실행 여부와 세션 재개 여부는 생성 이력에 기록한다. 세부 저장 필드는 소비 데이터 계약이 안정화된 뒤 DB 설계에서 확정한다.

주의할 점:

- Claude는 Claude Agent SDK에서 세션 파일을 로컬에 저장하고 `resume`, `continue`, `fork`를 지원하므로, 필요한 재시도나 이어쓰기 흐름에서 이전 세션을 재사용할 수 있다.
- Codex는 OpenAI Agents SDK가 Codex 앱의 기존 대화 세션에 직접 attach하는 방식으로 보지 않는다.
- Codex 검수의 로컬 우선 실행은 `codex` CLI 실행 또는 OpenAI Agents SDK의 로컬 런타임/쉘 실행 루프를 감싼 adapter로 구현한다.
- 따라서 구현체는 `local_session_resolver.py`에서 `claude` 세션과 `codex` 실행 가능 여부를 서로 다른 방식으로 감지해야 한다.

## 12. 로컬 환경 변수

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CODEX_REVIEW_MODEL=
AGENT_SDK_LOCAL_SESSION_ENABLED=true
AGENT_SDK_REMOTE_FALLBACK_ENABLED=true
```
