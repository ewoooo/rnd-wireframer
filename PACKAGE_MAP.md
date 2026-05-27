# RND Screen Generator 패키지 맵

## 1. 문서 책임

이 문서는 활성 패키지의 책임, 주요 기능, public surface, 패키지 간 관계망을 전역에서 추적한다.

제품 방향은 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 에이전트 운영은 [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md), 디렉토리 구조 세부는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다.

패키지별 상세 API와 예시는 각 `packages/*/README.md`를 기준으로 한다. 이 문서는 상세 구현을 중복하지 않고, 책임 경계와 관계만 요약한다.

## 2. 생성 흐름 관계망

```text
Markdown source
-> @cx/parser
-> SourceSpec
-> @cx/schema contracts
-> @cx/orchestration
-> screen-generation AgentTaskInput
-> @cx/agent
-> Claude result / RenderTree candidate
-> @cx/validation
-> ValidationReport
-> @cx/orchestration
-> next action / side effect intent
-> @cx/pipeline
-> versioned artifact / apply log
-> @cx/renderer
-> React preview
```

`@cx/components`, `@cx/layout`, `@cx/tokens`, `@cx/layout-pattern-store`는 생성 흐름에서 참조되는 설계 계약과 렌더 계약의 source of truth다.
`@cx/schema`는 generation pipeline 전반의 DTO와 JSON artifact 계약 버전을 추적한다.
`@cx/smoke`는 위 흐름을 개발자가 반복 실행하는 통합 앱이다.

## 3. 활성 패키지 요약

| 패키지 | 책임 | 주요 기능 | 두지 않는 책임 |
|---|---|---|---|
| `@cx/schema` | generation pipeline 전반 DTO/schema 계약 SSOT | schemaVersion, artifact kind, DTO 타입, JSON Schema skeleton, schema lookup | 파일 IO, Claude 실행, validation rule 판정, orchestration decision, React render |
| `@cx/parser` | Markdown/source 입력을 SourceSpec으로 정규화 | PRDD Markdown 파싱, source metadata 보존, parser issue 반환 | 파일 IO, Claude 실행, RenderTree 생성, catalog 검증 |
| `@cx/orchestration` | 순수 stage input/output 조립과 next action 결정 | SourceSpec -> screen-generation AgentTaskInput, 후속 stage/transition contract | 파일 IO, Claude 실행, validation rule 판정, React render |
| `@cx/agent` | Claude Agent SDK local-first 실행 adapter | task 분류, prompt/session/result adapter, `runAgentQuery` | 출력 타입 SSOT, workflow 소유, 저장, render |
| `@cx/validation` | 생성물의 렌더 가능성과 catalog/layout 계약 검증 | `validateAgentResult`, `validateComponentUsage`, `validateRenderTree`, `validateLayoutProps` | 디자인 품질 판단, retry 정책, stage transition, 파일 IO |
| `@cx/pipeline` | 승인된 side effect command 실행과 결과 회수 | `runSideEffects`, artifact write, run log write, approved artifact apply, parser adapter | 업무 판단, parsing rule, validation rule, Claude 실행, render |
| `@cx/renderer` | RenderTree JSON을 React로 렌더링 | RenderTree 타입, node renderer registry, area/component node render | table projection, schema validation, materializer, AI 실행 |
| `@cx/components` | component vocabulary와 catalog 계약 | React components, public catalog, resolver, pure catalog CRUD, component token aliases | workflow, 파일 승인 반영, foundation token 소유 |
| `@cx/layout` | 화면 chrome과 layout primitive | `AppScreen`, `Flex`, `Grid`, layout style helper, DTO guards | component catalog, token SSOT, 생성 workflow |
| `@cx/tokens` | foundation/semantic token SSOT | token constants, CSS variables, Tailwind v4 `@theme` entrypoint | component alias token, generated file 직접 소비 |
| `@cx/layout-pattern-store` | layout pattern reference catalog | pattern load/list/resolve, pure pattern CRUD, local schema validation | pattern 적용 workflow, 파일 승인 반영, renderer 직접 렌더 |
| `@cx/smoke` | 개발자용 통합 smoke 실행 앱 | `runGenerationSmoke`, fake/AI runner 선택, smoke artifact 기록, CLI 제공 | 제품 런타임, parser/validation/renderer rule 소유 |

## 4. Public Surface

| 패키지 | Public subpath |
|---|---|
| `@cx/schema` | `.` |
| `@cx/parser` | `.`, `./contract`, `./markdown`, `./types` |
| `@cx/orchestration` | `.`, `./contract`, `./generation`, `./types` |
| `@cx/agent` | `.`, `./adapters`, `./claude`, `./contract`, `./tasks` |
| `@cx/validation` | `.`, `./contract`, `./types` |
| `@cx/pipeline` | `.`, `./adapters`, `./commands`, `./contract`, `./parser`, `./runner`, `./testing`, `./types` |
| `@cx/renderer` | `.`, `./renderer` |
| `@cx/components` | `.`, `./catalog`, `./mutations`, `./resolver`, `./types`, CSS/token subpaths |
| `@cx/layout` | `.`, `./chrome`, `./contract`, `./primitives`, `./style`, `./types` |
| `@cx/tokens` | `.`, `./variables.css`, `./tailwind.css` |
| `@cx/layout-pattern-store` | `.`, `./mutations`, `./resolver`, `./types` |
| `@cx/smoke` | `.`, `./generation` |

외부 패키지는 `src/internal/*`, 구현 디렉토리, generated artifact를 직접 import하지 않는다. `@cx/schema`는 root export만 사용하고 `src/json-schema/*`를 직접 import하지 않는다.

## 5. 관계 규칙

- `@cx/schema`는 DTO/schema 계약만 소유하고 실행/검증/렌더 책임을 갖지 않는다.
- `@cx/parser`는 catalog 목록을 소유하지 않고 Markdown에 명시된 source hint만 보존한다.
- `@cx/orchestration`은 다음 단계에 필요한 입력과 의도를 순수 데이터로 만든다.
- `@cx/agent`는 Claude 실행만 담당하고, 결과의 최종 정합성 판단은 `@cx/validation`에 맡긴다.
- `@cx/validation`은 필요한 catalog와 contract를 인자로 받으며 파일을 쓰지 않는다.
- `@cx/pipeline`은 이미 결정된 command만 실행하고, 업무 판단을 하지 않는다.
- `@cx/renderer`는 RenderTree JSON만 소비하고 생성 과정이나 검증을 소유하지 않는다.
- `@cx/smoke`는 여러 패키지를 조립해 실행하지만 각 패키지의 규칙을 재구현하지 않는다.
- catalog, token, pattern 값은 각 소유 패키지 public API를 통해서만 소비한다.

## 6. 현재 MVP 실행 기준

현재 빠른 MVP 실행은 script/CLI가 상위 진입점이 된다.

```text
script
-> @cx/smoke/generation runGenerationSmoke
-> file read
-> @cx/pipeline/parser
-> @cx/parser SourceSpec
-> @cx/orchestration/generation
-> @cx/agent screen-generation
-> @cx/validation
-> @cx/pipeline artifact write
```

root script는 `apps/smoke` CLI를 호출한다. 외부 TypeScript 사용자는 `@cx/smoke/generation`의 `runGenerationSmoke(target, options)`를 사용한다. smoke app은 임시 상위 흐름일 수 있지만, parser rule, validation rule, Claude 실행 adapter, renderer 구현을 직접 소유하지 않는다.
