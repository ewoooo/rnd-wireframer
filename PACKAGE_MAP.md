# RND Screen Generator 패키지 맵

## 1. 문서 책임

이 문서는 활성 패키지의 책임, 주요 기능, public surface, 패키지 간 관계망을 전역에서 추적한다.

제품 방향은 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 에이전트 운영은 [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md), 디렉토리 구조 세부는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다.
`@cx/agent` 실행 계약은 [AGENT_RUNTIME_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/AGENT_RUNTIME_PROTOCOL.md), `@cx/pipeline` stage/runtime 계약은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)를 따른다.

패키지별 상세 API와 예시는 각 `packages/*/README.md`를 기준으로 한다. 이 문서는 상세 구현을 중복하지 않고, 책임 경계와 관계만 요약한다.

## 2. 생성 흐름 관계망

```text
Markdown source
-> @cx/pipeline runtime
-> screen-generation stage contract
-> @cx/parser
-> SourceSpec
-> @cx/orchestration deterministic stage helpers
-> @cx/agent generation/review tasks
-> @cx/validation contract validation
-> @cx/pipeline artifact write
-> @cx/renderer
-> React preview
```

stage 순서와 stage별 입출력 계약의 정본은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)이다. 이 문서는 패키지 관계만 요약하고 stage 상세를 중복하지 않는다.

`@cx/components`, `@cx/layout`, `@cx/tokens`, `@cx/layout-pattern-store`는 생성 흐름에서 참조되는 설계 계약과 렌더 계약의 source of truth다.
`@cx/schema`는 generation pipeline 전반의 DTO와 JSON artifact 계약 버전을 추적한다.
`@cx/table-materializer`는 table read model을 screen 단위 RenderTree로 조립하는 순수 변환 경계다.
`@cx/smoke`는 위 흐름을 개발자가 반복 실행하는 통합 앱이다.
생성/검수 prompt, checklist, output example 같은 문장형 참조 자산의 정본은 `packages/agent/docs/`가 소유한다. smoke/pipeline도 필요한 문장형 참조 자산은 이 정본 위치를 참조한다.
design skill과 design-context bundle의 에이전트용 규칙 정본은 `packages/agent/docs/` 아래에 둔다. `@cx/orchestration`은 skill/bundle ref만 선택하고, `@cx/pipeline`이 bundle 본문을 로드해 agent stage context에 주입한다.
`component-proposal`은 카탈로그 밖 후보를 제시하는 비파괴 아티팩트다. generation은 카탈로그에 bounded인 채로 두고, 제안의 확정·반영은 `@cx/components` mutation으로만 한다.

## 3. 활성 패키지 요약

| 패키지 | 책임 | 주요 기능 | 두지 않는 책임 |
|---|---|---|---|
| `@cx/schema` | generation pipeline 전반 DTO/schema 계약 SSOT | schemaVersion, artifact kind, DTO 타입, JSON Schema registry, schema lookup | 파일 IO, Claude 실행, validation rule 판정, orchestration decision, React render |
| `@cx/parser` | Markdown/source 입력을 SourceSpec으로 정규화 | PRDD Markdown 파싱, source metadata 보존, parser issue 반환 | 파일 IO, Claude 실행, RenderTree 생성, catalog 검증 |
| `@cx/orchestration` | pipeline stage deterministic helper | SourceSpec -> pattern layer candidates, pattern-selection/screen-generation/screen-revision AgentTaskInput, 후속 stage/transition helper | pipeline 실행, stage 순서 소유, 파일 IO, Claude 실행, validation rule 판정, React render |
| `@cx/agent` | Claude Agent SDK local-first 실행 adapter | task 분류, prompt/session/result adapter, `runAgentQuery`, 패키지 내부 참조 자산 관리 | 출력 타입 SSOT, workflow 소유, 저장, render |
| `@cx/validation` | 생성물의 렌더 가능성과 schema/catalog/layout 계약 검증 | `validateSchemaArtifact`, `validateAgentResult`, `validateComponentUsage`, `validateRenderTree`, `validateLayoutProps` | 디자인 품질 판단, retry 정책, stage transition, 파일 IO |
| `@cx/pipeline` | pipeline runtime과 side effect/IO 유틸리티 | `buildPipeline`, `runPipeline`, `runSideEffects`, source artifact read, artifact write, run log write, parser adapter | stage helper rule 소유, parsing rule, validation rule, Claude adapter 구현, render |
| `@cx/table-materializer` | table read model -> screen RenderTree 순수 조립 | `materializeTableScreen`, `materializeTableScreens`, table record relation compose | React render, layout 선택, pattern 추천, spacing 보정, validation rule 판정, 파일 IO |
| `@cx/renderer` | RenderTree JSON을 React로 렌더링 | `@cx/schema` RenderTree 계약 소비, resolver 기반 interpreter, renderer adapter runtime | table projection, schema validation, materializer, AI 실행 |
| `@cx/components` | component vocabulary와 catalog 계약 | React components, public catalog, resolver, pure catalog CRUD, component token aliases | workflow, 파일 승인 반영, foundation token 소유 |
| `@cx/layout` | 화면 chrome과 layout primitive | `AppScreen`, `Flex`, `Grid`, layout style helper, DTO guards | component catalog, token SSOT, 생성 workflow |
| `@cx/tokens` | foundation/semantic token SSOT | token constants, CSS variables, Tailwind v4 `@theme` entrypoint | component alias token, generated file 직접 소비 |
| `@cx/layout-pattern-store` | layout pattern reference catalog | pattern load/list/resolve, pattern id -> React layout component registry, pure pattern CRUD, local schema validation | pattern 적용 workflow, 파일 승인 반영, renderer 직접 렌더 |
| `@cx/smoke` | 개발자용 pipeline smoke CLI | `runGenerationSmoke`, CLI option parsing, pipeline summary 출력 | 제품 런타임, orchestration/agent/validation 직접 실행, parser/validation/renderer rule 소유 |

## 4. Public Surface

| 패키지 | Public subpath |
|---|---|
| `@cx/schema` | `.` |
| `@cx/parser` | `.`, `./contract`, `./markdown`, `./types` |
| `@cx/orchestration` | `.`, `./contract`, `./generation`, `./types` |
| `@cx/agent` | `.`, `./adapters`, `./claude`, `./contract`, `./tasks` |
| `@cx/validation` | `.`, `./contract`, `./types` |
| `@cx/pipeline` | `.`, `./adapters`, `./commands`, `./contract`, `./parser`, `./runner`, `./runtime`, `./testing`, `./types` |
| `@cx/table-materializer` | `.` |
| `@cx/renderer` | `.`, `./renderer` compatibility entrypoint |
| `@cx/components` | `.`, `./catalog`, `./mutations`, `./resolver`, `./types`, CSS/token subpaths |
| `@cx/layout` | `.`, `./chrome`, `./contract`, `./primitives`, `./style`, `./types` |
| `@cx/tokens` | `.`, `./variables.css`, `./tailwind.css` |
| `@cx/layout-pattern-store` | `.`, `./components`, `./mutations`, `./resolver`, `./types` |
| `@cx/smoke` | `.`, `./generation` |

외부 패키지는 `src/internal/*`, 구현 디렉토리, generated artifact를 직접 import하지 않는다. `@cx/schema`는 root export만 사용하고 `@cx/schema/*`를 직접 import하지 않는다. JSON Schema는 정적 파일이 아니라 `@cx/schema`의 `getJsonSchema()`로만 소비한다.

## 5. 관계 규칙

- `@cx/schema`는 DTO/schema 계약만 소유하고 실행/검증/렌더 책임을 갖지 않는다.
- `@cx/parser`는 catalog 목록을 소유하지 않고 Markdown에 명시된 source hint만 보존한다.
- `@cx/orchestration`은 pipeline stage가 사용할 입력과 의도를 순수 데이터로 만든다.
- `@cx/agent`는 Claude 실행만 담당하고, 결과의 최종 정합성 판단은 `@cx/validation`에 맡긴다.
- `@cx/validation`은 필요한 catalog와 contract를 인자로 받으며 파일을 쓰지 않는다.
- `@cx/pipeline`은 pipeline definition과 stage runtime을 실행하고, IO는 side effect command runner로 위임한다.
- `@cx/table-materializer`는 table read model의 screen/region/area/component 관계를 따라 `@cx/schema`의 `RenderTreeScreenNodeContract`를 조립한다.
- `@cx/table-materializer`는 layout을 고르거나, spacing을 보정하거나, validation 판정을 내리지 않는다.
- `@cx/renderer`는 RenderTree JSON만 소비하고 생성 과정이나 검증을 소유하지 않는다.
- `@cx/renderer`는 `data/tables` schema나 table materializer 타입을 import하지 않는다.
- `@cx/renderer/renderer`는 과거 public import를 위한 compatibility entrypoint로만 유지하고, 신규 소비자는 `@cx/renderer` root를 사용한다.
- `@cx/smoke`는 `@cx/pipeline`만 호출하고 각 패키지의 규칙을 재구현하지 않는다.
- catalog, token, pattern 값은 각 소유 패키지 public API를 통해서만 소비한다.

## 6. Pipeline Runtime Boundary

`@cx/pipeline`은 generation pipeline definition과 stage runtime을 소유한다. stage 순서, stage id, runtime context, agent 실행 연결, validation 호출 연결, artifact write 연결은 pipeline 경계에 둔다.
stage 순서와 stage별 입출력, design skill/context 주입, revision 조건, artifact 추적 기준은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)를 따른다.

`@cx/orchestration`은 pipeline stage 내부에서 쓰는 deterministic helper만 제공한다. SourceSpec, 후보 pattern, validation report 같은 입력을 agent task input이나 next-action data로 조립하지만 실행 가능한 plan을 소유하지 않는다.

`apps/smoke`는 개발 환경에서 `runPipeline("screen-generation", options)`만 호출하는 thin harness다. smoke는 `@cx/orchestration`, `@cx/agent`, `@cx/validation`, catalog 패키지를 직접 import하지 않는다.

## 7. 현재 MVP 실행 기준

현재 빠른 MVP 실행은 script/CLI가 상위 진입점이 된다.

```text
script
-> @cx/smoke/generation runGenerationSmoke
-> @cx/pipeline runPipeline("screen-generation")
-> PIPELINE_STAGE_PROTOCOL.md의 screen-generation stage sequence
```

root script는 `apps/smoke` CLI를 호출한다. 외부 TypeScript 사용자는 `@cx/smoke/generation`의 `runGenerationSmoke(target, options)`를 사용할 수 있지만, 내부 구현은 `@cx/pipeline`의 `runPipeline("screen-generation", options)`를 호출한다.
