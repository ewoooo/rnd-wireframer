# Project Structure

## 1. 문서 책임

이 문서는 저장소 디렉토리와 현재 패키지 책임 경계를 정의한다.

현재 생성 과정은 재설계 중이다. old `importer/types/workflow` 패키지 경계는 제거했고, `agent`는 Claude Agent SDK 실행 adapter로만 다시 둔다. `layout-pattern-store`는 내부 타입과 schema를 소유한 reference catalog 패키지로 복구한다. 재설계 예시 schema는 먼저 `docs/development/mock-schemas/generation-v2/`에 둔다.

## 2. 패키지 기준

| 패키지 | 책임 |
|---|---|
| `@cx/renderer` | RenderTree JSON -> React render |
| `@cx/agent` | Claude Agent SDK local-first 실행 adapter |
| `@cx/parser` | Markdown/source 입력 -> SourceSpec 정규화 |
| `@cx/components` | leaf component 구현과 catalog 값/계약 |
| `@cx/layout` | 화면 chrome과 layout primitive |
| `@cx/tokens` | foundation/semantic token SSOT, CSS variables, Tailwind v4 `@theme` 산출물 |
| `@cx/layout-pattern-store` | screen/region/area/composite layout pattern reference catalog, local schema/type |
| `@cx/orchestration` | 생성/검수/미리보기/반영 stage의 순수 입력 조립과 next action 결정 |
| `@cx/validation` | DTO/reference/rule 검증과 validation report 생성 |
| `@cx/pipeline` | 승인된 side effect 명령을 순서대로 전달하고 실행 결과를 회수하는 conveyor belt |

제거된 패키지:

- `@cx/importer`
- `@cx/types`
- `@cx/workflow`

## 3. `packages/renderer`

`@cx/renderer`은 json-to-render만 담당한다.

```text
packages/renderer/src/
  index.ts            public renderer API
  tree/               RenderTree JSON 타입, path, binding, runtime value helpers
  registry/           node kind -> renderer 연결표와 kind map
  render/             NodeRenderer와 재귀 render 실행
  nodes/              renderer-owned structural/fallback node render definitions
    area/             area.static / area.dynamic renderers
    component/        @cx/components read-only resolver와 catalog prop adapter
```

두지 않는 책임:

- table 후보 생성
- `database/tables` -> RenderTree projection
- schema/runtime validation
- PRDD parser/register/materializer
- AI runner/session adapter
- component catalog CRUD
- layout pattern CRUD/selection

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

`apps/web`은 단일 제품 앱이므로 기능별 제품 namespace를 과하게 만들지 않는다.

```text
apps/web/src/
  app/          Next.js route와 API route
  components/   RenderTree 소비 UI
```

재설계 기간에 앱은 `data`, `model`, `server`, `app/api`, `adapters` 계층을 두지 않는다. 생성, 검수, 저장, 파일 시스템 side effect, API route는 앱 책임이 아니다.

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

## 8. Mock Schema

재설계 예시 schema는 `docs/development/mock-schemas/generation-v2/` 아래에 둔다. 런타임 데이터, 승인 데이터, 과거 AI import 산출물과 섞지 않는다.

## 9. `packages/parser`

`@cx/parser`는 Markdown 같은 원천 입력 문자열을 생성 흐름에서 사용할 SourceSpec JSON으로 정규화하는 순수 parser 패키지다. MVP에서는 파일 시스템을 읽지 않고, 이미 읽힌 Markdown 문자열 묶음을 받아 SourceSpec과 parser issue를 반환한다.

```text
packages/parser/src/
  index.ts       public barrel
  public/        parser boundary contract, markdown parser, SourceSpec/parser types
```

두지 않는 책임:

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- DraftCandidate 생성
- RenderTree 생성 또는 React render
- catalog 값 검증
- validation next action 결정

## 10. `packages/orchestration`

`@cx/orchestration`은 생성 과정의 순수한 업무 흐름을 담당한다. 현재는 패키지 책임과 public contract만 할당하고, 실제 stage builder와 next action 결정 로직은 후속 설계가 확정된 뒤 추가한다.

```text
packages/orchestration/src/
  index.ts       public barrel
  public/        pure orchestration boundary contract, public types
```

두지 않는 책임:

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- 검증 rule 판정
- RenderTree React render
- component/layout/pattern catalog 값 소유
- 승인 데이터 직접 반영

## 11. `packages/validation`

`@cx/validation`은 생성 과정의 순수 검증을 담당한다. 현재는 패키지 책임과 public contract만 할당하고, 실제 DTO/schema/reference/rule 검증은 후속 설계가 확정된 뒤 추가한다.

```text
packages/validation/src/
  index.ts       public barrel
  public/        pure validation boundary contract, public types
```

두지 않는 책임:

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- retry/fallback 정책
- stage transition 결정
- RenderTree React render
- catalog 값 생성 또는 수정

## 12. `packages/pipeline`

`@cx/pipeline`은 생성 과정의 side effect conveyor belt만 담당한다. MVP에서는 승인된 side effect command 배열을 순서대로 실행하고, versioned artifact/write log/approved artifact apply 결과를 감사 가능한 envelope로 반환한다.

```text
packages/pipeline/src/
  index.ts       public barrel
  public/        side effect boundary contract, parser adapter, public types
  commands/      approved side effect command contracts and command helpers
  runner/        command sequence execution, executor registry, result envelope
  executors/     versioned artifact write, run log write, approved artifact apply
  adapters/      fs/clock/id environment adapters
  errors/        pipeline error types
  testing/       memory adapters and test fixtures
```

두지 않는 책임:

- Claude Agent SDK 실행
- 순수 stage input/output 조립
- Markdown parsing rule 소유
- 검증 rule 판정
- RenderTree React render
- component/layout/pattern catalog 값 소유
- mock schema 원본 수정
- 생성/검수 계약의 SSOT
