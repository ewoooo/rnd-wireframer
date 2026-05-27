# RND Screen Generator 에이전트 히스토리

## 1. 문서 책임

이 문서는 변경 이력만 기록한다.

제품, 아키텍처, 데이터, 에이전트 역할의 최신 기준은 `MASTER_PLAN.md`, `PACKAGE_MAP.md`, `AGENTS.md`와 세부 책임 문서를 참조한다.

`AGENTS.md`, `MASTER_PLAN.md`, `PACKAGE_MAP.md`, `AGENTS_HISTORY.md`는 루트 전역 문서로 유지한다. 세부 설계 문서는 `docs/` 아래에 둔다.

| 주제 | 기준 문서 |
|---|---|
| 제품 방향 | [MASTER_PLAN.md](./MASTER_PLAN.md) |
| 패키지 관계망 | [PACKAGE_MAP.md](./PACKAGE_MAP.md) |
| 에이전트 운영 | [AGENTS.md](./AGENTS.md) |
| 프로젝트 구조 | [docs/development/PROJECT_STRUCTURE.md](./docs/development/PROJECT_STRUCTURE.md) |

## 2. 기록 형식

```markdown
## YYYY-MM-DD - Agent

- 변경:
- 이유:
- 검증:
- 후속:
```

새 엔트리는 이 파일의 최근 엔트리 섹션 상단에 추가한다. 오래된 세부 로그는 필요할 때 외부 아카이브로 분리한다.

## 3. 아카이브

- 월별 repo 내부 아카이브는 2026-05-27 감량 라운드에서 제거함

## 4. 최근 엔트리

최근 주요 변경만 inline 유지한다.

## 2026-05-27 - RenderTree Schema Validation

- 변경: RenderTree 계약을 좁혀 top-level `metadata.title`을 제거하고 node `metadata.title`만 필수로 유지함
- 변경: `@cx/schema`의 `render-tree.v0.1` JSON Schema를 실제 구조 계약으로 확장하고, `@cx/validation`에 AJV 기반 `validateSchemaArtifact`를 추가함
- 변경: generation smoke가 AI/fake payload를 RenderTree schema와 semantic validator로 검증해 `validation-report.json`을 산출하도록 연결함
- 이유: AI 출력이 타입 설명만 참고하는 수준을 넘어 pipeline artifact 저장 전에 계약 위반을 기계적으로 드러내게 하기 위함
- 검증: `npx vitest run packages/schema/src/__tests__/public-api.test.ts packages/validation/src/__tests__/validators.test.ts packages/orchestration/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/schema packages/validation packages/orchestration packages/parser packages/renderer apps/smoke AGENTS.md PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md' --run-id validation-check --out-dir tmp/generation-runs/validation-check`
- 후속: 실제 Claude 출력이 schema error를 낼 경우 validation issue를 orchestration retry input으로 넘기는 단계를 추가한다.

## 2026-05-27 - Schema Contract Package

- 변경: `@cx/schema` 패키지를 추가해 generation pipeline 전반 DTO/schema 계약의 SSOT를 만들고 root export만 공개하도록 함
- 변경: schemaVersion과 JSON Schema `$id`에서 `generation-v2` prefix를 제거하고 `source-spec.v0.1`, `render-tree.v0.1` 같은 artifact-local 버전명으로 정리함
- 변경: `SourceSpec` 타입과 `SCHEMA_VERSION`을 `@cx/schema`로 옮기고 `@cx/parser`, `@cx/orchestration`, generation-v2 fixture가 이를 따르도록 갱신함
- 이유: 파이프라인 전반 계약을 패키지별 타입과 mock fixture에 흩어두지 않고, AI prompt/validation/smoke output이 같은 계약명을 참조하게 하기 위함
- 검증: `npx vitest run packages/schema/src/__tests__/public-api.test.ts packages/parser/src/__tests__/markdown.test.ts packages/orchestration/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/schema packages/parser packages/orchestration docs/development/mock-schemas/generation-v2`
- 후속: RenderTree JSON Schema를 skeleton에서 실제 renderer contract 수준으로 좁힌다.

## 2026-05-27 - Smoke App Promotion

- 변경: `tests/smoke` 하네스를 `apps/smoke`의 `@cx/smoke` workspace app으로 격상함
- 변경: 외부 TypeScript 사용자는 `@cx/smoke/generation`의 `runGenerationSmoke(target, options)`를 사용하고, CLI는 `apps/smoke/src/cli.ts`에서 제공하도록 정리함
- 변경: root `smoke:pipeline` script가 `apps/smoke` CLI를 호출하도록 변경하고, `scripts/smoke-generation-pipeline.ts`는 제거함
- 변경: `PACKAGE_MAP.md`와 `docs/development/PROJECT_STRUCTURE.md`에 `@cx/smoke` 앱과 새 `@cx/schema` 계약 패키지 관계를 반영함
- 이유: smoke flow가 반복 실행되는 개발자용 통합 앱 성격을 갖기 시작했기 때문에 테스트 폴더보다 apps workspace에서 노출하는 편이 책임상 명확함
- 검증: `npm install`, `npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md --run-id smoke-app-check --out-dir tmp/generation-runs/smoke-app-check`, `npm --workspace @cx/smoke run generation -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md --run-id smoke-app-workspace-check --out-dir tmp/generation-runs/smoke-app-workspace-check`, `npx tsx -e 'import { runGenerationSmoke } from "@cx/smoke/generation"; console.log(typeof runGenerationSmoke)'`, `npx tsc --noEmit --pretty false`, `npx biome check --write apps/smoke package.json`, `npx vitest run packages/parser/src/__tests__/markdown.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/agent/src/__tests__/agent-runtime.test.ts`
- 후속: 외부 smoke case preset이 늘어나면 `@cx/smoke/generation` 아래에 case registry를 추가하되 parser/validation/renderer rule은 각 소유 패키지에 둔다.

## 2026-05-27 - Generation Smoke Harness

- 변경: `scripts/smoke-generation-pipeline.ts`의 실행 본문을 `tests/smoke/generation/*` 하네스로 분리하고 CLI는 인자 처리와 summary 출력만 담당하도록 축소함
- 변경: 반복 테스트와 수동 실행이 함께 사용할 단일 노출 함수 `runGenerationSmoke(target, options)`를 `tests/smoke`에서 제공함
- 변경: fake agent runner, artifact writer, path/run id helper, smoke result 타입을 하네스 내부 파일로 분리함
- 이유: 앞으로 md -> SourceSpec -> orchestration -> agent 흐름의 스모크 케이스가 늘어날 때 CLI 스크립트가 비대해지는 것을 막고, 테스트 코드가 같은 실행 함수를 재사용하게 하기 위함
- 검증: `npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md --run-id smoke-harness-check --out-dir tmp/generation-runs/smoke-harness-check`, `npx tsc --noEmit --pretty false`, `npx biome check --write scripts/smoke-generation-pipeline.ts tests/smoke`, `npx vitest run packages/parser/src/__tests__/markdown.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/agent/src/__tests__/agent-runtime.test.ts`
- 후속: smoke case preset과 assertion helper가 필요해지면 `tests/smoke/cases`와 `tests/smoke/assertions`로 추가한다.

## 2026-05-27 - Global Package Map

- 변경: 루트 전역 문서 `PACKAGE_MAP.md`를 추가해 활성 패키지의 책임, 주요 기능, public surface, 관계망을 한 곳에서 볼 수 있게 함
- 변경: `MASTER_PLAN.md`, `AGENTS.md`, `AGENTS_HISTORY.md`의 전역 문서 참조에 `PACKAGE_MAP.md`를 추가함
- 변경: `docs/development/PROJECT_STRUCTURE.md`의 `@cx/validation` 설명을 실제 구현된 validator API 상태에 맞춰 갱신함
- 이유: 패키지별 README와 구조 문서만으로는 전체 생성 흐름에서 어떤 패키지가 어떤 책임으로 연결되는지 한눈에 보기 어렵기 때문
- 검증: `rg -n "PACKAGE_MAP|@cx/validation|후속 설계" PACKAGE_MAP.md MASTER_PLAN.md AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md packages/validation/README.md`로 전역 참조와 validation 설명 최신화 확인. Markdown 파일은 Biome ignore 설정상 처리 대상이 아님
- 후속: 새 패키지나 public subpath가 생기면 `PACKAGE_MAP.md`와 해당 패키지 README를 함께 갱신한다.

## 2026-05-27 - Smoke Pipeline Script

- 변경: `scripts/smoke-generation-pipeline.ts`를 추가해 사용자가 `client-imports`의 Markdown 파일을 직접 지정해 md -> SourceSpec -> screen-generation AgentTaskInput -> fake agent query 흐름을 실행할 수 있게 함
- 변경: `npm run smoke:pipeline -- --target <path>` 스크립트를 추가하고, 산출물을 기본 `tmp/pipeline/smoke/<run-id>/` 아래 고정 파일명으로 저장하도록 함
- 이유: 임시 `tsx -e` 스모크와 매번 달라지는 timestamp 폴더 대신 재사용 가능한 테스트 파이프라인을 제공하기 위함
- 검증: `npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md`, `npx tsc --noEmit --pretty false`, `npx biome check scripts/smoke-generation-pipeline.ts package.json`
- 후속: 실제 Claude runner 연결 시 fake runner 옵션과 real runner 옵션을 분리한다.

## 2026-05-27 - Orchestration Screen Generation Input

- 변경: `@cx/orchestration`에 `buildScreenGenerationAgentInput`을 추가해 `SourceSpec`을 `@cx/agent`의 `screen-generation` 입력으로 조립하도록 함
- 변경: `@cx/orchestration/generation` public subpath와 `ScreenGenerationAgentContext`, `ScreenGenerationAgentInput` 타입을 추가함
- 이유: md -> SourceSpec 다음 단계인 Claude 생성 요청을 순수 stage input build 책임 안에서 준비하기 위함
- 검증: `npx vitest run packages/orchestration/src/__tests__/public-api.test.ts packages/agent/src/__tests__/agent-runtime.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/orchestration packages/agent`
- 후속: 실제 Claude runner가 연결되면 이 입력을 `runAgentQuery(..., { taskKind: "screen-generation" })`에 전달한다.

## 2026-05-27 - Pipeline Parser Issue Envelope Cleanup

- 변경: `runParseMarkdownSourceCommand` 결과에서 pipeline `issues`와 `commands[].issues` 복제를 제거하고 `parseResult.issues`만 남기도록 정리함
- 이유: parser issue와 side effect issue의 책임을 분리해 md -> SourceSpec 스모크 결과를 읽기 쉽게 만들기 위함
- 검증: `npx vitest run packages/parser/src/__tests__/markdown.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/parser packages/pipeline`
- 후속: 실제 side effect runner 결과에서만 `SideEffectIssue`를 유지한다.

## 2026-05-27 - Parser PRDD Table Extraction

- 변경: `@cx/parser`가 PRDD Markdown의 `화면 ID`, `화면 명`, `화면 구성` 표, `컴포넌트 상세` 표를 SourceSpec으로 추출하도록 확장함
- 변경: SourceSpec component에 `variant` optional field를 추가하고 컴포넌트 ID, 영역 번호, 표시 텍스트를 table row에서 회수하도록 함
- 이유: 실제 `data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md` 문서에서 결정론적으로 안전한 구조 정보를 먼저 파싱하기 위함
- 검증: `npx vitest run packages/parser/src/__tests__/markdown.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/parser packages/pipeline`
- 후속: 이벤트/액션/바인딩 source trace는 `hooks: NodeHook[]`와 생성 컨텍스트 계약이 확정된 뒤 별도 필드로 승격한다.

## 2026-05-27 - Generation V2 Schema Version Normalize

- 변경: generation-v2 schemaVersion을 `*.mock.v1`에서 정규 계약 버전 `*.v0.1`로 변경함
- 변경: `@cx/parser` SourceSpec 타입, markdown parser 출력, parser 테스트, generation-v2 mock JSON 예시의 schemaVersion을 함께 갱신함
- 이유: mock fixture 파일은 예시로 유지하되 JSON 내부 schemaVersion은 실제 계약 버전으로 추적하기 위함
- 검증: `npx vitest run packages/parser/src/__tests__/markdown.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/parser packages/pipeline docs/development/mock-schemas/generation-v2 AGENTS_HISTORY.md`
- 후속: 각 stage DTO가 확정되면 `v0.1` 계약 문서를 별도 schema 문서로 승격한다.

## 2026-05-27 - Pipeline MVP Directory Split

- 변경: `@cx/pipeline` MVP 구조를 `commands`, `runner`, `executors`, `adapters`, `errors`, `testing` 디렉토리로 분리함
- 변경: `runSideEffects`, `createNodePipelineAdapters`, memory test adapter, versioned artifact write, run log write, approved artifact apply executor를 추가함
- 변경: 기존 `@cx/pipeline/parser` public subpath는 유지하되 markdown parse command 구현을 `commands/` 아래로 이동함
- 이유: pipeline을 업무 흐름 판단이 아닌 승인된 side effect command 실행과 감사 가능한 결과 회수 책임으로 고정하기 위함
- 검증: `npx vitest run packages/pipeline/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/pipeline AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md`
- 후속: orchestration에서 생성할 실제 command builder와 E2E generation flow는 별도 상위 조립 레이어에서 추가한다.

## 2026-05-27 - Parser MVP and Pipeline Adapter

- 변경: `packages/parser`에 `@cx/parser` 패키지를 추가하고 Markdown source bundle을 SourceSpec으로 정규화하는 `parseMarkdownSourceBundle` public API를 추가함
- 변경: parser가 파일 읽기, Claude 실행, RenderTree 생성, validation rule 판정, catalog 값 소유를 하지 않도록 README와 boundary contract를 기록함
- 변경: `@cx/pipeline/parser`에 이미 읽힌 Markdown source를 parser로 전달하는 `runParseMarkdownSourceCommand` MVP adapter를 추가함
- 변경: `MASTER_PLAN.md`, `AGENTS.md`, `docs/development/PROJECT_STRUCTURE.md`에 `.md -> SourceSpec -> Claude RenderTree -> validation -> renderer` 흐름의 parser 경계를 반영함
- 이유: 빠른 E2E MVP를 위해 `.md -> SourceSpec` 변환만 먼저 순수 함수로 만들고, 파일 IO와 후속 side effect는 pipeline 경계에서 다루기 위함
- 검증: `npx vitest run packages/parser/src/__tests__ packages/pipeline/src/__tests__`, `npx tsc --noEmit --pretty false`, `npx biome check packages/parser packages/pipeline MASTER_PLAN.md AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md`
- 후속: 실제 파일 읽기 command, Claude RenderTree 생성 runner, validation/renderer 연결은 각 패키지 책임에 맞춰 별도 단계로 붙인다.

## 2026-05-27 - Validation First Implementation

- 변경: `@cx/validation`에 `validateAgentResult`, `validateComponentUsage`, `validateRenderTree`, `validateLayoutProps` public API를 추가함
- 변경: 공통 `ValidationReport`에 target, issues, summary(error/warning count)를 정리하고 component catalog 계약 기반 required/enum/type/unknown/readonly prop 검증을 추가함
- 변경: RenderTree version, Screen region 구조, node type, children, display/binding/default 값과 layout props를 순수 함수로 검증하도록 구현함
- 이유: 디자인 품질 판단이나 orchestration 결정을 하지 않고, 생성물이 계약상 렌더 가능한지와 catalog 계약을 지키는지만 기계적으로 판정하기 위함
- 검증: `npx vitest run packages/validation/src/__tests__`, `npx tsc --noEmit --pretty false`, `npx biome check packages/validation`
- 후속: 실제 생성 DTO schema가 확정되면 `validateAgentResult`의 shape 검증을 해당 schema contract에 맞춰 좁힌다.

## 2026-05-27 - Renderer Naming Cleanup

- 변경: renderer public component/function 이름을 `RenderTreeView`, `RenderNodeView`, `renderJsonNode`로 정리하고 registry 타입을 `NodeRenderer`, `NodeRenderContext`, `NodeRendererDefinition`, `NodeRendererRegistry`로 변경함
- 변경: 내부 파일명을 `render-tree-view.tsx`, `node-renderer-registry.ts`, `node-kind-map.ts`, `default-node-renderers.tsx`, `props-from-catalog.ts`, `resolve-component.ts`로 변경함
- 이유: 렌더러가 JSON node tree를 React node tree로 변환한다는 흐름과 node renderer registry의 역할을 이름에서 드러내기 위함
- 검증: `npx tsc --noEmit --pretty false --skipLibCheck`, `npx biome check packages/renderer apps/web/src/components/screen/RenderedScreen.tsx docs/development/PROJECT_STRUCTURE.md AGENTS_HISTORY.md`
- 후속: `default-node-renderers.tsx`에 남아있는 renderer composite fallback을 `@cx/components` candidate component로 옮길지 검토한다.

## 2026-05-27 - Renderer Functional Directory Split

- 변경: `@cx/renderer` 내부를 `tree/`, `registry/`, `render/`, `nodes/`로 재배치해 RenderTree JSON 해석, renderer 연결표, 재귀 렌더 실행, 구조 node 렌더 정의의 책임을 분리함
- 변경: component catalog는 `nodes/component`에서 read-only resolver/prop adapter로만 소비하고, area renderer는 `nodes/area` 아래로 이동함
- 이유: 렌더러를 JSON node tree -> React node tree 변환 책임으로 제한하고 component/pattern CRUD 및 선택 책임이 섞이지 않게 하기 위함
- 검증: `npx tsc --noEmit --pretty false --skipLibCheck`, `npx biome check packages/renderer`
- 후속: `nodes/default-node-definitions.tsx`를 layout/component/fallback 단위로 더 쪼개고 renderer smoke fixture 테스트를 추가한다.

## 2026-05-27 - Master Plan Direction Document Restore

- 변경: `MASTER_PLAN.md`를 제품 방향성, 핵심 원칙, 목표 흐름, 고도화 순서 중심의 루트 전역 문서로 다시 추가함
- 변경: `AGENTS.md`와 `AGENTS_HISTORY.md`의 전역 문서 목록과 Product Planner/QA 기준 문서 참조를 `MASTER_PLAN.md`에 맞게 갱신함
- 이유: 상세 구현 책임은 `PROJECT_STRUCTURE.md`와 패키지 README에 두고, 장기 고도화 방향은 별도 마스터 플랜에서 일관되게 관리하기 위함
- 검증: `npx biome check MASTER_PLAN.md AGENTS.md AGENTS_HISTORY.md`
- 후속: 새 생성 과정이 구체화되면 `MASTER_PLAN.md`에는 방향과 완료 기준만 갱신하고 상세 타입/API는 책임 문서에 둔다.

## 2026-05-27 - Orchestration Validation Pipeline Boundary Allocation

- 변경: `packages/orchestration`의 `@cx/orchestration` 패키지를 추가하고 root, `./contract`, `./types` public subpath를 할당함
- 변경: `packages/validation`의 `@cx/validation` 패키지를 추가하고 root, `./contract`, `./types` public subpath를 할당함
- 변경: `packages/pipline` 오타를 `packages/pipeline` / `@cx/pipeline`으로 정정하고 side effect boundary가 순수 orchestration과 validation rule 판정을 소유하지 않도록 contract를 갱신함
- 변경: `@cx/pipeline` contract를 `side-effect-conveyor-belt`로 명시하고 승인된 side effect 명령 전달/결과 회수 책임만 갖도록 정리함
- 변경: `AGENTS.md`와 `docs/development/PROJECT_STRUCTURE.md`에 orchestration, validation, pipeline 책임 경계를 기록함
- 이유: 순수 업무 흐름 정의, 순수 검증, 실제 side effect 실행을 서로 다른 패키지 경계로 분리하기 위함
- 검증: `npx vitest run packages/orchestration/src/__tests__ packages/validation/src/__tests__ packages/pipeline/src/__tests__`, `npx tsc --noEmit --pretty false`, `npx biome check packages/orchestration packages/validation packages/pipeline AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md`
- 후속: 실제 stage builder, validation rule, side effect runner 구현은 각 패키지 contract를 기준으로 후속 세션에서 추가한다.

## 2026-05-27 - Pipline Side Effect Package Allocation

- 변경: `packages/pipline`에 `@cx/pipline` 패키지를 추가하고 root, `./contract`, `./types` public subpath를 할당함
- 변경: side effect boundary contract와 public result/type 표면을 추가하고 README/프로젝트 구조/운영 문서에 책임 경계를 기록함
- 이유: 생성 산출물 파일 반영, 승인 반영, CLI 실행 등 side effect 책임을 Claude 실행, renderer, catalog 소유 책임과 분리하기 위함
- 검증: `npx vitest run packages/pipline/src/__tests__`, `npx tsc --noEmit --pretty false`, `npx biome check packages/pipline AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md`
- 후속: 실제 파일 쓰기와 승인 반영은 생성 계약이 확정된 뒤 `@cx/pipline` contract를 기준으로 추가한다.

## 2026-05-27 - Layout Package Public Boundary

- 변경: `@cx/layout`에 `src/public/chrome.ts`, `src/public/primitives.ts`, `src/public/style.ts`, `src/public/types.ts`, `src/public/contract.ts` 공개 표면을 추가함
- 변경: spacing/className helper 구현을 `src/internal/style.ts`로 이동하고, `@cx/layout/primitives`는 `Flex`, `Grid`만 노출하도록 축소함
- 변경: renderer의 layout helper import를 `@cx/layout/primitives`에서 `@cx/layout/style`로 전환함
- 변경: layout DTO guard(`isFlexLayoutProps`, `isGridLayoutProps`, `isScreenRegionNode`, `isScreenNode`)와 public API 테스트를 추가하고 README/프로젝트 구조 문서에 public/internal 경계를 기록함
- 이유: layout runtime 패키지도 외부 계약과 내부 구현을 분리하되, catalog 패키지와 달리 CRUD가 아니라 component/type/guard/style helper 중심 공개 API로 관리하기 위함
- 검증: `npx vitest run packages/layout/src/__tests__`, `npx tsc --noEmit --pretty false`, `npx biome check packages/layout packages/renderer/src/default-renderers.tsx packages/renderer/src/renderers/area docs/development/PROJECT_STRUCTURE.md`, `npx tsx -e 'import("@cx/layout/internal/style").catch((error) => console.log(error.code ?? error.name))'`
- 후속: renderer area layout helper가 더 커지면 `@cx/layout/style`의 공개 함수 범위를 재검토한다.

## 2026-05-27 - Layout Pattern Store CRUD API

- 변경: `@cx/layout-pattern-store` package exports를 루트 catalog API, `./resolver`, `./mutations`, `./types` 명시 subpath로 재정리함
- 변경: `@cx/layout-pattern-store`에 `createLayoutPattern`, `readLayoutPattern`, `updateLayoutPattern`, `deleteLayoutPattern`, `upsertLayoutPattern` 순수 CRUD API를 추가함
- 변경: CRUD 입력/결과/issue/change 타입을 `src/public/types.ts`에 추가하고, 내부 구현은 `src/internal/mutations.ts`로 분리함
- 변경: layout pattern schema가 kebab-case id, non-empty variants, defaultVariant 존재, non-empty matcher, store-level duplicate id를 검증하도록 보강함
- 변경: README에 CRUD API가 `PatternStore`를 입력받아 새 store와 change envelope를 반환하며 파일 쓰기는 하지 않는다는 공개 계약과 schema contract를 기록함
- 변경: CRUD mutation test와 schema validation test를 별도 파일로 추가함
- 이유: 외부와 내부의 pattern catalog 입출력 계약을 하나로 관리하되, JSON 파일 반영과 승인 workflow side effect는 패키지 바깥에 두기 위함
- 검증: `pnpm vitest run packages/layout-pattern-store/src/__tests__`, `npx tsc --noEmit --pretty false`, `npx biome check packages/layout-pattern-store`
- 후속: 파일 반영이 필요해지면 이 CRUD 결과를 소비하는 별도 CLI나 pipeline 단계에서 처리한다.

## 2026-05-27 - Component Package Structure Split

- 변경: `packages/component/src/components/`로 정본 component 구현을 이동하고, candidate 구현 위치로 `packages/component/src/candidates/`를 추가함
- 변경: `packages/component/src/public/`에 catalog read API, CRUD mutation API, public 타입을 두고 `packages/component/src/internal/`에 stable/candidate registry 조립, public catalog assembly, audit, mutation 구현을 분리함
- 변경: `@cx/components/mutations`, `@cx/components/resolver`, `@cx/components/types` public subpath를 추가하고 resolver에는 component alias/type/prop lookup helper를 분리함
- 변경: `@cx/components/catalog` package export를 `src/catalog.ts` compatibility barrel로 연결하고, 기존 `src/catalog-types.ts`는 compatibility re-export로 유지함
- 변경: `create/read/update/delete/upsert/promoteComponentCatalogEntry` 순수 CRUD API를 추가하고, mutation 결과가 새 registry와 status-free public catalog를 반환하도록 함
- 변경: public catalog가 내부 status metadata를 노출하지 않는지, enum prop values, CRUD purity, candidate subpath 비노출을 검증하는 테스트를 추가함
- 변경: `docs/development/PROJECT_STRUCTURE.md`에 `@cx/components` 디렉토리 책임과 public import 경계를 추가함
- 이유: 외부 소비자는 하나의 component vocabulary만 사용하고, stable component와 candidate status는 패키지 내부 구현 경계로만 관리하기 위함
- 검증: `npx vitest run packages/component/src/__tests__`, `npx biome check packages/component docs/development/PROJECT_STRUCTURE.md AGENTS_HISTORY.md`(기존 `Checkbox.module.css` specificity warning만 남음), `npx tsc --noEmit --pretty false --incremental false`, `npx tsx -e 'Promise.all([import("@cx/components/catalog"), import("@cx/components/resolver"), import("@cx/components/mutations")]).then(([c,r,m]) => { if (!c.componentCatalog.Button) throw new Error("missing Button"); if (r.getComponentCatalogEntry("button")?.type !== "Button") throw new Error("alias failed"); if (typeof m.createComponentCatalogEntry !== "function") throw new Error("missing mutation"); console.log(Object.keys(c.componentCatalog).length); })'`
- 후속: 실제 candidate 구현이 생기면 `src/internal/candidate-entries.ts`에 등록하고 public catalog에는 status가 새지 않는지 유지한다.

## 2026-05-27 - Layout Pattern Store Rename

- 변경: `packages/pattern-store`를 `packages/layout-pattern-store`로 옮기고 패키지명을 `@cx/layout-pattern-store`로 변경함
- 변경: 공개 API를 `src/index.ts`, `src/public/catalog.ts`, `src/public/resolver.ts`, `src/public/types.ts`로 분리하고 raw JSON import, zod schema, cache, matcher 구현을 `src/internal/`로 이동함
- 변경: package exports에서 `data`, `schema`, `store`, `resolver` 내부 subpath를 제거하고 루트와 `types`, catalog JSON만 외부 노출하도록 축소함
- 이유: layout pattern reference catalog임을 이름에서 명확히 하고, 외부 계약과 내부 구현의 결합을 줄이기 위함
- 검증: `pnpm vitest run packages/layout-pattern-store/src/__tests__/pattern-store.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/layout-pattern-store AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md`
- 후속: 새 소비자가 생기면 `@cx/layout-pattern-store` 루트 공개 API를 우선 사용하고 `src/internal/*` import는 금지한다.

## 2026-05-27 - Outdated Planning Docs Removal

- 변경: 오래된 책임 경계를 담고 있던 `MASTER_PLAN.md`, `docs/development/AGENT_MODULE_BOUNDARY.md`, `docs/development/DEVELOPMENT_ARCHITECTURE.md`, `docs/development/DATA_MAP.md`를 제거함
- 변경: `AGENTS.md`와 `AGENTS_HISTORY.md`의 최신 기준 문서 목록에서 제거된 문서 참조를 정리함
- 이유: 재설계 이후 제거된 `@cx/importer`, `@cx/types`, `@cx/workflow`와 `@cx/engine` projection 책임 설명이 남아 현재 책임 분리 기준과 충돌했기 때문
- 검증: 문서 참조 검색으로 제거된 최신 기준 링크가 남지 않는지 확인
- 후속: 제품 범위와 데이터 설계가 다시 필요해지면 현재 재설계 기준에 맞는 새 문서로 작성한다.

## 2026-05-27 - Renderer Package Rename

- 변경: `packages/engine` / `@cx/engine`을 `packages/renderer` / `@cx/renderer`로 이름 변경하고 앱 import, Next transpile package, workspace lockfile, 운영/프로젝트 구조 문서의 현재 기준 참조를 갱신함
- 이유: MVP 경계에서 해당 패키지를 생성/오케스트레이션 엔진이 아니라 RenderTree JSON -> React render 전용 런타임으로 명확히 부르기 위함
- 검증: `npx biome check apps/web/src/components/App.tsx apps/web/src/components/screen/RenderedScreen.tsx apps/web/package.json apps/web/next.config.ts packages/renderer AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md docs/development/mock-schemas/generation-v2/04-preview.mock.json package-lock.json`, `node -e "const fs=require('fs'); console.log(fs.readlinkSync('node_modules/@cx/renderer')); console.log(fs.existsSync('packages/renderer/package.json'))"`; 전체 `npx tsc --noEmit --pretty false`는 기존 `packages/layout-pattern-store` 누락 import로 실패함
- 후속: MVP 생성 흐름 계획 시 `@cx/pipeline` 패키지를 신설하고 SourceSpec DTO parser/adapter와 Claude generation orchestration의 책임을 분리한다.

## 2026-05-27 - Pattern Store Package Restore

- 변경: 삭제됐던 `packages/pattern-store`를 복구하고 `@cx/types` 의존 없이 내부 `types.ts`와 `schema.ts`가 pattern/preset/ref 계약과 zod 검증을 직접 소유하도록 정리함
- 변경: `@cx/pattern-store`의 package dependency를 `@cx/components`, `zod`로 축소하고 README/운영 문서에 package-local schema/type 경계를 기록함
- 이유: layout pattern reference catalog는 생성 재설계 중에도 공급 데이터 어휘로 필요하지만, 제거된 공유 타입 패키지를 되살리지 않기 위함
- 검증: `pnpm vitest run packages/pattern-store/src/__tests__/pattern-store.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/pattern-store AGENTS.md AGENTS_HISTORY.md docs/development/PROJECT_STRUCTURE.md docs/development/DEVELOPMENT_ARCHITECTURE.md docs/development/DATA_MAP.md`
- 후속: 새 생성 과정에서 pattern ref 소비자가 생기면 `@cx/pattern-store` 공개 API만 주입하고 engine이 직접 import하지 않는 경계를 유지한다.

## 2026-05-27 - Token Package Public Boundary

- 변경: `@cx/tokens`의 공개 export를 `@cx/tokens`, `@cx/tokens/variables.css`, `@cx/tokens/tailwind.css`로 정의하고 `packages/token/README.md`에 공개/내부 경계를 문서화함
- 변경: foundation/semantic token CSS와 TS 상수를 `packages/token/src/generated/`로 이동하고, `packages/component/src/tokens`에는 `--skt-component-*` alias와 component token 상수만 남김
- 변경: `apps/web`이 Tailwind token utility를 소비할 수 있도록 `@cx/components/tailwind.css`를 global CSS에 추가함
- 이유: token 원천과 component token alias가 한 패키지에 섞이지 않게 하고, generated/internal 파일의 직접 import를 막기 위함
- 검증: `npx vitest run packages/component/src/__tests__/components.test.tsx`, `npx tsc --noEmit --pretty false`, `npx biome check packages/token packages/component/src/tokens packages/component/src/__tests__/components.test.tsx apps/web/src/app/globals.css docs/development/PROJECT_STRUCTURE.md docs/development/DEVELOPMENT_ARCHITECTURE.md AGENTS.md AGENTS_HISTORY.md`
- 후속: 실제 token generator를 추가할 때 `packages/token/src/internal`에서 source import, normalize, validate, write 단계를 구현한다.

## 2026-05-27 - Component Package Public Contract

- 변경: `packages/component/README.md`를 추가해 `@cx/components` 외부 사용법, 단일 catalog 공개 원칙, `components`/`candidates`/`type`/`catalog`/`tokens`/`__tests__` 디렉토리 책임을 명시함
- 변경: catalog 외부 공개 shape는 `stable | candidate` status를 숨기고 props, variants, usage context, AI-writable surface만 제공해야 한다는 기준을 기록함
- 변경: `docs/design/COMPOSITION_LAYERS.md`의 기존 `RQR` candidate naming 규칙을 제거하고 `candidate -> stable` status 승격 기준으로 정리함
- 이유: 정본 컴포넌트와 후보 컴포넌트를 패키지 내부 status로만 관리하고, 외부 소비자는 단일 component vocabulary만 사용하게 하기 위함
- 검증: `sed -n '1,240p' packages/component/README.md`, `sed -n '20,34p' docs/design/COMPOSITION_LAYERS.md`, `rg -n "RQR|rqr" docs/design/COMPOSITION_LAYERS.md packages/component/README.md` 결과 없음, `npx biome check packages/component/README.md`는 markdown ignore 설정으로 처리 대상 없음 확인
- 후속: 실제 디렉토리 재배치 시 README 기준에 맞춰 catalog 조립 테스트와 candidate 비노출 테스트를 추가한다.

## 2026-05-27 - Claude Agent Package Boundary

- 변경: `packages/agent`를 Claude Agent SDK local-first 실행 adapter 패키지로 다시 추가하고 README에 디렉토리 책임과 public adapter 호출 경계를 기록함
- 변경: `@cx/agent/adapters`에 web 서버/API route와 CLI 스크립트가 공유할 `runAgentQuery` 진입점을 추가함
- 변경: Codex 기반 검수 runner 기준을 폐기하고 생성/검수 모두 Claude 기반으로 문서 기준을 정리함
- 이유: 재설계된 agent 패키지의 책임을 AI 실행, prompt/session/result adapter로 제한하고 web 버튼과 script 쿼리의 호출 shape를 통일하기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx vitest run packages/agent/src/__tests__`, `npx biome check packages/agent AGENTS_HISTORY.md`
- 후속: Claude Agent SDK 실제 runner와 `packages/types/contract` 기반 입출력 타입을 연결한다.

## 2026-05-27 - Web App Consumer Reset

- 변경: `apps/web/src/data`, `apps/web/src/model`, `apps/web/src/server`, `apps/web/src/app/api`, `apps/web/src/adapters`를 제거함
- 변경: 앱의 workbench/agent navigation UI를 제거하고, `App`은 RenderTree JSON을 소비해 렌더하는 화면만 남김
- 변경: 사용하지 않는 `zustand`, `zod`, Radix scroll-area/tabs 의존성을 제거함
- 이유: 앱은 생성/검수/저장/API 재배선 없이 순수 소비 계층으로만 두기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx biome check apps/web/src package.json apps/web/package.json packages/engine/src packages/component/src/catalog.ts packages/component/src/catalog-types.ts packages/layout/src`
- 후속: 새 생성 과정이 확정되면 앱은 완성된 RenderTree JSON 또는 그에 준하는 소비 DTO만 입력받는다.

## 2026-05-27 - Redesign Package Reset

- 변경: `packages/agent`, `packages/importer`, `packages/types`, `packages/workflow`, `packages/pattern-store`를 제거함
- 변경: `@cx/engine` public surface를 RenderTree JSON -> React render 런타임으로 축소하고, table projection/schema validation/materializer export를 제거함
- 변경: workbench는 재설계 기간 동안 앱 내부 mock/local table shape와 간단한 local projection으로 preview 데이터를 만든다
- 이유: 전체 생성 과정을 다시 설계하기 위해 old business pipeline과 공유 타입 패키지 결합을 걷어내고, renderer만 남긴 얇은 기준면을 만들기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx biome check apps/web/src/adapters/tables-to-render-tree.ts apps/web/src/data/workbench-data-builder.ts apps/web/src/data/local-workbench-data-loader.ts apps/web/src/model/store.ts apps/web/src/server/agent/generate-draft-tables.ts apps/web/src/server/agent/promote-ai-import.ts packages/engine/src packages/component/src/catalog.ts packages/component/src/catalog-types.ts packages/layout/src`
- 후속: 새 생성 과정이 확정되면 mock schema를 기준으로 신규 패키지 경계를 다시 만든다.

## 2026-05-27 - Types Contract Directory Split

- 변경: `@cx/types`의 실제 계약 파일을 `src/contracts/*`로 이동하고 `src/contracts/index.ts`를 중앙 contract barrel로 추가함
- 변경: `src/fixtures/index.ts` fixture 전용 barrel을 추가하고, 기존 `@cx/types/*` subpath는 root-level compatibility re-export로 유지함
- 이유: 공유 계약과 테스트/샘플 fixture의 공개 경계를 분리하면서 현재 `@cx/types/render-tree` 같은 소비 import를 깨지 않기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx vitest run packages/engine/src/__tests__/schema-runtime.test.ts packages/engine/src/__tests__/render-tree-projection.test.ts packages/workflow/src/__tests__/quality-report.test.ts packages/importer/src/__tests__/register-prdd.test.ts`, `npx biome check packages/types packages/importer/src/prdd/index.ts packages/types/README.md docs/development/PROJECT_STRUCTURE.md AGENTS_HISTORY.md`
- 후속: fixture가 필요해질 때 `@cx/types/fixtures/*`에만 추가하고 root barrel에는 재수출하지 않는다.

## 2026-05-27 - Business Flow Simplification

- 변경: 제품/문서 기준 흐름을 `명세 -> 품질 검수 -> 미리보기 -> 반영` 4단계로 정리하고, `DraftTables`, `QualityReport`, `QualityBacklog`, `Promote`는 내부 구현 산출물 이름으로 내림
- 변경: deterministic 비즈니스 흐름을 `@cx/workflow`로 이동하고, 비즈니스 단계별 공개 subpath `@cx/workflow/spec`, `@cx/workflow/inspection`, `@cx/workflow/apply`를 추가함
- 변경: `@cx/agent`는 Claude/Codex/Agent SDK local-first runner 같은 AI 작동 책임만 갖도록 public surface를 축소함
- 변경: PRDD parser/register/compose/decorate/materializer를 새 `@cx/importer` 패키지로 분리하고, `@cx/engine` public surface에서 `client-import`와 `materializer` export를 제거함
- 변경: workbench Agent 탭의 사용자-facing 문구를 Draft Tables 생성에서 Spec Inspection 중심으로 변경함
- 이유: 비즈니스 로직 설명을 사용자가 보는 4단계로 단순화하면서 deterministic workflow와 AI 실행 책임을 패키지 단위로 분리하기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx biome check packages/importer packages/workflow packages/engine/package.json packages/engine/src/index.ts apps/web/package.json apps/web/next.config.ts scripts/run-draft-tables.ts AGENTS.md MASTER_PLAN.md docs/development/DEVELOPMENT_ARCHITECTURE.md docs/development/PROJECT_STRUCTURE.md docs/development/AGENT_MODULE_BOUNDARY.md packages/workflow/README.md packages/workflow/AGENTS.md packages/importer/README.md packages/importer/AGENTS.md`, `npx vitest run packages/importer/src/__tests__/prdd-parser.test.ts packages/importer/src/__tests__/register-prdd-screen.test.ts packages/importer/src/__tests__/prdd-record-builder.test.ts packages/importer/src/__tests__/prdd-pipeline.test.ts packages/workflow/src/__tests__/quality-report.test.ts packages/workflow/src/__tests__/promote-database-tables.test.ts packages/engine/src/__tests__/render-tree-projection.test.ts packages/engine/src/__tests__/renderer.test.tsx packages/engine/src/__tests__/schema-runtime.test.ts`

## 2026-05-27 - Engine Boundary Split

- 변경: `packages/renderer`를 `packages/engine` / `@cx/engine`으로 변경하고 public surface를 `client-import`, `renderer`, `materializer` 세 영역으로 정리함
- 변경: PRDD markdown parser를 engine `client-import`로 이동하고, PRDD materializer/CRUD helper를 engine `materializer`로 분리함
- 변경: RenderTree, client import parse result, PRDD runtime tree 타입을 `@cx/types`로 이동하고 agent는 compatibility re-export만 유지함
- 이유: renderer 패키지가 projection/render/materialize/parser 책임을 함께 암시하던 상태를 engine 경계로 재정의하고, 타입 소유권을 `@cx/types`로 단일화하기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx vitest run packages/engine/src/__tests__/render-tree-projection.test.ts packages/engine/src/__tests__/renderer.test.tsx packages/engine/src/__tests__/schema-runtime.test.ts packages/workflow/src/__tests__/prdd-parser.test.ts packages/workflow/src/__tests__/prdd-pipeline.test.ts`
- 후속: `NODE_TYPES`의 저장 계약과 render 구조 노드 상수 분리를 별도 라운드에서 진행

## 2026-05-27 - Remove Orphan Legacy Surfaces

- 변경: legacy asset pipeline, design-review, deck builder, Agent SDK runtime adapter, component-pattern-store, ai-deck/component-pattern 타입, legacy web registry view와 관련 fixture 산출물을 제거함
- 변경: AGT 탭은 client import upload와 Draft Tables 생성 패널만 남기고, 예전 Agent Registry preview/inspection 상태를 제거함
- 이유: active 생성 경로가 DraftTables/QualityReport/Preview/Promote로 좁혀진 뒤 참조되지 않는 코드와 public export가 남아 복잡도를 다시 키우고 있었기 때문
- 검증: 후속 타입체크/테스트에서 확인

## 2026-05-27 - Remove Experimental Composition Surface

- 변경: `database/client-imports/PRDD/variants/` 76개 deferred PRDD 파일, `docs/agents-history/2026-05.md`, `database/AI-COMPOSITION-SPEC.md`를 제거함
- 변경: `compose-screen`, `decorate-screen`, composition/decorated validator, `materialize-composition`, experimental pipeline, 관련 테스트와 `@cx/types`의 `composition-output`/`decorated-output`/`gap-report` export를 제거함
- 이유: 활성 생성 경로를 PRDD Draft Tables -> Quality Report/Backlog -> Preview/Promote로 좁히고, 사용하지 않는 2-stage composition 실험 표면과 문서 보관 비용을 줄이기 위함
- 검증: 후속 타입체크/테스트에서 확인

## 2026-05-27 - Product Summary Placeholder Values

- 변경: 상품 상세 핵심 요약 화면의 운영 테이블 샘플 표시값을 첨부 화면 기준으로 `iPhone 16 Pro`, `Apple / 스마트폰 / 월 50,000원`, `가입가능`, `혜택`, `T 우주패스 제휴 혜택 제공`으로 교체함
- 이유: `CardSummary`, `Badge`, `ListText`에 `{상품명}` 같은 PRDD 템플릿 placeholder가 그대로 노출되어 프리뷰 화면 품질을 떨어뜨렸기 때문
- 검증: `rg -n '\\{[^}]+\\}' database/tables`, `jq empty database/tables/components.json`, `pnpm exec biome check database/tables/components.json`

## 2026-05-27 - MBR Bottom ActionButton CTA

- 변경: `bottom-action-area` area pattern의 기대 component type을 일반 `button`에서 `action-button`으로 좁힘
- 변경: 기본 `component-action-button` composite pattern을 추가하고 MBR 하단 CTA인 `action-area-auth-confirm`, `action-area-join-done`, `action-area-complete-home`을 `ActionButton`으로 전환함
- 변경: 가입 완료/휴면 해제 완료 메시지 area는 `Screen.Contents`로 이동하고, `Screen.Bottom`에는 `ogn-mbr-join-actions`, `ogn-mbr-dormant-complete-actions` 액션 전용 area만 남김
- 이유: Bottom CTA는 고정 하단 rail 책임이므로 일반 콘텐츠 버튼과 분리하고, 결과/완료 메시지가 하단 CTA와 한 area에 섞이지 않도록 하기 위함
- 검증: `jq empty packages/pattern-store/src/catalog/area-patterns.json packages/pattern-store/src/catalog/composite-patterns.json database/tables/areas.json database/tables/components.json database/tables/screens.json`, 운영 테이블 FK/pattern 참조 검증 스크립트 `issueCount: 0`, MBR Bottom area 점검 결과 전부 `bottom-action-area` + `ActionButton`, `pnpm vitest run packages/pattern-store/src/__tests__/pattern-store.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec biome check packages/pattern-store/src/catalog/area-patterns.json packages/pattern-store/src/catalog/composite-patterns.json database/tables/areas.json database/tables/components.json database/tables/screens.json AGENTS_HISTORY.md docs/agents-history/2026-05.md`

## 2026-05-27 - MBR Auth Request Layout

- 변경: `auth-code-entry` area pattern을 추가하고 `ogn-mbr-auth-request`에 적용함
- 변경: 남은 시간 표시를 `text-field-auth-timer` 입력 필드에서 `list-text-auth-timer` 읽기 전용 `ListText` row로 전환함
- 변경: `button-auth-retry`를 `text-button-auth-retry` 보조 텍스트 액션으로 바꾸고, `action-area-auth-confirm`은 `ogn-mbr-auth-actions`를 통해 `Screen.Bottom` 단일 CTA로 이동함
- 이유: 인증수단 선택/인증번호 입력/타이머/보조 액션/주 CTA의 의미 계층이 섞여 화면에서 입력 불가능한 값이 인풋처럼 보이고 CTA가 중첩되어 보였기 때문
- 검증: `jq empty packages/pattern-store/src/catalog/area-patterns.json database/tables/areas.json database/tables/components.json database/tables/screens.json database/recovered/merged-current-mbr-tables/areas.json database/recovered/merged-current-mbr-tables/components.json database/recovered/merged-current-mbr-tables/screens.json`, 운영 테이블 FK/pattern 참조 검증 스크립트 `issueCount: 0`, `pnpm vitest run packages/pattern-store/src/__tests__/pattern-store.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec biome check packages/pattern-store/src/catalog/area-patterns.json database/tables/areas.json database/tables/components.json database/tables/screens.json database/recovered/merged-current-mbr-tables/areas.json database/recovered/merged-current-mbr-tables/components.json database/recovered/merged-current-mbr-tables/screens.json`

## 2026-05-27 - MBR AppBar Headers

- 변경: `NOVA-MBR-*` 53개 화면의 빈 `Screen.Header`에 화면별 `mbr-appbar-*` AppBar component를 추가함
- 변경: edge 화면의 AppBar title은 오류/상태 suffix를 제외한 기본 단계명으로 표시하도록 생성함
- 이유: 회원 가입/휴면 해제 MBR 플로우도 모바일 화면 상단에서 현재 단계와 뒤로가기 affordance를 제공해야 하기 때문
- 검증: `jq empty database/tables/screens.json database/tables/components.json database/recovered/merged-current-mbr-tables/screens.json database/recovered/merged-current-mbr-tables/components.json`, 운영 테이블 FK/pattern 참조 검증 스크립트 `issueCount: 0`, `pnpm vitest run packages/renderer/src/__tests__/render-tree-projection.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec biome check database/tables/screens.json database/tables/components.json database/recovered/merged-current-mbr-tables/screens.json database/recovered/merged-current-mbr-tables/components.json`

## 2026-05-27 - MBR Auth Method List Pattern

- 변경: `@cx/pattern-store` area catalog에 `auth-method-list` 패턴을 추가하고 `ogn-mbr-auth-select`에 적용함
- 변경: area renderer가 `listPresentation: "selection-list"` layout prop을 해석해 인증수단 ListCell 묶음을 bordered grouped list로 렌더링하도록 개선함
- 변경: 운영 테이블과 병합 후보본의 `ogn-mbr-auth-select.pattern.id`를 `auth-method-list`로 갱신하고 renderer 회귀 테스트를 추가함
- 이유: 인증수단 선택은 일반 목록보다 선택 가능한 방법 묶음의 의미가 강해 `list-stack`보다 전용 area pattern과 grouped list presentation이 적합하기 때문
- 검증: `pnpm vitest run packages/pattern-store/src/__tests__/pattern-store.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/render-tree-projection.test.ts`, `pnpm exec biome check packages/pattern-store/src/catalog/area-patterns.json packages/renderer/src/renderers/area/layout.tsx packages/renderer/src/renderers/area/types.ts packages/renderer/src/renderers/area/static.tsx packages/renderer/src/renderers/area/dynamic.tsx packages/renderer/src/validation.ts packages/renderer/src/__tests__/renderer.test.tsx database/tables/areas.json database/recovered/merged-current-mbr-tables/areas.json`
- 참고: `pnpm exec tsc --noEmit --pretty false` 통과 (stale `.tsbuildinfo` 정리 후 재실행, EXIT=0). 이전 기록의 `PrddScreenRecord.screen` 오류는 후속 simplification 커밋들에서 해소되어 더 이상 재현되지 않음

## 2026-05-27 - MBR Guardian Result Placement

- 변경: `NOVA-MBR-FP-001-0/E1/E2/E3`에서 `ogn-mbr-guardian-result`를 `Screen.Bottom`에서 `Screen.Contents`의 `ogn-mbr-guardian-input` 다음으로 이동함
- 이유: 법정대리인 동의 결과 확인은 고정 하단 CTA가 아니라 동의 요청 이후 상태/결과를 설명하는 콘텐츠 영역이기 때문
- 검증: `jq empty database/tables/screen_routes.json database/tables/screen_variants.json database/tables/screens.json database/tables/areas.json database/tables/components.json`, 운영 테이블 FK 검증 스크립트 `issueCount: 0`

## 2026-05-27 - MBR Tables Promote

- 변경: 복구한 예전 MBR 테이블과 현재 운영 테이블을 병합한 후보본을 `database/tables` 운영 테이블로 반영함
- 변경: 예전 MBR 데이터의 `area.children.kind: "composite"`를 현재 계약의 `component`로 정규화하고, 중복 component id `action-area-next`를 `action-area-next-member-input`으로 분리한 후보본을 사용함
- 이유: 상품 상세 현재 데이터와 회원 가입/휴면 해제 MBR 데이터가 ID 충돌 없이 병합 가능해 운영 workbench에서 함께 조회할 수 있게 하기 위함
- 검증: `jq empty database/tables/screen_routes.json database/tables/screen_variants.json database/tables/screens.json database/tables/areas.json database/tables/components.json`, 운영 테이블 FK/pattern 참조 검증 스크립트 `issueCount: 0`

## 2026-05-27 - Archetype Choice Becomes LLM Decision

- 변경: `packages/agent/src/compose-screen/scaffold.ts`에서 `ARCHETYPE_KEYWORDS` 가중치 매처와 `buildArchetypeScaffold()`를 제거하고, `ARCHETYPE_SCAFFOLD_CATALOG` + `lookupArchetypeScaffold` + `listArchetypeCatalog`만 남김
- 변경: `CompositionScreen`에 `archetypeChoice: { source, archetype, rationale, proposedScaffold? }` 필드를 추가. `source="catalog"`(reuse) 또는 `source="proposed"`(새 archetype 동봉) 둘 다 `rationale` 빈 문자열이면 Validator가 거부
- 변경: Compose 프롬프트가 archetype catalog 전체를 prior로 주입하고, `screen.archetype` 강제 일치와 catalog/propose 분기를 LLM이 직접 결정
- 변경: `checkArchetypeCompleteness`가 `output.screen.archetypeChoice` 기반으로 검증하도록 재작성 (archetype unknown / proposedScaffold missing / propose-conflict / rationale-required 코드 추가)
- 변경: `ValidatorDeps.archetypeScaffold` 제거, `compose-screen`이 더 이상 scaffold를 사전 빌드하지 않음
- 변경: `AGENTS.md` §3, `database/AI-COMPOSITION-SPEC.md` §1.4 라이프사이클을 LLM-driven archetype 모델로 갱신
- 이유: archetype 선택은 의미 추론이고, 문자열 키워드 가중치 매처는 메모리 룰의 "hardcoded switch 금지" 신호. parser와 materializer를 제외한 다른 결정론 영역을 점진적으로 LLM에 위임하는 방향의 첫 단계
- 검증: `pnpm vitest run` 170 tests pass, `pnpm tsc --noEmit` clean

## 2026-05-27 - Scaffold And Component Pattern Docs

- 변경: `AGENTS.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`에 archetype scaffold, componentPattern, layout pattern의 책임 경계를 명시함
- 변경: scaffold는 Compose 전 deterministic 화면 골격 계약이고, componentPattern은 scaffold block을 표현하는 재사용 semantic UI 조합이며, `@cx/pattern-store` layout pattern은 배치 recipe라는 구분을 문서화함
- 이유: 화면 제작 라이프사이클 설명에서 scaffold와 componentPattern의 위치가 구현 이력에는 있으나 기준 문서에는 한눈에 드러나지 않아 후속 Compose/Decorate 작업자가 경계를 혼동할 수 있었기 때문
- 검증: 문서 변경만 수행함

## 2026-05-27 - Preview Pipeline Always Runs

- 변경: `scripts/preview-pipeline-output.ts`가 저장된 `database/ai-imports/pipeline-smoke-output.json`을 읽지 않고, PRDD 원문과 generated deck을 읽어 `runPipeline`을 매번 실행하도록 전환함
- 변경: preview 실행 결과는 감사용 `database/ai-imports/pipeline-preview-output.json`에 기록하고, 기존 smoke 스크립트와 smoke 산출 JSON을 제거함
- 이유: scaffold/prompt/validator 코드가 바뀌어도 이전 smoke JSON을 재사용하면 현재 pipeline 품질을 확인할 수 없기 때문
- 검증: `pnpm exec biome check scripts/preview-pipeline-output.ts`

## 2026-05-27 - Coupon Component Surface

- 변경: `@cx/components`에 `Coupon` 혜택 카드 surface를 추가하고 component catalog/shared render kind에 `coupon`을 등록함
- 변경: `Local_Coupon`, `Coupon`, `coupon-benefit` alias를 추가해 Figma coupon layer를 실제 render component로 흡수함
- 변경: pattern-store의 `coupon-benefit-area`, `composite-coupon-benefit-card`에서 Coupon을 figma-only gap이 아니라 실제 expected child/component로 승격함
- 이유: 혜택브랜드 상세에서 쿠폰 블록은 상품성/혜택 affordance를 직접 드러내는 핵심 surface라 CardContentsFilled 조합 후보로만 두면 레퍼런스 대비 화면 밀도가 약해지기 때문
- 검증: `jq empty packages/pattern-store/src/catalog/*.json`, `pnpm build:decks`, `pnpm vitest run packages/component/src/__tests__/components.test.tsx packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/pattern-store/src/__tests__/pattern-store.test.ts`

## 2026-05-27 - Area Intent Display Boundary

- 변경: Composition materializer가 `area.intent`를 `metadata.title` 또는 `props.name`으로 자동 승격하지 않도록 분리함
- 변경: `CompositionArea.displayName?`을 명시 표시명 계약으로 추가해 section heading 노출 입력을 intent와 분리함
- 변경: area renderer가 `props.name`이 명시된 경우에만 영역 heading을 표시하고, `metadata.title`을 표시 텍스트 fallback으로 쓰지 않도록 수정함
- 변경: `area-app-bar`의 `hideTitle: true` layout prop projection을 테스트로 고정하고 preview/database tables를 재생성해 AppBar 상단 설명 문구 노출을 제거함
- 이유: intent는 AI/검수용 의미 메타데이터이고, 사용자에게 보이는 텍스트는 명시 표시 prop에서만 와야 하기 때문
- 검증: `pnpm vitest run packages/agent/src/__tests__/materialize-composition.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts`, `pnpm exec biome check packages/types/src/composition-output.ts packages/agent/src/compose-screen/schema.ts packages/agent/src/database/materialize-composition.ts packages/agent/src/__tests__/materialize-composition.test.ts packages/renderer/src/renderers/area/static.tsx packages/renderer/src/renderers/area/dynamic.tsx packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/render-tree-projection.test.ts`
- 참고: `pnpm exec tsc --noEmit --pretty false`는 기존 미추적 `scripts/run-pipeline-one.ts`의 타입 오류로 중단됨

## 2026-05-27 - OptionList Component Surface

- 변경: `@cx/components`에 `OptionList`를 추가해 기존 `OptionCard` 반복 선택 묶음을 실제 render component surface로 제공함
- 변경: component catalog와 shared render kind에 `option-list`를 추가하고, `Local_OptionList`/`OptionList` alias를 catalog에 등록함
- 변경: pattern-store의 `option-list-section-area`, `composite-option-list-stack`에서 OptionList를 figma-only gap이 아니라 실제 expected child/component로 승격함
- 이유: 단말기 상세의 색상/용량/배송/요금제 선택 섹션은 상세 화면 품질에 직접 영향을 주는 핵심 구조이며, 개별 `OptionCard`만으로는 Figma의 OptionList grouping 의미와 섹션 밀도를 충분히 보존하기 어렵기 때문
- 검증: `jq empty packages/pattern-store/src/catalog/*.json`, `pnpm build:decks`, `pnpm vitest run packages/component/src/__tests__/components.test.tsx packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/pattern-store/src/__tests__/pattern-store.test.ts`

## 2026-05-27 - Component Pattern Store Package

- 변경: reusable semantic UI block registry를 위한 `@cx/component-pattern-store` 패키지를 추가하고 registered/proposed componentPattern catalog 위치를 확정함
- 변경: catalog deck builder와 validator 기본 context가 없는 `database/component-patterns` 경로 대신 `@cx/component-pattern-store`를 직접 조회하도록 전환함
- 변경: `@cx/pattern-store`의 composite pattern은 componentPattern이 아니라 composite children layout recipe라는 경계를 문서화함
- 이유: componentPattern은 Compose의 재사용 UI 조합 계약이고 compositePattern은 Decorate/renderer의 layout recipe라서 같은 JSON으로 겸용하면 의미 계약과 배치 계약이 섞이기 때문
- 검증: `npm test -- packages/agent/src/__tests__/build-decks.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts`, `npx tsc --noEmit --pretty false`, `npm run build:decks`, `npx biome check --write AGENTS.md AGENTS_HISTORY.md database/AI-COMPOSITION-SPEC.md docs/agents-history/2026-05.md docs/development/DATA_MAP.md docs/development/DEVELOPMENT_ARCHITECTURE.md docs/development/PROJECT_STRUCTURE.md packages/agent/README.md packages/agent/package.json packages/agent/src/deck/build-catalog-deck.ts packages/agent/src/deck/build-decks.ts packages/agent/src/validate/rules/shared/deck-lookup.ts packages/component-pattern-store/package.json packages/component-pattern-store/README.md packages/component-pattern-store/src/index.ts packages/component-pattern-store/src/store.ts packages/component-pattern-store/src/catalog/registered.ts packages/component-pattern-store/src/catalog/proposed.ts package-lock.json`

## 2026-05-27 - RenderTree Responsibility Docs Sync

- 변경: 루트 `AGENTS.md`의 RenderTree Projection 책임 분리를 현재 `Register -> Composer -> Decorator -> Design Review -> Materializer -> @cx/renderer` 단계 흐름에 맞게 갱신함
- 변경: `packages/agent/AGENTS.md`에서 PRDD `header`/`contents`/`bottom` slot 분류는 Register 영역 번호 계약 책임이고, Composer는 Register가 만든 region 구조를 보존한다고 명시함
- 이유: 이전 문서가 AI가 `database/tables` 기본 row와 Screen region placement를 직접 보정하는 것처럼 읽혀 현재 agent pipeline 경계와 충돌했기 때문
- 검증: `rg -n "RenderTree Projection|AI가 직접|screen children" AGENTS.md packages/agent/AGENTS.md docs/development/DEVELOPMENT_ARCHITECTURE.md`

## 2026-05-27 - Supabase Skeleton Cleanup

- 변경: 당장 사용하지 않는 `supabase/migrations`, `supabase/seed` 골격 디렉토리의 tracked `.gitkeep` 파일을 제거함
- 변경: 현재 구조 문서와 env/biome 설정에서 Supabase 전용 디렉토리/환경변수/ignore 항목을 제거하고, 후속 저장소 계층은 `운영 DB/Storage` 표현으로 낮춤
- 이유: 현재 생성/렌더링 수직 슬라이스는 `database/*`, `@cx/pattern-store`, `@cx/agent`, `@cx/renderer` 중심으로 동작하며 Supabase 디렉토리는 실행 경로 없이 구조 노이즈만 만들기 때문
- 검증: `rg "supabase|Supabase"`로 현재 기준 문서/코드의 잔여 참조가 변경 이력뿐임을 확인

## 2026-05-27 - PRDD Base Screen Import Split

- 변경: `database/client-imports/PRDD/screen/`에는 `*-0.md` base 화면 17개만 남기고, `*-1.md`, `*-2.md`, `*-E*.md` 비-base 화면 76개를 `database/client-imports/PRDD/variants/`로 이동함
- 변경: 기본 생성은 base 화면만 입력으로 쓰고 variants 폴더는 명시적 variant/retry 생성용 deferred source로 취급하도록 PRDD README, database README, DATA_MAP, Claude register prompt를 갱신함
- 이유: 화면을 base 중심으로 제작해 토큰 사용량과 회귀 테스트 범위를 경제적으로 유지하기 위함
- 검증: `find database/client-imports/PRDD/screen -maxdepth 1 -type f ! -name '*-0.md'`, `find database/client-imports/PRDD/screen -maxdepth 1 -type f -name '*-0.md' | wc -l`, `find database/client-imports/PRDD/variants -maxdepth 1 -type f | wc -l`, `npm test -- packages/agent/src/__tests__/register-prdd-screen.test.ts packages/agent/src/__tests__/prdd-record-builder.test.ts`

## 2026-05-27 - Pattern Store Package Migration

- 변경: `database/pattern-store/*.json` 원천을 `packages/pattern-store/src/catalog/*.json`로 이동하고 `@cx/pattern-store` 패키지에 schema/store/resolver/barrel export를 추가함
- 변경: 모호한 정적 `pattern-index.json`은 제거하고, 필요한 요약 인덱스는 canonical catalog에서 `listPatternSummaries()`로 파생하도록 정리함
- 변경: `packages/agent`의 pattern schema/store는 호환 re-export로 낮추고, agent/web/deck/materializer가 `@cx/pattern-store` 공개 API를 사용하도록 정리함
- 변경: `@cx/renderer`는 option B 경계대로 `@cx/pattern-store`를 직접 import하지 않고 호출자가 주입한 `PatternStore` input만 해석한다는 문서 계약을 갱신함
- 이유: pattern store가 레이아웃 recipe 책임을 가진 공유 계약으로 커졌기 때문에 database reference 파일보다 패키지 API로 운영하는 편이 agent, web, deck builder, renderer injection 경계를 명확히 하기 때문
- 검증: `npm test -- packages/pattern-store/src/__tests__/pattern-store.test.ts packages/agent/src/__tests__/pattern-schema.test.ts packages/agent/src/__tests__/materialize-composition.test.ts packages/agent/src/__tests__/build-decks.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/pattern-store packages/agent/src/database/materialize-composition.ts packages/agent/src/pattern packages/agent/src/__tests__/pattern-schema.test.ts packages/agent/src/__tests__/materialize-composition.test.ts packages/agent/src/__tests__/build-decks.test.ts apps/web/src/data/pattern-store-loader.ts packages/component/src/catalog.ts database/README.md database/AI-COMPOSITION-SPEC.md docs/development/DEVELOPMENT_ARCHITECTURE.md docs/development/DATA_MAP.md docs/development/PROJECT_STRUCTURE.md MASTER_PLAN.md AGENTS.md packages/agent/README.md packages/agent/AGENTS.md`, `jq empty packages/pattern-store/src/catalog/*.json`, `npm run build:decks`

## 2026-05-27 - ButtonMore TextButton Absorption

- 변경: `TextButton` component catalog alias에 `ButtonMore`, `ButtonMoreProduct`, `button-more`, `button-more-product`를 추가해 Figma 더보기 레이어를 실제 render surface로 흡수함
- 변경: `product-more-link-area`, `rich-image-tab-area`, `composite-button-more-product-link` pattern metadata에서 ButtonMore 계열을 component gap이 아니라 `TextButton` alias/expected child로 정리함
- 이유: ButtonMore 계열은 독립 복합 컴포넌트라기보다 인라인 더보기 액션 surface라서 새 component를 늘리기보다 기존 `TextButton`으로 흡수하는 편이 component/composite 경계를 더 단단하게 지키기 때문
- 검증: `jq empty database/pattern-store/*.json`, `pnpm build:decks`, `pnpm vitest run packages/renderer/src/__tests__/component-catalog.test.ts packages/component/src/__tests__/components.test.tsx`, `pnpm vitest run packages/agent/src/__tests__/pattern-schema.test.ts`

## 2026-05-27 - PageStack Section Model Hardening

- 변경: `ChildWrapPreset`/pattern schema/design-review schema에 `titleMode`, `itemTemplate`, `slotInsetX`, `sectionGap`을 추가해 Figma Pagestack의 ContentsTitle hidden/visible, Card 0/Default 20 template, slot inset, section gap 힌트를 보존할 수 있게 함
- 변경: `PageStack` catalog props와 RenderTree projection/renderer를 확장해 region `childWrap`의 PageStack subtype 값이 실제 render props와 wrapper data attribute/title rendering으로 이어지게 함
- 변경: 대표 region pattern의 `childWrap`에 PageStack subtype 값을 채워 상세/리스트/카드 섹션 골격이 deck과 renderer에 더 명시적으로 전달되도록 함
- 이유: 컴포넌트를 추가해도 PageStack 섹션 rhythm과 title/template/slot 구조가 흐리면 레퍼런스 대비 화면 밀도가 계속 약해지기 때문
- 검증: `jq empty database/pattern-store/*.json`, `pnpm build:decks`, `pnpm vitest run packages/agent/src/__tests__/pattern-schema.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/types/src/pattern-store.ts packages/agent/src/pattern/pattern-schema.ts packages/agent/src/design-review/design-review-schema.ts packages/component/src/catalog.ts packages/renderer/src/validation.ts packages/renderer/src/render-tree-projection.ts packages/renderer/src/default-renderers.tsx packages/renderer/src/__tests__/render-tree-projection.test.ts database/pattern-store/region-patterns.json`

## 2026-05-26 - Filter Sorting Component Surface

- 변경: `@cx/components`에 `FilterSorting` 실제 render component를 추가하고 public export, component catalog, renderer shared kind(`filter-sorting`)에 연결함
- 변경: 리스트-카드 pattern metadata에서 `FilterSorting`을 figma-only gap에서 실제 component surface로 승격하고, chip/sort area와 product-list control composite 설명을 갱신함
- 이유: 카드 리스트 화면 상단의 결과 개수/필터/정렬 제어줄이 fallback이면 탐색 화면의 구조와 조작 affordance가 약해지기 때문
- 검증: `jq empty database/pattern-store/*.json`, `pnpm build:decks`, `pnpm vitest run packages/component/src/__tests__/components.test.tsx packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/agent/src/__tests__/pattern-schema.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/component/src/FilterSorting/FilterSorting.tsx packages/component/src/FilterSorting/FilterSorting.module.css packages/component/src/FilterSorting/index.ts packages/component/src/index.ts packages/component/src/catalog.ts packages/types/src/component-catalog.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/component/src/__tests__/components.test.tsx database/pattern-store/area-patterns.json database/pattern-store/composite-patterns.json database/pattern-store/pattern-index.json`

## 2026-05-26 - Product List Card Component Surface

- 변경: `@cx/components`에 `ListProductHorizontal`, `ListProductRow` 실제 render component를 추가하고 public export, component catalog, renderer shared kind(`product-card`)에 연결함
- 변경: 리스트-카드 pattern metadata에서 `ListProductHorizontal`/`ListProductRow`를 figma-only gap에서 실제 component surface로 승격하고, 관련 area/composite/region 설명을 갱신함
- 이유: `Page (리스트-카드)` 패턴은 촘촘해졌지만 상품 카드 row가 fallback이면 화면 밀도가 레퍼런스보다 크게 떨어지기 때문
- 검증: `jq empty database/pattern-store/*.json`, `pnpm build:decks`, `pnpm vitest run packages/component/src/__tests__/components.test.tsx packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/agent/src/__tests__/pattern-schema.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/component/src/ListProductHorizontal/ListProductHorizontal.tsx packages/component/src/ListProductHorizontal/ListProductHorizontal.module.css packages/component/src/ListProductHorizontal/index.ts packages/component/src/ListProductRow/ListProductRow.tsx packages/component/src/ListProductRow/ListProductRow.module.css packages/component/src/ListProductRow/index.ts packages/component/src/index.ts packages/component/src/catalog.ts packages/types/src/component-catalog.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/component/src/__tests__/components.test.tsx database/pattern-store/area-patterns.json database/pattern-store/composite-patterns.json database/pattern-store/region-patterns.json database/pattern-store/pattern-index.json`

## 2026-05-26 - Figma Product Detail Subtype Pattern QA

- 변경: Figma `SKT GenUI Test 0514` `Page (상세-상품)` section(node `10069:97828`)의 구독상품/기프티콘/혜택브랜드/단말기 variants를 region/area/composite subtype별 pattern-store metadata로 보강함
- 변경: `price-accordion`, `delivery-info`, `rich-image-tab`, `product-more-link`, `option-list`, `coupon-benefit`, `map-store-list`, `brand-benefit-list`, `product-disclosure`, `bottom-cta` scaffold block 어휘를 추가하고, 상세 계열은 `commerce-detail`, 목록 계열은 `list-browse`로 유지되도록 회귀 테스트를 보강함
- 변경: `ButtonMore`, `ButtonMoreProduct`, `OptionList`, `Coupon`, `CardInfo`, `CardContentsLine`, `AccordionProductInfo` 등은 아직 독립 render component로 확정하지 않고 figma-only/component gap으로 추적함
- 이유: 기존 상세-상품 패턴이 큰 덩어리 중심이라 variant별 실제 화면 밀도와 섹션 차이를 Compose scaffold가 충분히 요구하기 어려웠기 때문
- 검증: `jq empty database/pattern-store/*.json`, `pnpm build:decks`, `pnpm vitest run packages/agent/src/__tests__/pattern-schema.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check database/pattern-store/screen-patterns.json database/pattern-store/region-patterns.json database/pattern-store/area-patterns.json database/pattern-store/composite-patterns.json database/pattern-store/pattern-index.json packages/agent/src/compose-screen/scaffold.ts packages/agent/src/compose-screen/schema.ts packages/agent/src/__tests__/compose-screen.test.ts packages/types/src/composition-output.ts packages/component/src/catalog.ts packages/component/src/index.ts packages/renderer/src/__tests__/component-catalog.test.ts`

## 2026-05-26 - Figma Card List Pattern Scaffold QA

- 변경: Figma `SKT GenUI Test 0514` `Page (리스트-카드)` section(node `9896:91122`)의 요금제/단말기/구독상품/혜택/부가서비스/인터넷 variants를 screen/region/area/composite layer별 pattern-store metadata로 보강함
- 변경: `card-list`, `product-list`, `product-list-group`, `product-list-horizontal`, `product-list-row` scaffold block 어휘를 추가하고, 카드형 상품 목록 계열이 `commerce-detail`로 오탐되지 않도록 list-browse keyword weighting과 테스트를 보강함
- 변경: `FilterSorting`, `ProductListGroup`, `ListProductHorizontal`, `ListProductRow`는 아직 실제 `@cx/components` export가 아니므로 pattern metadata의 figma-only/component gap으로만 추적하고, `StatusBar`는 기존 phone chrome 책임으로 계속 제외함
- 이유: 카드 리스트 계열의 화면 밀도를 chip/filter-sort/product card set/page-stack subtype별 scaffold로 끌어올리되, 실제 없는 component surface를 renderable component처럼 오인하지 않게 하기 위함
- 검증: `jq empty database/pattern-store/*.json`, `pnpm build:decks`, `pnpm vitest run packages/agent/src/__tests__/pattern-schema.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/component/src/__tests__/catalog-audit.test.ts packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check database/pattern-store/screen-patterns.json database/pattern-store/region-patterns.json database/pattern-store/area-patterns.json database/pattern-store/composite-patterns.json database/pattern-store/pattern-index.json packages/agent/src/compose-screen/scaffold.ts packages/agent/src/compose-screen/schema.ts packages/agent/src/__tests__/compose-screen.test.ts packages/types/src/composition-output.ts packages/component/src/catalog.ts packages/component/src/index.ts packages/renderer/src/__tests__/component-catalog.test.ts`

## 2026-05-26 - Design Foundation Deck Inclusion

- 변경: `DESIGN_FOUNDATION.md`를 `DesignDocumentId`와 design deck whitelist에 추가해 Compose/Decorate가 토큰·컬러·타이포그래피·radius·spacing 근거로 참조할 수 있게 함
- 이유: `LAYOUT_SPACING_CONTRACT.md`와 `COMPOSITION_LAYERS.md`가 `DESIGN_FOUNDATION.md`를 정식 token/foundation 원천으로 참조하므로 deck에서 제외하면 designRef 근거가 우회되기 때문
- 검증: `pnpm vitest run packages/agent/src/__tests__/build-decks.test.ts`, `pnpm build:decks`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Composition Validator Traceability Hardening

- 변경: Compose validator가 `sourceRefs[]` 내부의 screen/area/component 참조를 PRDD Screen Record와 대조하도록 보강함
- 변경: Decorate validator가 변경된 layoutPattern verification의 `originalDraft`가 Compose 원 draft와 동일한지, 변경 근거 `designRefs`가 design deck에 존재하는지 검증하도록 보강함
- 이유: source/design traceability가 필드 존재만으로 통과하면 LLM 산출물이 PRDD 근거와 Compose draft를 이름만 보존하고 실제로는 드리프트할 수 있기 때문
- 검증: `pnpm vitest run packages/agent/src/__tests__/validate-composition.test.ts`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Composition Validator Strictness Clarification

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 decision-level `designRefs[]`를 항상 필수로 두지 않고, high emphasis·재구성/합성 근거·decision-level layoutPatternDraft·모호 판단인 경우에만 hard requirement로 좁힘
- 변경: Decorate의 draft 보존 규칙은 layoutPatternDraft 변경 자체가 아니라 변경 사유/근거 누락이 hard error임을 명시함
- 이유: 모든 decision에 design reference를 요구하면 출력 크기와 재시도 비용이 커지고, draft 보정 가능성과 Validator 위반 조건이 모호해지기 때문
- 검증: `designRefs`, `design reference`, `draft 보존`, `draft 덮어쓰기` 관련 문서 검색으로 strictness 문구 확인

## 2026-05-26 - Composition Creative Freedom

- 변경: `database/AI-COMPOSITION-SPEC.md`의 Schema B에 `screen.strategy`, area `compositionAction`, `sourceRefs[]`, `visualIntent`, decision `emphasis`, synthetic area 추적 필드를 추가함
- 변경: Compose가 PRDD source area를 merge/split하거나 supporting area를 합성할 수 있도록 하되, 모든 재구성은 sourceRefs/designRefs/synthetic reason으로 추적하도록 Validator #1 규칙을 추가함
- 이유: AI가 PRDD row를 단순 배열하지 않고 화면 품질을 위해 섹션을 재구성하려면 자유도가 필요하지만, 원본 근거 추적성을 잃으면 검증과 리뷰가 불가능하기 때문
- 검증: Schema B 필드와 Validator #1 규칙에서 strategy/compositionAction/sourceRefs/visualIntent/emphasis/synthetic 참조 확인

## 2026-05-26 - Compose Owns Layout Draft

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 Compose가 `docs/design/` 기반 design deck과 layoutPatternStore deck을 입력받아 componentPattern뿐 아니라 layoutPattern 1차안까지 작성하도록 책임을 확장함
- 변경: Schema B에 `designDeckVersion`, `layoutPatternStoreDeckVersion`, `designRefs`, 필수 `layoutPatternDraft`를 추가하고, Validator #1이 screen/area layoutPattern draft와 design reference를 hard gate로 검증하도록 정리함
- 변경: Decorate는 layoutPattern 생성 주체가 아니라 Compose draft의 검증·보정 단계로 낮추고, Design Review도 검증·개선 patch 역할로 명확히 함
- 이유: 화면 품질을 Compose에서 1차로 끌어올리고, 후단 단계가 새 화면을 창작하지 않게 해야 PRDD 의도와 design 문서 근거가 초반 골격에 반영되기 때문
- 검증: `layoutPattern hint`, `Decorate.*결정`, `docs/design`, `layoutPatternDraft` 관련 문서 검색으로 책임 표현 확인

## 2026-05-26 - AI Composition Remaining Decisions

- 변경: `database/AI-COMPOSITION-SPEC.md`의 남은 결정 사항을 순차 확정함
- 변경: 자연어 필드는 raw 보존 + deterministic hint 병행, componentPattern dedupe는 `compositionDigest` + normalized intent로 시작, proposed→proposed componentPattern 참조는 v1 금지로 정리함
- 변경: catalog deck 위치를 `database/catalog/generated/`로 확정하고, `report-gap` 완전성 검증을 hard error로 승격함
- 변경: propose-pattern 승격, gap-report 큐 위치, LLM 호출 단위, 재시도 한도, area role enum 확장 기준을 운영 결정 사항으로 고정하고 다음 단계 순서를 타입/스키마 → deck → Validator → LLM 구현으로 재정렬함
- 이유: 남은 정책이 미정이면 Validator와 Agent runner 구현에서 같은 산출물을 서로 다르게 해석할 수 있기 때문
- 검증: `결정 필요`, catalog deck 위치, gap-report 완전성, 다음 단계 순서 관련 문서 검색으로 잔여 모호성 확인

## 2026-05-26 - AI Composition Pattern Terminology

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 Compose가 다루는 재사용 UI 조합을 `componentPattern`, Decorate가 다루는 배치 recipe를 `layoutPattern`/`layoutPatternStore`로 분리함
- 변경: Schema C 타입과 catalog deck 필드를 `ComponentPattern*`/`componentPatterns`로 갱신하고, Schema B decision 참조도 `componentPatternId`, `proposedComponentPatternId`, `layoutPatternHint`로 정리함
- 이유: component 조합 패턴과 layout pattern-store의 배치 패턴이 모두 `pattern`으로 불리면 Validator와 materializer 구현에서 서로 다른 책임을 같은 필드로 오해할 수 있기 때문
- 검증: 문서 내 `Pattern*`, `catalog.patterns`, `proposedPatterns`, `patternId`, `layoutHint` 잔여 참조 검색 후 의도된 mode 문자열/파일 경로만 남는지 확인

## 2026-05-26 - AI Composition Decision Schema

- 변경: `database/AI-COMPOSITION-SPEC.md`에 LLM #1 Compose의 주 산출물인 Schema B `CompositionOutput`/`CompositionDecision` 계약을 추가함
- 변경: 기존 Pattern Object와 Gap Report를 Schema C/D로 이동하고, Validator #1 규칙과 다음 단계의 Schema 참조를 A/B/C/D 기준으로 갱신함
- 이유: `composed.json`의 실제 shape가 비어 있으면 Validator와 후속 구현이 mode별 source/target/props/binding/gap 참조를 각자 해석하게 되기 때문
- 검증: 문서 내 Schema 번호, section 번호, `composed.json`, Validator #1, 다음 단계 참조 일치 확인

## 2026-05-26 - AI Composition Spec Register Boundary

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 LLM #1의 `Extract+Compose` 표현을 제거하고, deterministic Register가 Schema A(Extended Registered)를 만든 뒤 LLM #1 Compose가 semantic composition decision만 수행하도록 경계를 정리함
- 이유: PRDD 원문 보존과 파싱 책임을 LLM에 맡기면 같은 입력에서도 추출 결과가 흔들리고, 현재 파이프라인의 정보 손실 병목을 다시 만들 수 있기 때문
- 검증: 문서 내 파이프라인 다이어그램, 경계 규율, 다음 단계 항목의 책임 표현 일치 확인

## 2026-05-26 - Compose Placement Review

- 변경: Compose AI가 prop 보정뿐 아니라 잘못된 screen region 배치 후보를 `placements`로 제안하고, bottom에 들어온 비-system area를 contents로 재배치할 수 있도록 확장함
- 변경: deterministic Design Review의 bottom CTA 승격 조건에서 광범위한 `동의` label과 `apiCall` hook 단독 매칭을 제거함
- 이유: `법정대리인 동의 결과 확인` 같은 결과/상태 확인 area와 inline API 액션이 하단 CTA 영역으로 승격되면 화면 의미가 깨지기 때문
- 검증: `npm test -- --run packages/agent/src/__tests__/compose-assets-ai.test.ts packages/agent/src/__tests__/design-review-stage.test.ts`, `npx tsc --noEmit --incremental false`

## 2026-05-26 - Agent Artifact Cleanup

- 변경: 생성 파이프라인의 `client-import.parsed.json`, `client-import.validation.json`, `client-import.materialized.json` 출력을 제거하고 `agent-assets.*.json`만 AI import 산출물로 남기도록 정리함
- 변경: `database/ai-imports` 문서에서 deterministic parser 산출물 규칙을 제거함
- 이유: 현재 생성/검수/promotion 흐름의 실질 산출물은 `agent-assets.*.json`이며, `client-import.*.json`은 중복 staging 파일로 혼선을 만들기 때문
- 검증: `npx tsc --noEmit --incremental false`

## 2026-05-26 - Composition Materializer Area Preservation

- 변경: `materializeComposition`이 header/contents/bottom 모든 slot의 Compose area를 `DatabaseAreaRow`로 보존하고, screen region children은 component 직접 참조 대신 area 참조로 일관화함
- 변경: selection mode별 component type 추출을 switch 대신 `SELECTION_TYPE_READERS` 계약 테이블로 정리함
- 이유: Decorate가 검증한 area-level `finalLayoutPattern`이 materialized 화면 입력에서 사라지지 않게 하고, Compose/Decorate traceability를 화면 생성 단계까지 유지하기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/materialize-composition.test.ts packages/agent/src/__tests__/register-prdd-screen.test.ts packages/agent/src/__tests__/prdd-record-builder.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/validate-decorated.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/agent/src/database/materialize-composition.ts packages/agent/src/__tests__/materialize-composition.test.ts packages/agent/src/pipeline/run-pipeline.ts packages/agent/src/pipeline/index.ts scripts/pipeline-smoke.ts`

## 2026-05-26 - Commerce Detail Scaffold Vocabulary

- 변경: Figma `SKT GenUI Test 0514` fileKey `ovg86eZdOa16MRWkuQXY7s`, node `12449:8336`의 `Page (상세-정보입력)` 레이어를 확인해 상세/장바구니/결제 화면의 반복 block metadata를 scaffold 어휘에 반영함
- 변경: `commerce-detail` required block에 `price-summary`, `benefit-list`, `sticky-cta`를 추가하고 optional block에 `hero-media`, `option-grid`, `disclosure-list`를 추가함
- 변경: commerce PRDD resolver keyword를 상품/가격/판매/혜택 외 구독, 결제, 할인, 쿠폰, 장바구니, 주문, 배송, 옵션, 요금제, 선물가로 넓히고 오탐이 큰 `상세` 단독 키워드는 제거함
- 이유: deterministic scaffold가 Figma page metadata의 상품 sheet, 가격 요약, 혜택/할인 목록, 옵션 선택, 약관/유의사항, 하단 고정 CTA 구조를 수용하게 하기 위함
- 검증: `npx vitest run packages/agent/src/__tests__/compose-screen.test.ts`, `npx tsc --noEmit`

## 2026-05-26 - AI Context Deck SOT Boundary

- 변경: `database/catalog/generated/`를 `database/generated-decks/`로 리네임하고, 원천 catalog가 아니라 재생성 가능한 AI prompt/validation context deck 산출물로 문서화함
- 변경: `AI-COMPOSITION-SPEC.md`의 Build-time Decks 절을 AI Context Decks로 정리하고, `@cx/components/catalog`, `database/pattern-store`, `docs/design`, `@cx/tokens`, `@cx/layout`을 우선 SOT로 명시함
- 이유: 생성 과정에서 deck이 중간 병목이나 별도 SOT처럼 해석되는 것을 막고, deck은 LLM 입력용 요약 번들로만 취급하기 위함
- 검증: 문서 변경만 수행

## 2026-05-27 - Simplification Parallel Plan

- 변경: 생성 파이프라인 고도화를 유지하되 MVP active path를 `source -> draft tables -> validate -> preview -> quality report -> promote`로 단순화하는 병렬 실행 계획을 추가함
- 변경: `docs/development/SIMPLIFICATION_PARALLEL_PLAN.md`에 Active Pipeline, Quality Report, DraftTables Generator, Validation Collapse, Preview Feedback, Catalog Quality Loop, Documentation Boundary 작업선을 분리함
- 이유: 화면 제작 품질 향상에 직접 연결되지 않는 중간 표상과 검증 복잡도를 줄이고, 렌더 결과 기반 품질 개선 루프를 병렬로 빠르게 돌리기 위함
- 검증: 문서 변경만 수행함

## 2026-05-27 - Simplification Parallel Work Start

- 변경: `docs/development/AGENT_MODULE_BOUNDARY.md`를 추가해 `packages/agent` 모듈을 active/experimental/legacy로 분류함
- 변경: `@cx/types`에 `DraftTablesBundle`, `DraftTablesArtifact`, `QualityReport` v1 타입을 추가하고 package export를 연결함
- 변경: `@cx/agent`에 active path 진입점 `runDraftTablesPipeline`과 validation issue를 MVP quality category로 접는 `createQualityReport` adapter를 추가함
- 이유: 병렬 작업선이 공통으로 의존할 최소 계약과 active path 표면을 먼저 고정해, 생성 파이프라인 단순화와 품질 리포트 작업을 동시에 진행할 수 있게 하기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/quality-report.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/types/src/draft-tables.ts packages/types/src/quality-report.ts packages/types/src/index.ts packages/types/package.json packages/agent/src/pipeline/draft-tables-pipeline.ts packages/agent/src/pipeline/index.ts packages/agent/src/index.ts packages/agent/src/validate/quality-report.ts packages/agent/src/validate/index.ts packages/agent/src/__tests__/quality-report.test.ts packages/agent/package.json docs/development/SIMPLIFICATION_PARALLEL_PLAN.md docs/development/AGENT_MODULE_BOUNDARY.md`

## 2026-05-27 - Parser Reserved Area Slots

- 변경: `@cx/parser`가 PRDD 예약 영역 번호를 우선 해석하도록 보강함. `0`은 `screen.header`, `999`는 `screen.bottom` 대상 slotHint로 고정한다.
- 변경: 화면 구성 표에 예약 영역이 없고 컴포넌트 상세 표에만 `0`/`999`가 등장해도 SourceSpec `screen.areas`에 암묵 header/bottom area를 추가하도록 함
- 이유: 컴포넌트 상세 테이블의 `영역` 값이 화면 슬롯 의미를 갖는데, 텍스트 기반 추론만으로는 header/bottom 컴포넌트 대상이 흔들릴 수 있기 때문
- 검증: `npx vitest run packages/parser/src/__tests__/markdown.test.ts packages/schema/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npx biome check packages/parser packages/schema`, `npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md --run-id parser-reserved-areas --out-dir tmp/generation-runs/parser-reserved-areas`

## 2026-05-27 - Schema Public Subpaths

- 변경: `@cx/schema`에 artifact 계약별 공개 subpath를 추가하고, parser/orchestration/smoke 일부 소비 코드를 `@cx/schema/source-spec`, `@cx/schema/versions`로 좁힘
- 변경: `@cx/renderer`의 exported mutable `nodeRendererRegistry` singleton을 제거하고, 기본 registry는 내부 기본값으로 두되 필요한 경우 `registry`를 주입할 수 있게 조정함
- 이유: schema SSOT는 하나로 유지하면서도 소비 경계를 작게 만들고, 외부 패키지가 렌더러 전역 registry를 직접 변경하는 구조를 피하기 위함
- 검증: `npx tsc --noEmit --pretty false`, `npx vitest run packages/schema/src/__tests__/public-api.test.ts packages/parser/src/__tests__/markdown.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/validation/src/__tests__ packages/pipeline/src/__tests__/public-api.test.ts`, `npx biome check packages/schema packages/parser packages/orchestration packages/renderer apps/smoke AGENTS.md PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md`, `npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md --run-id schema-subpath-check --out-dir tmp/generation-runs/schema-subpath-check`

## 2026-05-26 - Decorator Vocabulary Retry Hints

- 변경: layoutPattern validator가 unknown/incompatible ID를 발견하면 node kind에 맞는 `suggestions[]` 후보를 issue data와 retry hint에 포함하도록 보강함
- 변경: Decorate retry prompt에 Layout Pattern Store와 Compose 원본 `layoutPatternDraft` 요약을 다시 주입해, 재시도 시 등록 ID 선택과 `originalDraft` 보존을 명확히 함
- 이유: Decorator가 `component-app-bar`, `app-bar-header`, `top-app-bar`처럼 계층이 다른 어휘나 미등록 ID를 오가던 문제를 validator feedback으로 수리 가능하게 만들기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/build-decks.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/validate-decorated.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/agent/src/validate/rules/shared/deck-lookup.ts packages/agent/src/validate/rules/decorate/layout-pattern.ts packages/agent/src/validate/rules/compose/layout-draft.ts packages/agent/src/validate/retry-hint.ts packages/agent/src/decorate-screen/build-prompt.ts packages/agent/src/decorate-screen/decorate-screen.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/decorate-screen.test.ts`

## 2026-05-26 - Pipeline Preview Renderability

- 변경: Composition materializer가 preview 산출 시 `component-fallback`, `screen-region-default`, 구식 `patternId/patternVariant` 없이 pattern-store의 구체 pattern ref와 `minRendererVersion`을 쓰도록 정리함
- 변경: preview script가 stale materialized 결과 대신 `PrddScreenRecord + CompositionOutput + DecoratedOutput`을 다시 materialize하고 smoke용 sample data를 props template에 주입하도록 보강함
- 변경: workbench pattern-store loader가 `variants[]`를 읽도록 하고, `Badge`를 renderer kind 계약에 추가해 preview render tree fallback을 0으로 만듦
- 이유: smoke 화면이 거의 비어 보이던 원인이 생성 의도 부족뿐 아니라 materialized table/engine 계약 불일치였기 때문
- 검증: `pnpm build:decks`, `pnpm tsx scripts/preview-pipeline-output.ts --overwrite`, `pnpm vitest run packages/agent/src/__tests__/materialize-composition.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Archetype Scaffold Contract

- 변경: Compose 앞단에 deterministic `Archetype Scaffold`를 추가해 PRDD 어휘 기반으로 `commerce-detail`, `form-entry`, `agreement-flow`, `confirmation`, `list-browse`, `support`, `generic-detail` 원형과 required/optional block 골격을 산출하도록 함
- 변경: Schema B `screen`에 `archetype`과 `completeness`를 추가하고, Compose prompt가 scaffold를 화면 골격 계약으로 받아 present/synthetic/missing/omitted block을 기록하도록 보강함
- 변경: Validator #1이 scaffold archetype 불일치, required block 미설명, 허용 범위 밖 synthetic block을 hard error로 검증하도록 추가함
- 이유: 화면별 수동 체크리스트 없이 다양한 화면의 최소 완성도를 끌어올리되, Compose가 모든 화면 장르 판단과 골격 생성을 혼자 떠안지 않게 하기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/materialize-composition.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/types/src/composition-output.ts packages/types/src/validation.ts packages/agent/src/compose-screen/build-prompt.ts packages/agent/src/compose-screen/compose-screen.ts packages/agent/src/compose-screen/index.ts packages/agent/src/compose-screen/scaffold.ts packages/agent/src/compose-screen/schema.ts packages/agent/src/validate/types.ts packages/agent/src/validate/validate-composition.ts packages/agent/src/validate/rules/compose/archetype-completeness.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/materialize-composition.test.ts database/AI-COMPOSITION-SPEC.md`

## 2026-05-26 - Design Review Contract Tables

- 변경: Design Review의 CTA 판정, operation dispatch, placement 처리, synthetic action area 생성을 contract table과 pattern-store reference로 분리함
- 변경: `action-stack`, `bottom-action-area` area pattern을 추가하고, createComponent pattern fallback을 pattern-store 조회로 전환함
- 이유: 신규 Design Review 기능 안에 판단값이 하드코딩되면 스키마/패턴 변경 때 코드 수정으로 번지는 문제를 막기 위함
- 검증: `jq empty database/pattern-store/area-patterns.json`, `npm test -- packages/agent/src/__tests__/design-review-schema.test.ts packages/agent/src/__tests__/design-review-stage.test.ts`, `npx biome check packages/agent/src/design-review database/pattern-store/area-patterns.json`, `npx tsc --noEmit`
- 후속: Design Review AI runner가 같은 contract table을 prompt/context로 참조하도록 연결

## 2026-05-26 - Design Review Apply Expansion

- 변경: `createComposite`가 `Layout.Flex` composite wrapper로 적용되고 materialize/render projection까지 nested children을 전달하도록 확장함
- 변경: region pattern update, destination placement, component catalog 기반 AI-writable prop 검증을 Design Review apply 단계에 추가함
- 변경: Pattern schema의 `childWrap` 타입을 정리하고 Design Review pattern draft를 normalized `variants/defaultVariant/resolution` 계약에 맞춤
- 이유: Design Review patch 스키마가 표현하는 다양한 디자인/패턴 보정을 deterministic apply/materialize 단계에서도 구조적으로 받기 위함
- 검증: `npm test -- packages/agent/src/__tests__/design-review-schema.test.ts packages/agent/src/__tests__/design-review-stage.test.ts packages/agent/src/__tests__/pattern-schema.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts`, `npm run lint`, `npx tsc --noEmit`
- 후속: `createNewPattern` proposal을 pattern-store 승인/반영 workflow와 연결

## 2026-05-26 - Design Review Schema

- 변경: Design Review patch 스키마를 추가하고 `moveComponent`, `updatePattern`, `createNewPattern`, `createComponent`, `createComposite`, `setDisplay`, `updateComponentProps` operation을 정의함
- 변경: `agent-assets.design-review.json`과 patch 적용 결과 `agent-assets.reviewed.json` 생성 단계를 파이프라인에 추가함
- 변경: 모든 finding/operation이 `docs/design/*` 근거를 `designReferences`로 반드시 포함하도록 강제함
- 이유: CTA 승격, state display, 새 component/composite/pattern 제안을 자유 RenderTree 생성이 아니라 제한된 디자인 품질 patch로 다루기 위함
- 검증: `npm test -- packages/agent/src/__tests__/design-review-schema.test.ts packages/agent/src/__tests__/design-review-stage.test.ts`, `npx tsc --noEmit`
- 후속: Design Review AI reviewer runner 추가와 `createComposite` materialization 고도화

## 2026-05-26 - Node Type Taxonomy

- 변경: `@cx/types`에 node type taxonomy 계약을 추가해 `screen.*`, `Screen.*`, `area.*`, layout/wrapper/system type을 분리함
- 변경: `Accordion`/`accordion`은 structural type이 아니라 component catalog type/alias로만 해석되도록 renderer mapping을 정리함
- 이유: 화면 surface, area behavior, component 구현 타입이 같은 `type` 문자열 아래 섞여 생성/검증 책임이 흐려지는 것을 막기 위함
- 검증: `npx tsc --noEmit`, `npm test -- packages/renderer/src/__tests__/schema-runtime.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts`
- 후속: component catalog의 실제 Accordion 구현/props 계약이 늘어나면 `Accordion` entry를 확장

## 2026-05-26 - Data Agent

- 변경: `tablesToRenderTree`/`tablesToRenderTrees` projection을 `apps/web` adapter에서 `@cx/renderer`의 `render-tree-projection.ts`로 이동하고, renderer가 table shape -> RenderTree DTO -> React render 책임을 갖도록 조정함
- 이유: RenderTree DTO를 만드는 책임과 React node로 소비하는 책임이 모두 renderer 경계에 있어야 앱 workbench가 생성/렌더링 파이프라인 중간 책임을 갖지 않기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, 관련 파일 `npx biome check`

## 2026-05-26 - Data Agent

- 변경: `@cx/renderer`의 public 입력 타입/API를 `WireframeNode` 계열에서 `RenderTreeNode`/`RenderTree`/`RenderTree*Renderer` 계열로 변경하고, render tree를 DB로 되돌리는 `renderTreeToTables` 역변환 adapter를 제거함
- 이유: render tree는 렌더러 입력 DTO여야 하며, 역변환 adapter가 남아 있으면 render tree가 저장/편집 원본처럼 사용될 수 있기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, `npx biome check`, `jq empty database/ai-imports/*.json database/tables/*.json database/pattern-store/*.json`

## 2026-05-26 - Data Agent

- 변경: `pattern-store` layout preset의 `props`를 `layoutProps`로 좁히고, `WireframeNode`를 저장/편집 관리 모델이 아니라 `@cx/renderer` 입력용 render projection DTO로 문서화함
- 이유: pattern-store가 leaf props처럼 보이면 DB leaf의 텍스트/상태/hook 책임과 layout preset 책임이 섞이고, WireframeNode를 중간 관리 원본으로 보면 DB -> render projection -> React 흐름이 불필요하게 길어지기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, `jq empty database/ai-imports/*.json database/tables/*.json database/pattern-store/*.json`

## 2026-05-26 - Data Agent

- 변경: `components.json` row를 component render row로 정리하고, `composite`는 2개 이상의 `@cx/components`가 결합된 wrapper 의미로만 남기도록 계약/코드/문서를 갱신함
- 이유: 일반 component row를 composite라고 부르면 합성 컴포넌트와 단일 컴포넌트 참조의 경계가 다시 흐려지기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, 관련 파일 `npx biome check`
