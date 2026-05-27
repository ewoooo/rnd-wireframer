# Project Structure

## 1. 문서 책임

이 문서는 저장소 디렉토리와 현재 패키지 책임 경계를 정의한다.

현재 생성 과정은 재설계 중이다. old `agent/importer/types/workflow/pattern-store` 패키지 경계는 제거했고, 재설계 예시 schema를 먼저 둔다.

## 2. 패키지 기준

| 패키지 | 책임 |
|---|---|
| `@cx/engine` | RenderTree JSON -> React render |
| `@cx/components` | leaf component 구현과 catalog 값/계약 |
| `@cx/layout` | 화면 chrome과 layout primitive |
| `@cx/tokens` | token CSS 산출물 |

제거된 패키지:

- `@cx/agent`
- `@cx/importer`
- `@cx/types`
- `@cx/workflow`
- `@cx/pattern-store`

## 3. `packages/engine`

`@cx/engine`은 json-to-render만 담당한다.

```text
packages/engine/src/
  index.ts
  render/       renderer public API
  renderer.tsx  RenderTree screen/node React renderer
  runtime.ts    binding/display/runtime helpers
  types.ts      renderer-local RenderTree input 타입
```

두지 않는 책임:

- table 후보 생성
- `database/tables` -> RenderTree projection
- schema/runtime validation
- PRDD parser/register/materializer
- AI runner/session adapter

## 4. 앱 구조 규칙

`apps/web`은 단일 제품 앱이므로 기능별 제품 namespace를 과하게 만들지 않는다.

```text
apps/web/src/
  app/          Next.js route와 API route
  components/   RenderTree 소비 UI
```

재설계 기간에 앱은 `data`, `model`, `server`, `app/api`, `adapters` 계층을 두지 않는다. 생성, 검수, 저장, 파일 시스템 side effect, API route는 앱 책임이 아니다.

## 5. Mock Schema

재설계 예시 schema는 `docs/development/mock-schemas/generation-v2/` 아래에 둔다. 런타임 데이터, 승인 데이터, 과거 AI import 산출물과 섞지 않는다.
