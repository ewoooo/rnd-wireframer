# Project Structure

## 1. 문서 책임

이 문서는 저장소 디렉토리와 현재 패키지 책임 경계를 정의한다.

패키지 간 관계망과 public surface 요약은 루트 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md)를 따른다.
Screen inference 실행 구조는 [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md)를 따른다.

현재 생성 과정은 재설계된 패키지 경계 기준으로 운영한다. old `importer/types/workflow` 패키지 경계는 제거했고, `agent`는 Claude Agent SDK 실행 adapter로만 둔다. `layout-pattern-store`는 내부 타입과 schema를 소유한 reference catalog와 layout component registry 패키지로 운영한다. pipeline 전반 DTO/schema 계약과 예시 계약은 `@cx/schema`와 관련 테스트/문서가 소유한다.

## 2. 패키지 기준

| 패키지 | 책임 |
|---|---|
| `@cx/schema` | generation pipeline 전반 DTO/schema 계약 SSOT |
| `@cx/adapters` | 외부 표현과 내부 계약 사이의 순수 변환 |
| `@cx/renderer` | RenderTree JSON -> React render |
| `@cx/agent` | Claude Agent SDK local-first 실행 adapter |
| `@cx/components` | leaf component 구현과 catalog 값/계약 |
| `@cx/layout` | 화면 chrome과 layout primitive |
| `@cx/tokens` | foundation/semantic token SSOT, CSS variables, Tailwind v4 `@theme` 산출물 |
| `@cx/layout-pattern-store` | screen/region/area/composite layout pattern reference catalog, local schema/type |
| `@cx/inference` | target MVP: inference stores, context, engine, pipeline, worker, in-memory test fakes |
| `@cx/inference-nodes` | deprecated compatibility: 기존 screen-generation node/planning helper |
| `@cx/validation` | DTO/reference/rule 검증과 validation report 생성 |
| `@cx/pipeline` | compatibility: 기존 screen-generation runtime과 side effect/IO 유틸리티 |

개발자용 스크립트:

| 위치 | 책임 |
|---|---|
| `scripts/smoke-pipeline.ts`, `scripts/generation/*` | generation smoke flow를 반복 실행하는 CLI와 helper |
| `scripts/push-render-db.ts`, `scripts/canonicalize-render-db.ts` | render DB migration/audit helper |

제거된 패키지:

- `@cx/importer`
- `@cx/parser`
- `@cx/types`
- `@cx/workflow`

## 3. `packages/renderer`

`@cx/renderer`은 json-to-render만 담당한다.

```text
packages/renderer/src/
  index.ts       public renderer API
  render/        public renderer compatibility entrypoint
  interpreter/   RenderTree 순회, screen slot, layout wrapping, component render 실행
  adapters/      layout/component resolve, prop coercion, primitive render, area policy, missing policy
  runtime/       interpreter value helper
  tree/          RenderTree JSON 타입, path, binding helper
  nodes/area/    area.static / area.dynamic 내부 표시 정책
```

두지 않는 책임:

- table 후보 생성
- `database/tables` -> RenderTree projection
- schema/runtime validation
- PRDD parser/register/materializer
- AI runner/session adapter
- component catalog CRUD
- layout pattern CRUD/selection
- fallback UI로 unknown node/component/layout을 성공 렌더처럼 숨기는 책임

## 3-1. `packages/adapters`

`@cx/adapters`는 외부 표현과 내부 계약 사이의 순수 변환 패키지다.

```text
packages/adapters/src/
  index.ts       public adapter package metadata
  markdown/      Markdown/client input -> SourceSpec
  table/         DB/read-model row bundle -> RenderTree, RenderTree -> table projection
  puck/          RenderTree <-> Puck editable data
```

공개 API는 subpath를 기준으로 사용한다.

```ts
import { materializeRenderScreenFromRows } from "@cx/adapters/table";
import { parseMarkdownSourceBundle } from "@cx/adapters/markdown";
import { renderTreeToTableGenerationResult } from "@cx/adapters/table";
import { renderTreeToPuckScreenData } from "@cx/adapters/puck";
```

책임:

- 이미 로드된 plain object 입력을 받는다.
- Markdown/source bundle을 SourceSpec으로 정규화한다.
- table/read-model row 관계를 따라 `RenderTreeScreenNode`를 만든다.
- RenderTree를 table generation result로 투영한다.
- RenderTree와 Puck editable data를 상호 변환한다.
- missing reference, child order, unknown/duplicate Puck item, invalid props JSON 문제를 diagnostics로 반환한다.
- 파일 IO 없이 순수 함수로 동작한다.

두지 않는 책임:

- React render
- Puck React UI
- layout 선택
- pattern 추천
- spacing/default 보정
- validation rule 판정
- DB/REST 호출
- table 파일 읽기/쓰기

## 4. `packages/component`

`@cx/components`는 외부에 하나의 component vocabulary만 공개한다. 정본 component와 candidate component의 status는 패키지 내부에서만 관리하고, 외부 catalog shape에는 노출하지 않는다.

```text
packages/component/src/
  index.ts       public React component barrel
  public/        catalog read API, resolver API, CRUD mutation API, public types
  internal/      registry assembly, audit, mutation implementation
  components/    stable component implementations
  candidates/    candidate component implementations
  tokens/        component token aliases
```

공개 TypeScript export는 `@cx/components`, `@cx/components/catalog`, `@cx/components/mutations`, `@cx/components/resolver`, `@cx/components/types`를 기준으로 사용한다. `src/internal/*`, `src/components/*`, `src/candidates/*` 직접 import는 패키지 내부 구현으로 본다. Catalog CRUD 함수는 순수 함수로 registry를 입력받아 새 registry와 public catalog를 반환하며, 파일 쓰기와 승인 workflow는 이 패키지 밖에서 처리한다.

## 5. `packages/layout`

`@cx/layout`은 화면 chrome과 layout primitive를 제공한다. 외부에는 component, type, contract guard, style helper 계약만 공개하고 구현 디렉토리는 직접 import하지 않는다.

```text
packages/layout/src/
  index.ts       public barrel
  public/        chrome, primitives, style, types, contract public API
  chrome/        screen chrome component implementations
  primitives/    Flex/Grid component implementations
  internal/      className, spacing, fallback style implementation
```

공개 TypeScript export는 `@cx/layout`, `@cx/layout/chrome`, `@cx/layout/primitives`, `@cx/layout/style`, `@cx/layout/types`, `@cx/layout/contract`를 기준으로 사용한다. `src/internal/*`, `src/chrome/*`, `src/primitives/*` 직접 import는 패키지 내부 구현으로 본다.

## 6. 앱 구조 규칙

`apps/web`은 단일 제품 앱이므로 기능별 제품 namespace를 과하게 만들지 않는다. 다만 screen DB, Puck editor, smoke explorer, workbench shell의 책임은 파일 위치와 import 방향으로 구분한다.

```text
apps/web/src/
  app/             Next.js route와 API route
    api/screens/   screen DB facade
  components/      RenderTree 소비 UI
    layout/        workbench shell
    puck/          Puck editor UI only
    screen/        RenderTree preview UI
    smoke/         smoke artifact explorer UI
  lib/
    screen-db-*    Supabase REST row read/write facade
    smoke-*        smoke artifact read helper
  model/           workbench view model
```

재설계 기간에 앱은 product feature namespace를 깊게 만들지 않는다. 대신 `lib/*` helper의 책임 이름을 명확히 하고, 다음 import 방향을 지킨다.

- Puck UI는 `@cx/adapters/puck`만 알고 DB row나 Supabase를 모른다.
- screen DB loader/save는 Puck 타입을 모르고 RenderTree candidate와 DB row만 다룬다.
- smoke explorer는 artifact 비교만 하고 DB apply를 수행하지 않는다.
- workbench shell은 screen summary, candidate state, tab routing만 조립한다.

생성, 검수, Claude 실행, inference orchestration은 앱 책임이 아니며 `@cx/inference`/`@cx/agent`/`@cx/validation` 경계를 따른다. 기존 `@cx/pipeline` 경로는 compatibility surface다. `apps/web` API route는 얇은 adapter로만 둔다.

Smoke 실행은 사용자-facing 앱이 아니라 개발자-facing 스크립트다.

```text
scripts/
  smoke-pipeline.ts    smoke CLI entrypoint
  generation/          runGenerationSmoke wrapper and smoke helper types
```

외부 package/app code는 smoke helper를 import하지 않는다. root script는 `scripts/smoke-pipeline.ts`를 호출한다. 현재 generation 실행은 compatibility 경로인 `@cx/pipeline`의 `runPipeline("screen-generation")`에 위임하고, 신규 구조에서는 `@cx/inference`로 이동한다.

## 7. `packages/token`

`@cx/tokens`는 foundation/semantic token의 공개 소비 계약과 내부 생성 산출물을 분리한다.

```text
packages/token/src/
  index.ts       public TypeScript token entrypoint
  variables.css  public CSS variable entrypoint
  tailwind.css   public Tailwind v4 @theme entrypoint
  generated/     generated artifacts, direct import 금지
  internal/      import/normalize/validate/generate 로직, export 금지
```

공개 export는 `@cx/tokens`, `@cx/tokens/variables.css`, `@cx/tokens/tailwind.css`만 사용한다. `src/generated/*`와 `src/internal/*`는 패키지 내부 구현이다.

`@cx/components`의 token 파일은 `--skt-component-*` alias만 소유하고, palette/semantic/spacing/radius/typography 값은 `@cx/tokens`를 참조한다.

## 8. `packages/schema`

`@cx/schema`는 generation pipeline 전반의 DTO와 JSON artifact 계약을 정의하는 SSOT 패키지다. 디렉토리는 flat 구조를 유지하고, `generation-v2/` 같은 flow 이름은 경로와 schemaVersion에 넣지 않는다.

```text
packages/schema/src/
  index.ts
  versions.ts
  artifact-kind.ts
  source-spec.ts
  generation-context.ts
  agent-request.ts
  agent-result.ts
  render-tree.ts
  validation-report.ts
  preview.ts
  apply-result.ts
  json-schema-registry.ts
```

외부 패키지는 root export만 사용한다. schema 계약의 원천은 `@cx/schema` 하나로 유지하고, 파일별 subpath나 `src/*` 직접 import는 공개 소비 표면으로 보지 않는다.

```ts
import { SCHEMA_VERSION, getJsonSchema } from "@cx/schema";
import type { SourceSpec } from "@cx/schema";
```

`@cx/schema/src/*`, `@cx/schema/*` 직접 import는 금지한다. 필요한 계약은 `@cx/schema` root export에 먼저 추가한다. JSON Schema의 정본은 정적 JSON 파일이 아니라 `getJsonSchema()`와 `json-schema-registry.ts`다.

RenderTree 계약은 top-level `metadata.title`을 허용하지 않고, node `metadata.title`만 허용한다. JSON Schema 구조 검증은 `@cx/schema`가 제공하고, 컴포넌트별 prop 검증은 `@cx/validation`이 `@cx/components/catalog`를 주입받아 수행한다.

두지 않는 책임:

- 파일 읽기/쓰기
- Claude 실행
- validation rule 판정
- orchestration decision
- React render
- catalog 값 소유

## 9. Result And Apply Contract

screen generation의 최종 결과물은 `final-result.json`에 저장되는 RenderTree JSON이다. 이 RenderTree는 top-level `version`, `minRendererVersion`, `metadata`, `theme`, `children`를 갖고, `children` 아래에 `Screen` root와 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` region을 둔다.

테이블 반영은 최종 RenderTree를 screen, area, composite/component 레이어로 분해해 등록하는 apply 단계만 수행한다. table apply 단계는 새 화면을 생성하거나 RenderTree 의미를 재해석하지 않는다. schemaVersion의 정본은 `@cx/schema`의 `SCHEMA_VERSION`을 따른다.

## 10. `packages/agent` 문서 자산

`@cx/agent`가 참조하는 생성/검수 문장형 자산은 패키지 내부 문서 디렉토리에서 관리한다.

```text
packages/agent/docs/
  README.md
  session-policy.md
  screen-generation/
    prompt-contract.md
    checklist.md
    output-contract.md
  quality-review/
    prompt-contract.md
    checklist.md
    output-contract.md
```

이 디렉토리는 prompt 코드 구현이 아니라 prompt contract, checklist, output 규약 같은 문서 자산의 정본 위치다.
smoke/pipeline이 생성 참조 자산을 artifact로 남겨야 할 때도 이 디렉토리의 정본 문서를 참조한다.

## 11. Target Inference Packages

새 screen inference 구조는 MVP에서 단일 target package로 시작한다.

```text
packages/inference/src/
  index.ts
  stores/       JobStore, ArtifactStore, File*Store, Memory*Store
  context/      PipelineContext
  engine/       Claude/function execution engine boundary
  pipeline/     Pipeline Step format and execution helpers
  worker/       runInferenceJob orchestration
```

책임:

- `@cx/inference`: job/step/event/artifact/context/output contract 타입
- `@cx/inference`: `JobStore`/`ArtifactStore`와 local file/in-memory fake 구현
- `@cx/inference`: pipeline context, execution engine dispatch, pipeline/step definition, worker

기존 `@cx/inference-nodes`는 deprecated compatibility 패키지다. 새 screen inference 동작을 추가하지 않는다.

```text
packages/inference-nodes/src/
  index.ts              public barrel
  agent/                agent runner-facing shared node types
  screen-generation/    screen generation node wrappers and planning helpers
    planning/           pure agent input/context, pattern candidate, next-action helpers
```

두지 않는 책임:

- 파일 읽기/쓰기
- persistence/status 기록
- pipeline/stage 순서 소유
- Claude runner 구현 또는 local/API fallback 정책
- artifact write
- validation retry/fallback 정책
- RenderTree React render
- component/layout/pattern catalog 값 소유

## 12. `packages/validation`

`@cx/validation`은 생성 과정의 순수 검증을 담당한다. 현재는 생성물이 계약상 렌더 가능한지와 component catalog/layout props 계약을 지키는지 기계적으로 검증하는 public API를 제공한다.

```text
packages/validation/src/
  index.ts       public barrel
  public/        validation boundary contract, validators, report/issue public types
```

두지 않는 책임:

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- retry/fallback 정책
- stage transition 결정
- RenderTree React render
- catalog 값 생성 또는 수정

## 13. `packages/pipeline`

`@cx/pipeline`은 기존 screen-generation compatibility runtime과 side effect/IO 유틸리티를 담당한다. 신규 inference runtime 개념은 `@cx/inference`로 이동한다. 현재 MVP compatibility 경로에서는 `screen-generation` pipeline을 실행하고, 내부 stage에서 승인된 side effect command 배열을 순서대로 실행한다. source artifact read/versioned artifact/write log/approved artifact apply 결과는 감사 가능한 envelope로 반환한다.

```text
packages/pipeline/src/
  index.ts       public barrel
  public/        side effect boundary contract, parser adapter, public types
  runtime/       buildPipeline/runPipeline
  pipelines/     screen-generation pipeline definition and stages
  commands/      approved side effect command contracts and command helpers
  runner/        command sequence execution, executor registry, result envelope
  executors/     source artifact read, versioned artifact write, run log write, approved artifact apply
  adapters/      fs/clock/id environment adapters
  errors/        pipeline error types
  testing/       memory adapters and test fixtures
```

두지 않는 책임:

- 순수 stage input/output 조립
- Markdown parsing rule 소유
- 검증 rule 판정
- Claude adapter 구현
- RenderTree React render
- component/layout/pattern catalog 값 소유
- final RenderTree 의미 재해석
- 생성/검수 계약의 SSOT
