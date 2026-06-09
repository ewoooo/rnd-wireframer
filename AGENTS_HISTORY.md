# RND Screen Generator 에이전트 히스토리

## 1. 문서 책임

이 문서는 변경 이력만 기록한다.

아키텍처, 데이터, 에이전트 역할의 최신 기준은 `PACKAGE_MAP.md`, `AGENTS.md`와 세부 책임 문서를 참조한다.

`AGENTS.md`, `PACKAGE_MAP.md`, `AGENTS_HISTORY.md`는 루트 전역 문서로 유지한다. 세부 개발/데이터 문서는 `docs/` 아래에 두고, agent-facing 디자인 참조 정본은 `packages/agent/docs/skills/references/design/` 아래에 둔다.

| 주제          | 기준 문서                                                                        |
| ------------- | -------------------------------------------------------------------------------- |
| 패키지 관계망 | [PACKAGE_MAP.md](./PACKAGE_MAP.md)                                               |
| 에이전트 운영 | [AGENTS.md](./AGENTS.md)                                                         |
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
- 2026-06-08 감량 라운드: 5월 엔트리(154개)를 날짜별 한 줄 요약으로 축약(이유/검증/후속 제거)

## 4. 최근 엔트리

최근 주요 변경만 inline 유지한다.

## 2026-06-09 - RenderTree Table Layout Fallback Removal

- 변경: `renderTreeToTableGenerationResult()`가 area/component layout 누락 시 `layout.area.productHeroSummary`, `layout.composite.componentSectionMessage`로 의미 fallback하지 않고 projection 전에 layout 누락 에러를 내도록 변경함
- 이유: `@cx/adapters/table`이 layout 선택 책임을 갖거나 특정 의미 패턴을 임의 주입하지 않도록 패키지 경계를 지키기 위함
- 검증: `pnpm exec vitest run packages/adapters/src/__tests__/render-tree-to-table.test.ts`, `graphify update . --force`; 전체 `pnpm exec tsc --noEmit --pretty false --incremental false`는 기존 `packages/external` StaticImageData 타입 오류와 dirty `packages/renderer/src/adapters/resolve-component.tsx` 타입 오류로 실패함

## 2026-06-09 - New Screen Hook Split

- 변경: `use-new-screen-inference.ts`를 AppShell용 facade로 축소하고, run 목록/선택/localStorage는 `use-new-screen-runs.ts`, status polling/SSE/review artifact/action은 `use-new-screen-run-lifecycle.ts`로 분리함
- 변경: RenderTree artifact 판정과 run/source/status item 변환을 `model/new-screen-mappers.ts` 순수 helper로 이동함
- 이유: 새 화면 생성 feature hook 하나에 목록 관리, 실행 lifecycle, artifact 로드, 액션, mapper가 모두 섞여 있어 변경 단위와 테스트 가능성이 나빴기 때문
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run apps/web/src/feature/inference-new-screen/storage/new-screen-workbench-storage.test.ts apps/web/src/components/App.test.tsx`, `pnpm lint`, `git diff --check`, `graphify update .`

## 2026-06-09 - Inference New Screen Feature Move

- 변경: 새 화면 생성 프론트엔드 UI, hook, browser API client, local UI storage를 `apps/web/src/feature/inference-new-screen/` 아래로 이동함
- 변경: `NewScreenSourceItem`/`NewScreenRunItem` 타입을 feature-local `types.ts`로 분리해 API client가 UI component 파일을 import하지 않도록 정리함
- 이유: `/api/inference/*` 서버 표면은 유지하면서 새 화면 생성 UI 흐름을 workbench 공용 component/model/lib에서 분리하기 위함
- 검증: `rg`로 이전 import 경로 제거 확인, `pnpm exec vitest run apps/web/src/feature/inference-new-screen/storage/new-screen-workbench-storage.test.ts`, `pnpm exec vitest run apps/web/src/components/App.test.tsx`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm lint`, `graphify update .`

## 2026-06-09 - Headless Inference Server Surface

- 변경: 별도 생성 서버 앱을 새로 만들지 않고 `apps/web`의 `/api/inference/*`를 Web UI 없이 호출 가능한 공식 headless screen-generation 서버 표면으로 문서화함
- 변경: `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `API_ENDPOINTS.md`, `SCREEN_INFERENCE_ARCHITECTURE.md`에 headless client의 소비 경계와 standalone server 비목표를 반영함
- 이유: 현재 Next API 기반 서버 모드가 이미 source upload, job 생성, status/steps/events, artifact 조회, apply를 제공하므로 새 모노리스 서버를 중복 생성하지 않기 위함
- 검증: `rg -n "Headless|headless|standalone server|generator server|Browser-facing|Client App / Headless|/api/inference/\\*" PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md docs/development/API_ENDPOINTS.md docs/development/SCREEN_INFERENCE_ARCHITECTURE.md AGENTS_HISTORY.md`, `graphify update .`

## 2026-06-09 - New Screen Panel JobId Selection

- 변경: 새 화면 좌측 패널이 `/api/inference/sources` source 목록이 아니라 `/api/inference/runs` run 목록을 사용하고, 선택 key와 표시 단위를 `jobId` 기준으로 변경함
- 변경: 패널 목록에서 `data/client-imports/web-upload/**` source path를 직접 노출하지 않고 `screenId/title`, `jobId`, run status만 표시하도록 정리함
- 이유: 업로드 source 목록과 jobId 단위 렌더/리뷰 상태가 불일치하던 문제를 제거하고, 운영 기준 선택 단위를 `jobId`로 통일하기 위함
- 검증: `pnpm exec vitest run apps/web/src/lib/new-screen-workbench-storage.test.ts apps/web/src/components/App.test.tsx apps/web/src/lib/screen-inference-runs.test.ts apps/web/src/server/inference-runs.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm build`, Playwright DOM 확인

## 2026-06-09 - Inference JobId Run List

- 변경: `@cx/inference` artifact/job store에 job 목록 조회 계약을 추가하고 Web `/api/inference/runs`가 `job.json`과 기존 context artifacts를 조합해 jobId 기준 run row를 반환하도록 함
- 변경: run row는 별도 manifest 없이 `context/source-input.json`, `context/source-spec.json`, RenderTree/validation/quality/apply artifacts에서 화면명, source path, 산출물 존재 여부, applied 상태를 materialize한다.
- 이유: 새 화면 workbench의 선택/렌더 단위를 source path가 아니라 `jobId`로 통일하기 위한 데이터 라이프사이클 기반을 먼저 고정하기 위함
- 검증: `pnpm exec vitest run packages/inference/src/__tests__/artifact-store.test.ts packages/inference/src/__tests__/job-store.test.ts apps/web/src/lib/screen-inference-runs.test.ts apps/web/src/server/inference-runs.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm build`, `graphify update .`

## 2026-06-08 - Inference Deterministic Validation Scaffold

- 변경: `screen-generation@v1`에 `05-validation`, 조건부 `06-revision`, `07-validation-after-revision`, `08-quality` 순서를 추가하고 deterministic validation report를 `context/validation-report.json`에 저장하도록 함
- 변경: validation error가 있으면 revision을 1회만 실행하고, 재검증에도 error가 남으면 validation step 실패로 job을 닫는 최소 제어 필드를 `@cx/inference` step 계약에 추가함
- 변경: Web artifact/read/apply 경로를 최종 RenderTree 기준 `context/render-tree.json`, validation report 기준 `context/validation-report.json`, quality output 기준 `steps/08-quality/output.json`으로 갱신함
- 이유: Claude compose/revision 앞뒤에 deterministic guardrail을 넣되, 파이프라인과 worker 복잡도는 조건부 step과 built-in function scaffold 수준으로 제한하기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm lint`, `pnpm test`, `graphify update .`

## 2026-06-08 - Inference API Source File MVP

- 변경: deprecated screen-inference API route를 제거하고 source upload/list/run/status/events/artifacts/apply 호출을 `/api/inference/*`로 단일화함
- 변경: Web server boundary에 source file preparer를 추가해 `data/client-imports/**.md`를 읽고 `preparedSource.sourceSpec`, `context/source.raw.md`, `context/source-input.json`, `context/source-spec.json`을 생성하도록 함
- 이유: inference pipeline 순수성을 유지하면서 Web upload와 CLI source path 입력이 같은 `source.path` 계약을 쓰게 하기 위함
- 검증: `rg -n "/api/screen-inference|app/api/screen-inference|screen-inference/" apps packages docs AGENTS.md PACKAGE_MAP.md -S`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm test`

## 2026-06-08 - Deprecated Smoke Surface Removal

- 변경: deprecated smoke 실행/조회 표면인 root `smoke:*` scripts, `test:smoke:pipeline`, `scripts/smoke-pipeline.ts`, `scripts/generation/**`, `scripts/SMOKE.md`, smoke fixture/proposal helper, Web `/smoke` explorer와 `smoke-runs` reader를 제거함
- 변경: `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `AGENTS.md`, `packages/agent/docs/README.md`의 smoke 경계 설명을 `@cx/inference` 중심으로 정리함
- 이유: screen inference 검증과 실행은 deprecated smoke wrapper가 아니라 `@cx/inference` 패키지와 Web/API adapter 경계에서 수행해야 하기 때문
- 검증: `rg -n "smoke|Smoke|SMOKE" ... -g '!AGENTS_HISTORY.md'`로 source 참조 제거 확인
- 후속: source import/SourceSpec 생성 entrypoint는 smoke wrapper 없이 `@cx/inference` job input/API 경계 기준으로 정리한다.

## 2026-06-08 - Agent Skill Scaffold and Understand Skillset

- 변경: `packages/agent/docs/skills/design-skills/`를 스킬별 폴더 구조로 정리하고 각 스킬의 `references/` 폴더를 준비함
- 변경: SOT 기반 reference skill scaffold, Revise 단계 review skill scaffold, targeted revision skill scaffold를 추가함
- 변경: `@cx/agent`에 `understand.screen-intent` stage skillset resolver를 추가하고, `screen-intent` 단계에서 prompt/review skill frontmatter와 sourceRef/body를 bundle로 resolve하도록 함
- 변경: `@cx/inference` KnowledgeBase에 `stage-skillset` source를 추가하고 `screen-generation@v1`의 `02-screen-intent` step이 해당 skillset을 references로 읽도록 연결함
- 변경: `screen-intent` output contract에 `usedSkills`를 추가해 실제 사용한 skill 문서를 output/context artifact에서 확인할 수 있게 함
- 이유: Figma SOT를 후속 스킬 작성 전에 source-backed reference로 분리하고, Understand -> Compose -> Revise 추론 구조에서 디자인 판단/검수/수정 스킬을 단계별로 확장하기 위함
- 검증: SOT `manifest.json` 파일 JSON parse 확인, `packages/agent/src/__tests__/agent-runtime.test.ts`, `packages/schema/src/__tests__/public-api.test.ts`, `packages/inference/src/__tests__/knowledge-base.test.ts`, `packages/inference/src/__tests__/screen-generation-v1.test.ts`, `packages/inference/src/__tests__/screen-generation-e2e.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `git diff --check`
- 후속: 각 SOT node를 다시 조회해 evidence, component inventory, skill별 good/bad CompositionPlan 예시를 채우고 Compose/Revise skillset으로 확장한다.

## 2026-06-08 - Orphan Artifact Cleanup

- 변경: deprecated compose/decorate 기반 `database/ai-imports`, generated deck, table backup, `AI-COMPOSITION-SPEC.md`를 제거하고 database/readme/development 문서를 `@cx/inference` artifact 기준으로 갱신함
- 변경: Figma generated output과 외부 repo 경로를 쓰던 one-off assemble scripts를 제거하고, Biome가 local/generated artifact를 검사하지 않도록 include 범위를 정리함
- 변경: jsdom 테스트 환경에 `ResizeObserver` mock을 추가해 Puck 기반 App 테스트 import가 안정적으로 실행되도록 함
- 이유: inference/agent 리팩터 이후 활성 패키지 경계 밖에 남은 대형 후보 산출물과 오래된 지식 자산을 줄이기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run`, `pnpm lint`

## 2026-06-08 - Deprecated Inference Package Removal

- 변경: `@cx/pipeline`과 `@cx/inference-nodes` workspace package를 제거하고 root/app dependencies와 Next transpile 설정에서 제외함
- 변경: legacy `/api/screen-inference/*` route가 내부적으로 `@cx/inference` job/artifact/event store를 읽도록 전환하고, web progress stage metadata는 app-local compatibility 타입으로 축소함
- 변경: `scripts/smoke-pipeline.ts`/`scripts/generation` smoke harness를 `@cx/inference` runtime 기반으로 전환하고 smoke 문서와 패키지 경계 문서를 갱신함
- 이유: screen inference 실행, 상태, 이벤트, artifact, step orchestration 책임을 `@cx/inference`로 단일화하기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run apps/web/src/lib/screen-inference-events.test.ts apps/web/src/lib/screen-inference-run.test.ts scripts/generation/batch/run-batch.test.ts packages/inference/src/__tests__`

## 2026-06-08 - Type Package Removal

- 변경: dependency-free `isRecord` guard를 `@cx/schema` root export로 이동하고 기존 `@cx/types/guards` 소비처를 `@cx/schema`로 전환함
- 변경: `@cx/types` workspace package, package dependencies, lockfile 항목을 제거하고 활성 문서의 `@cx/types` 현재 패키지 언급을 정리함
- 이유: 별도 타입 전용 패키지와 schema 패키지의 계약 중복을 줄이고, 저장/전달 DTO 정본은 `@cx/schema`에 두되 legacy 타입을 무비판적으로 schema에 합치지 않기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/schema/src/__tests__/public-api.test.ts packages/layout/src/__tests__/layout-catalog.test.ts packages/validation/src/__tests__/validators.test.ts`

## 2026-06-08 - Agent Topology Refactor

- 변경: `@cx/agent`의 task별 `runner.ts`를 제거하고 각 task `index.ts`가 task definition 객체와 `createPrompt`만 직접 공개하도록 축소함
- 변경: runtime이 별도 `src/prompt` builder 없이 `task.createPrompt()`를 직접 호출하고, session 결정은 `src/claude/claude-session-policy.ts`로 단일화함
- 변경: 사용되지 않던 `src/session`, `src/result`, `src/inference-reference.ts` facade를 제거하고 root export가 `prompt-catalog`/`skill-catalog` resolver를 직접 re-export하도록 정리함
- 이유: task runner, prompt builder, session/result normalization 레이어가 실제 기능 없이 중복 구조를 만들던 상태를 줄이고, prompt/skill catalog 공개 표면을 명확히 하기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm vitest run packages/agent/src/__tests__ packages/inference/src/__tests__/knowledge-base.test.ts packages/inference/src/__tests__/screen-generation-v1.test.ts`, `pnpm exec biome check packages/agent packages/inference/src/__tests__/screen-generation-v1.test.ts AGENTS_HISTORY.md`

## 2026-06-08 - Agent Design Reference Move

- 변경: 기존 `docs/design/` 디자인 정본 8개 문서를 `packages/agent/docs/skills/references/design/`으로 이동하고, agent design reference README를 추가함
- 변경: `AGENTS.md`, 개발 문서, agent design-context/skill 문서, legacy inference planning 참조의 디자인 정본 경로를 새 위치로 갱신함
- 이유: 디자인 패턴 문서를 agent가 직접 참조하는 문서 자산으로 운영하고, `@cx/agent`의 prompt/skill/context 참조 구조 안에 모으기 위함
- 검증: `find packages/agent/docs/skills/references/design -maxdepth 1 -type f`, `test ! -e docs/design`, `rg -n "(^|[^/])docs/design/" . -S -g '!database/ai-imports/**' -g '!database/generated-decks/**' -g '!AGENTS_HISTORY.md'`

## 2026-06-08 - Agent Prompt Catalog Scaffold

- 변경: `@cx/agent` 문서 자산을 `docs/prompts/{prompt-id}.md`와 `docs/skills/`로 분리하고, prompt 파일명을 prompt id와 1:1로 맞춤
- 변경: `prompt-catalog`와 `skill-catalog` 모듈을 추가해 `resolvePromptCatalogForInference(id)`는 단일 prompt md를, `resolveSkillForInference(id)`는 skill set JSON 객체를 SSOT snapshot으로 반환하도록 정리함
- 변경: `@cx/agent/prompt-catalog`, `@cx/agent/skill-catalog` subpath와 root `AgentPromptCatalogId`/`AgentSkillId` 타입 공개 표면을 추가함
- 이유: 신규 `screen-generation@v1` inference pipeline step 정의가 prompt catalog id를 안정적으로 참조하고, `@cx/inference`는 owner resolver snapshot만 소비하게 하기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/agent-runtime.test.ts packages/inference/src/__tests__/knowledge-base.test.ts`

## 2026-06-08 - Inference Output Contract SSOT MVP

- 변경: `@cx/schema`에 `SsotObject`, `InferenceReference`, `OutputContractObject` 타입과 `resolveOutputContractForInference(id)` resolver를 추가함
- 변경: `@cx/inference` step 계약을 inline `output.schema` 대신 `output.contractRef` 기반으로 변경하고, `runStep`이 resolved output-contract SSOT로 raw output을 검증하도록 구현함
- 변경: `@cx/inference` KnowledgeBase MVP resolver와 `runInferenceJob` MVP worker를 추가해 `output-contract.json`을 step artifact로 저장함
- 변경: `@cx/components/catalog`, `@cx/layout/catalog`, `@cx/agent`, `@cx/tokens`에 inference용 owner resolver를 추가하고 `@cx/inference` KnowledgeBase registry에 연결함
- 변경: `ReferenceEnvelope` wrapper를 제거하고 `references.json`/`output-contract.json`이 owner `SsotObject`를 직접 저장하도록 단순화함
- 변경: `apps/web`에 thin `POST /api/inference`와 `GET /api/inference/:jobId/events` MVP route를 추가해 `@cx/inference` worker를 호출하도록 연결함
- 변경: generic JSON Schema validation helper를 `@cx/validation`에 추가하고 `@cx/inference`가 이를 사용하도록 경계를 맞춤
- 이유: inference package가 각 SSOT owner 내부 구조를 알지 않고 owner resolver가 반환한 객체 snapshot만 소비하게 하기 위함
- 검증: `pnpm -s exec tsc --noEmit --pretty false --incremental false`, `pnpm -s exec vitest run packages/schema/src/__tests__/public-api.test.ts packages/component/src/__tests__/catalog-public-contract.test.ts packages/layout/src/__tests__/layout-public-api.test.ts packages/agent/src/__tests__/agent-runtime.test.ts packages/token/src/__tests__/public-api.test.ts packages/validation/src/__tests__/validators.test.ts packages/inference/src/__tests__/knowledge-base.test.ts packages/inference/src/__tests__/run-step.test.ts packages/inference/src/__tests__/worker.test.ts packages/inference/src/__tests__/artifact-store.test.ts packages/inference/src/__tests__/context-store.test.ts packages/inference/src/__tests__/job-store.test.ts`, API smoke `POST /api/inference` + `GET /api/inference/:jobId/events`

## 2026-06-08 - Layout Catalog Consolidation

- 변경: `@cx/layout-pattern-store` 패키지를 제거하고 catalog, resolver, mutation helper, layout pattern component를 `@cx/layout`의 공개 subpath(`./catalog`, `./resolver`, `./mutations`, `./components`)로 통합함
- 변경: 기존 `@cx/layout` primitive 구현을 `packages/layout/src/components/primitives/`로 이동하고 layout pattern component를 `packages/layout/src/components/patterns/`로 이동함
- 변경: renderer, validation, pipeline의 layout catalog import를 `@cx/layout` 공개 API로 전환하고 관련 package dependency와 문서를 갱신함
- 이유: layout knowledge base의 SSOT를 `@cx/layout`으로 단일화하고 `@cx/layout-pattern-store` compatibility 패키지를 완전히 제거하기 위함
- 검증: `pnpm -s exec tsc --noEmit --pretty false --incremental false`, `pnpm -s exec vitest run packages/layout/src/__tests__/public-api.test.ts packages/layout/src/__tests__/layout-public-api.test.ts packages/layout/src/__tests__/layout-catalog.test.ts packages/layout/src/__tests__/layout-schema.test.ts packages/layout/src/__tests__/layout-mutations.test.ts packages/renderer/src/__tests__/layout-pattern-render.test.tsx packages/validation/src/__tests__/validators.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts`, `git diff --check`

## 2026-06-08 - Inference MVP Package Direction

- 변경: `SCREEN_INFERENCE_ARCHITECTURE.md`의 target package 방향을 여러 inference package가 아니라 단일 `@cx/inference` MVP 패키지로 조정함
- 변경: `@cx/inference` 내부 책임을 `stores`, `context`, `engine`, `pipeline`, `worker`로 나누고, `apps/web` API route는 thin adapter로만 운영한다고 명시함
- 변경: MVP local file storage 규약을 `.data/inference-jobs/{jobId}/job.json`, `events.ndjson`, `steps/*`, `context/*` 기준으로 고정함
- 변경: `JobStore`, `ArtifactStore`, `FileJobStore`, `FileArtifactStore`, `MemoryJobStore`, `MemoryArtifactStore` 기준과 worker 격리 테스트 방향을 문서화함
- 변경: `InferenceEvent.seq`를 job별 monotonic sequence로 고정하고 SSE event id와 `listEvents(jobId, after)` 기준으로 사용한다고 명시함
- 이유: MVP에서는 package 분할보다 로컬 파일 기반 job/artifact storage와 in-memory fake store로 inference call을 빠르게 검증하는 것이 우선이기 때문
- 검증: 문서 링크와 target package 명칭 `rg` 확인. 구현 변경은 수행하지 않음
- 후속: `@cx/inference` 패키지를 추가하고 store/context/step/worker 순서로 구현한다.

## 2026-06-08 - Screen Inference Failure Layer Preservation

- 변경: `createFailedScreenInferenceStatus(...)`를 추가해 pipeline 실패 시 마지막 `currentStage`를 기준으로 Web layer status를 `failed/completed/skipped`로 계산하도록 정리함
- 변경: `screen-inference-run-store` catch 경로가 기존 generic failed status 대신 마지막 저장 상태를 읽어 실패 stage/layer/message를 보존하도록 수정함
- 변경: `screen-inference-run.test.ts`에 revise layer 실패 회귀 테스트를 추가함
- 이유: 선언형 pipeline 완료 이후에도 Web status 파일은 실패를 항상 `understand` 레이어로 덮어 compose/revise 실패를 잘못 표시하고 있었기 때문
- 검증: `pnpm -s vitest run apps/web/src/lib/screen-inference-run.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts`, `pnpm -s tsc --noEmit --pretty false`, `pnpm -s biome lint apps/web/src/lib/screen-inference-run.ts apps/web/src/lib/screen-inference-run-store.ts apps/web/src/lib/screen-inference-run.test.ts`
- 후속: 필요하면 pipeline status의 terminal stage metadata를 Web snapshot API에서 직접 노출해 UI가 run-local status file 대신 pipeline persistence를 1차 근거로 읽도록 정리한다.

## 2026-06-08 - Pipeline Declarative Completion Contract Cleanup

- 변경: `@cx/pipeline` public `PipelineStageId`와 `PipelineRunResult`, `ScreenGenerationSkillBundleRef.stage`에서 제거된 revision 단계/필드를 정리해 현재 11-step screen-generation 계약과 일치시킴
- 변경: `apps/web/src/lib/screen-inference-run-store.ts`가 hardcoded stage allowlist 대신 `getScreenGenerationStageOrder()`를 사용하도록 바꿔 Web 진행률 SSOT가 pipeline metadata와 드리프트하지 않게 함
- 변경: `packages/pipeline/src/__tests__/step-definition.test.ts`의 예시 step 순서를 현재 단일 패스 screen-generation 흐름에 맞게 갱신함
- 이유: `PIPELINE_DECLARATIVE_PLAN.md`는 revision 제거와 public stage 목록 반영 완료를 선언했지만, 실제 public 타입/웹 진행률 경계에는 이전 revision surface가 남아 있었기 때문
- 검증: `pnpm -s vitest run packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts apps/web/src/lib/screen-inference-run.test.ts`, `pnpm -s tsc --noEmit --pretty false`, `pnpm -s biome lint packages/pipeline/src/public/types.ts packages/pipeline/src/pipelines/screen-generation/skill-catalog.ts packages/pipeline/src/__tests__/step-definition.test.ts apps/web/src/lib/screen-inference-run-store.ts`
- 후속: 남아 있는 revision 관련 설명 자산(`packages/agent/docs/*`)은 현재 호환 문맥인지 target inference 문서로 이관할지 별도 정리한다.

## 2026-06-08 - Screen Inference Architecture Reset

- 변경: `docs/development/SCREEN_INFERENCE_ARCHITECTURE.md`를 추가해 Job Store, Worker, Inference Pipeline, Pipeline Context, Execution Engines, Knowledge Base 중심의 새 screen inference 실행 구조를 정본화함
- 변경: 기존 `AGENT_RUNTIME_PROTOCOL.md`, `PIPELINE_STAGE_PROTOCOL.md`, `PIPELINE_STEP_REFERENCE_MANIFEST_PLAN.md`, 빈 `INFERENCE_SERVICE_STRUCTURE.md`를 제거하고 관련 링크를 새 정본 문서로 통합함
- 변경: `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `API_ENDPOINTS.md`, `docs/development/README.md`, `packages/pipeline/README.md`, `packages/agent/README.md`를 새 target package 구조와 compatibility/deprecated 상태 기준으로 갱신함
- 이유: 기존 `@cx/inference-nodes` 및 `@cx/pipeline` screen-generation 경계가 복잡해져 새 inference contract/store/runtime/screen-inference 구조로 재설계하기 위함
- 검증: 문서 링크 `rg` 확인. 구현 변경은 수행하지 않음
- 후속: `@cx/inference-contracts`, `@cx/inference-store`, `@cx/inference-runtime`, `@cx/screen-inference` 패키지를 순서대로 추가하고 `/api/inference/*` target route로 이관한다.

## 2026-06-05 - Contract Branch Audit

- 변경: `docs/development/CONTRACT_BRANCH_AUDIT_2026-06-05.md`를 추가해 pipeline 외 패키지의 schema/contract 부족성 도메인 분기를 코드 청크 단위로 점검함
- 변경: `@cx/renderer` renderer kind 선택, `@cx/inference-nodes` decoration role projection, table/read model area type 매핑, region contract 중복, layout matcher, Web Puck scope adapter를 위험도별로 분류함
- 변경: 2차 AST 스캔으로 운영 소스 439개에서 후보 349개를 추출하고, `packages/figma-screen-sync`, `@cx/types/node-types`, markdown kind 추론, renderer coercion, RenderTree->Figma mapping까지 추가 위험으로 반영함
- 변경: 선언적 데이터 구조 후보 86개를 추가 스캔해 local policy table, coverage type 부족, 병렬 vocabulary, JSON/문서 catalog validation 취약성을 별도 섹션으로 정리함
- 이유: 옆 세션에서 확인된 "스키마 부족으로 인한 명령형 분기 과다" 문제가 다른 패키지에도 남아 있는지 후속 정리 순서를 잡기 위함
- 검증: `rg` 기반 운영 TypeScript 소스 분기 스캔, TypeScript AST 기반 `if`/삼항/`switch`/contract lookup 후보 수집, 선언적 상수/registry/catalog 후보 수집, 주요 후보 파일 주변 코드 수동 확인. 구현 변경은 수행하지 않음
- 후속: renderer kind contract, Figma sync 운영 여부, schema region contract, table area row type mapping, `@cx/types/node-types` legacy 정리부터 순서대로 SSOT를 확정해야 한다.

## 2026-06-05 - Screen Generation Descriptor SSOT

- 변경: `screen-generation` stage id/order/input/output/AI task/layer/message/artifact metadata를 `packages/pipeline/src/pipelines/screen-generation/descriptor.ts`의 `SCREEN_GENERATION_STAGE_DESCRIPTORS` 기준으로 모음
- 변경: `screen-generation-pipeline.ts`가 descriptor를 `definePipeline({ steps })`로 컴파일하게 하고, stage output contract/input map/AI task map 중복 선언을 제거함
- 변경: smoke manifest layer, artifact layer group, Web `SCREEN_INFERENCE_LAYERS`, stage→layer/message 조회를 같은 descriptor에서 파생하도록 정리함
- 변경: `propose-components`는 `validate-render-tree` 결과를 입력으로 받는 post-validation 단계이므로 `Revise` layer로 이동해 Web 진행 상태가 Revise 이후 Compose로 되돌아가지 않게 함
- 변경: descriptor와 stage executor/AI runner registry가 어긋나면 pipeline 생성 시 즉시 실패하도록 coverage guard를 추가하고 public API 테스트에 descriptor 계약 검증을 추가함
- 변경: stage output projection map(`readScreenGenerationStageOutput`)을 제거하고 각 stage 실행 함수가 자기 output을 직접 반환하도록 정리함
- 변경: revision 관련 skip 조건과 parse failure 이후 artifact write 예외를 descriptor `skipPolicy`로 이동해 stage id 문자열 분기를 줄임
- 변경: deterministic executor registry와 AI runner registry를 단일 `screenGenerationStageRuntimes`로 합쳐 stage 구현 연결점을 하나로 줄임
- 이유: 최신 Step runtime API 위에 screen-generation 전용 stage/layer/contract 선언이 중복으로 남아 있어 stage 추가/rename 시 pipeline, smoke artifact, Web progress를 손으로 맞춰야 했기 때문
- 검증: `pnpm exec tsc -p tsconfig.json --noEmit`, `pnpm exec vitest run packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/step-runner.test.ts apps/web/src/lib/screen-inference-run.test.ts`, `pnpm exec biome check AGENTS_HISTORY.md docs/development/PIPELINE_STAGE_PROTOCOL.md packages/pipeline/src/pipelines/screen-generation/descriptor.ts packages/pipeline/src/pipelines/screen-generation/artifact-commands.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/index.ts packages/pipeline/src/__tests__/public-api.test.ts apps/web/src/lib/screen-inference-run.ts apps/web/src/lib/screen-inference-run.test.ts`
- 후속: `screenGenerationStageRuntimes`는 stage 구현 함수 registry로 남아 있으며, 다음 정리에서는 inference-node descriptor가 runner 구현까지 소유할지 결정해야 한다.

## 2026-06-05 - Pipeline Step Output Registry

- 변경: `@cx/pipeline` Step output 계약을 `output.result` named map으로 정규화하고 runtime 완료 상태에 `state.steps[step.id].outputs.result`를 저장하도록 변경함
- 변경: `stepOutput(stepId, "result")`, `refInput(id)`, `contract(id)` helper를 추가하고 screen-generation step wiring을 upstream `*.result`와 외부 reference helper 기반으로 정리함
- 변경: screen-generation AI step runner가 runtime resolved `inputs`를 받아 실행하도록 바꾸고, 각 AI step prompt에는 `@cx/agent/tasks`의 실제 prompt artifact를 연결함
- 이유: defineStep만 봐도 step별 입력과 output contract를 추적할 수 있게 하고, 추후 `uses` manifest 설계 전에 실행 API를 먼저 안정화하기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts`

## 2026-06-05 - Catalog Facade Alignment Implementation

- 변경: `@cx/components/catalog`와 `@cx/layout-pattern-store/catalog`에 공통 facade인 `createCandidate`, `getEntry`, `listCatalog`, `listCatalogIds`를 추가함
- 변경: `@cx/layout-pattern-store`에 `./catalog` package export를 추가하고, package root는 runtime layout component surface로 전환함
- 변경: repo 내부의 layout catalog read import를 `@cx/layout-pattern-store/catalog`로 이동하고 layout-pattern-store README/plan 문서를 갱신함
- 변경: component/layout public API 테스트에 동일한 catalog-driven resolution facade 검증을 추가함
- 이유: Component와 Layout 모두 catalog 조회, ID 기반 선택, candidate 생성이라는 같은 resolution 패턴을 동일한 export path와 함수명으로 소비하게 하기 위함
- 검증: `pnpm exec vitest run packages/component/src/__tests__/catalog-public-contract.test.ts packages/layout-pattern-store/src/__tests__/public-api.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, targeted `pnpm exec biome check`

## 2026-06-05 - Catalog Facade Alignment Plan

- 변경: `CATALOG_FACADE_ALIGNMENT_PLAN.md`를 추가해 `@cx/components/catalog`와 `@cx/layout-pattern-store/catalog`가 동일한 export subpath와 `createCandidate`, `getEntry`, `listCatalog`, `listCatalogIds` facade를 제공하도록 하는 개선 계획을 작성함
- 변경: 실제 코드 기준으로 두 패키지의 public/internal/runtime/candidate 구조, catalog 원천, 상태 모델 차이를 정리하고 `docs/development/README.md`의 활성 하위 계획에 연결함
- 이유: Component Candidate와 Layout Candidate 제작, ID 조회, catalog 조회 기능을 같은 public API 형식으로 노출하기 위한 기준을 먼저 고정하기 위함
- 검증: 문서 링크 확인, `git diff --check`

## 2026-06-05 - Pipeline AI Step Adapter Execution

- 변경: `screen-generation` pipeline의 AI stage를 `usesAI: true` Step으로 선언하고 `runStepPipeline(..., { agent })`의 `StepAgentAdapter` 경로에서 실행하도록 전환함
- 변경: fake/Claude local-first runner 선택을 각 stage executor 내부 분기에서 `createScreenGenerationStepAgentAdapter(...)`로 이동하고, 기존 `@cx/inference-nodes` node/helper 기반 agent input context 조립은 유지함
- 변경: `screen-generation-tags.test.ts`에 AI stage runner request와 agent input context 유지 검증을 추가하고, `PIPELINE_STAGE_PROTOCOL.md`와 `packages/pipeline/README.md`에 AI step 실행 규칙을 반영함
- 이유: pipeline을 단순 stage wrapper가 아니라 AI/deterministic 실행 계약을 소유하는 runtime으로 만들고, 실행 방식이 fake/Claude로 바뀌어도 stage별 agent context가 유지되게 하기 위함
- 검증: `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts`

## 2026-06-05 - Pipeline Step Reference Manifest Plan

- 변경: `PIPELINE_STEP_REFERENCE_MANIFEST_PLAN.md`를 추가해 `defineStep`에서 `uses`, named `output.result`, `stepOutput(stepId, outputName)` helper로 step별 참조 자료와 output contract를 드러내는 개선안을 작성함
- 변경: `docs/development/README.md`의 활성 하위 계획에 해당 문서를 추가함
- 이유: 현재 screen-generation step 정의만 봐서는 각 step이 어떤 upstream artifact, catalog, docSet, schema를 참고하는지 직관적으로 파악하기 어렵기 때문
- 검증: 문서 링크 확인, `git diff --check`

## 2026-06-05 - Web API Consumption Hook Plan

- 변경: `API_ENDPOINTS.md`에 "Browser-facing UI는 `/api/*` endpoint만 소비하고 Pipeline/DB/Claude 실행은 Next API route와 `server/*` service/repo 뒤에 둔다"는 경계 규칙을 추가함
- 변경: `WEB_API_CONSUMPTION_HOOK_PLAN.md`를 추가해 `features/*`, `server/*`, `shared/*`, `app/api/*` 기준과 screen inference API 소비 hook을 source/run/review/actions/workbench composer로 분리하는 rollout 계획을 작성함
- 변경: `AGENTS.md`와 `docs/development/README.md`에 해당 규칙과 계획 문서를 연결함
- 이유: Web UI가 endpoint 소비자라는 원칙을 명확히 하고, 현재 넓은 `useNewScreenInference`를 안전하게 쪼갤 기준을 먼저 고정하기 위함
- 검증: 문서 링크 확인, `git diff --check`

## 2026-06-05 - API Endpoint Documentation

- 변경: `docs/development/API_ENDPOINTS.md`를 추가해 현재 구현된 Web API route, 입력/출력 요약, SSE 사용 방식, dev-only endpoint, 변경 체크리스트를 정리함
- 변경: `docs/development/README.md`의 운영 기준 문서 목록에 endpoint 문서를 추가함
- 변경: `README.md`와 `AGENTS.md`에도 endpoint 문서를 기준 문서로 연결하고, Web API route 변경 시 함께 갱신해야 한다는 운영 원칙을 추가함
- 이유: endpoint 논의가 archive 계획 문서와 코드에 흩어져 있어 현재 활성 Web API 표면을 한 곳에서 확인하기 어렵기 때문
- 검증: `find apps/web/src/app/api -maxdepth 5 -type f`, route 파일 확인, `git diff --check`

## 2026-06-05 - Development Docs Responsibility Cleanup

- 변경: `docs/development/README.md`에 문서 책임 기준, 현재 운영 기준 문서, 활성 하위 계획, archive 이동 문서 표를 추가함
- 변경: 완료 또는 최신 기준에 흡수된 `ADAPTERS_PACKAGE_TRANSITION_PLAN.md`, `RENDER_DB_REST_LOADER_TRANSITION_PLAN.md`, `SCREEN_DESIGN_STAGE_PLAN.md`, `NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md`, `INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md`를 `docs/archive/completed-plans/`로 이동함
- 변경: `PIPELINE_STAGE_PROTOCOL.md`의 완료된 stage 확장 계획 링크를 현재 상세 해설 문서와 archive 기록으로 분리함
- 이유: `docs/development/`가 운영 기준 문서와 완료된 전환 계획을 같은 위상으로 보여 문서 책임과 SSOT가 겹쳐 보였기 때문
- 검증: `rg`로 이동 전 development 경로 참조 확인, `git diff --check`. `pnpm exec biome check ...`는 Markdown 문서가 repo Biome ignore 대상이라 처리 파일 0개로 종료됨

## 2026-06-05 - Smoke App To Scripts

- 변경: `apps/smoke/src/*`의 smoke/generation/render-db/proposal CLI와 helper를 `scripts/*`로 이동하고 `apps/smoke` 앱 패키지와 `@cx/smoke` public package export를 제거함
- 변경: root `package.json`의 `smoke:pipeline`, `test:smoke:pipeline`, `smoke:proposals`, `smoke:promote-*`, `render-db:*` scripts가 새 `scripts/*` entrypoint를 호출하도록 수정함
- 변경: smoke helper 테스트 위치가 `scripts/**`로 이동함에 따라 `vitest.config.ts` include에 `scripts/**/*.{test,spec}.{ts,tsx}`를 추가함
- 변경: `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `scripts/SMOKE.md`, 관련 development 문서를 `@cx/smoke` 앱/패키지 기준이 아니라 개발자용 scripts 기준으로 갱신함
- 이유: smoke는 제품 앱이나 reusable package가 아니라 `@cx/pipeline`을 반복 실행하는 개발/검증 도구이므로 `apps`에서 제거하고 scripts로 낮추기 위함

## 2026-06-05 - Orchestration Package Absorption

- 변경: `packages/orchestration` 패키지를 제거하고 기존 deterministic planning helper와 agent input/context builder를 `packages/inference-nodes/src/screen-generation/planning/`으로 흡수함
- 변경: `@cx/pipeline`과 `@cx/inference-nodes`의 `@cx/orchestration` dependency를 제거하고, pipeline은 screen-generation planning 타입도 `@cx/inference-nodes/screen-generation` public surface에서 import하도록 정리함
- 변경: `@cx/inference-nodes/screen-generation`이 screen-generation agent input 타입, pattern layer candidate, design-context bundle selection, generation next action 타입을 공개하도록 export를 보강함
- 변경: `AGENTS.md`, `MASTER_PLAN.md`, `PACKAGE_MAP.md`, 주요 development/design/README 문서에서 현재 책임 기준을 `@cx/pipeline` runtime과 `@cx/inference-nodes` node/planning helper로 갱신함
- 이유: `orchestration`이라는 패키지명이 pipeline 순서와 실행 책임을 소유한다는 오해를 만들었고, 실제 역할은 inference node 내부 planning helper였으므로 node 패키지 안으로 흡수해 경계를 단순화하기 위함

## 2026-06-05 - Inference Pipeline Rollout 9

- 변경: `runScreenGenerationPipeline(...)`에서 legacy `stage-loop` 분기를 제거하고 `screen-generation` 실행을 항상 `runStepPipeline(...)` 경로로 고정함
- 변경: `ScreenGenerationPipelineOptions.executionMode`와 smoke CLI `--execution-mode` 플래그를 제거해 더 이상 runtime path 선택 표면을 노출하지 않게 함
- 변경: legacy `runScreenGenerationStageLoop(...)`와 stage-loop 전용 status/event persistence helper를 제거하고, stage executor table을 `screenGenerationStepExecutors`로 rename해 Step 정의용 executor로만 사용하게 함
- 변경: `@cx/pipeline`이 직접 import하던 orchestration builder 호출을 `@cx/inference-nodes/screen-generation`의 deterministic node wrapper(`runPatternLayerCandidatesNode`, `runDesignSkillSelectionNode`, `runDesignContextBundleRefsNode`, `runDecorationPlanNode`, `runGenerationNextActionNode`) 뒤로 이동함
- 변경: agent 결과가 `Screen.Header`, `Screen.Contents`, `Screen.Bottom`의 필수 `layout.region.*` ref를 누락하면 `runRequiredRegionLayoutRepairNode(...)`가 검증 전에 보정하도록 추가함
- 이유: 마지막 Rollout 9 범위에서 pipeline은 Step runtime/order/status/IO를 소유하고, 실제 agent/deterministic/validation 작업 단위는 inference-nodes가 소유하도록 경계를 확정하기 위함
- 검증: `pnpm exec biome check AGENTS_HISTORY.md PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md apps/smoke/README.md packages/inference-nodes/src/screen-generation/deterministic-nodes.ts packages/inference-nodes/src/screen-generation/index.ts packages/inference-nodes/src/__tests__/deterministic-nodes.test.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/public/types.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts apps/smoke/src/cli.ts apps/smoke/src/generation/types.ts apps/smoke/src/generation/run-generation-smoke.ts apps/smoke/src/generation/batch/run-batch.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/inference-nodes/src/__tests__/screen-intent-node.test.ts packages/inference-nodes/src/__tests__/deterministic-nodes.test.ts apps/smoke/src/generation/batch/run-batch.test.ts apps/web/src/lib/screen-inference-events.test.ts apps/web/src/components/App.test.tsx`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md' --artifact-store local-transient --run-id rollout9-cleanup-final-fake-check`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md' --artifact-store local-transient --run-id rollout9-default-step-runner-ai-check-2 --use-ai`
- 검증 결과: cleanup fake `rollout9-cleanup-final-fake-check`는 `pipeline-status.status=completed`, `write-artifacts=completed`, `revise-render-tree-if-invalid=skipped`, `pipeline-events.ndjson=22 events`, `validationOk=true`; real AI `rollout9-default-step-runner-ai-check-2`는 revision route를 실행하고 `pipeline-status.status=completed`, `pipeline-events.ndjson=26 events`, `validation-report.errorCount=0`, `warningCount=2`, `validationOk=true`
- 후속: 첫 real AI 재검증(`rollout9-default-step-runner-ai-check`)은 revision 결과가 `Screen.Bottom.layout`을 누락해 `validationOk=false`였다. 해당 계약은 deterministic region layout repair node로 보강했고 재실행에서 통과했다.

## 2026-06-05 - Inference Pipeline Rollout 8

- 변경: `GET /api/screen-inference/runs/:runId/events` SSE route를 추가해 `pipeline-events.ndjson`에 저장된 `PipelineRunEvent`를 `pipeline-event`로 replay/tail할 수 있게 함
- 변경: SSE route가 `Last-Event-ID`를 기준으로 reconnect 이후 이벤트를 이어 보내고, Web run이 `failed`, `waiting-review`, `applied` 같은 terminal 상태가 되면 stream을 닫도록 함
- 변경: `screen-inference-events` helper를 추가해 persisted NDJSON parsing, SSE payload formatting, event-id filtering, client message parsing을 분리함
- 변경: Web client에 `subscribeScreenInferenceRunEvents(...)`를 추가하고 `useNewScreenInference(...)`가 SSE event를 즉시 status refresh trigger로 사용하되 기존 polling effect는 fallback으로 유지하도록 연결함
- 이유: Rollout 8 범위에서 run status persistence를 Web UI에 실시간으로 전달하되, 기존 snapshot API와 polling fallback을 유지해 reconnect/refresh 안정성을 보장하기 위함
- 검증: `pnpm exec biome check AGENTS_HISTORY.md docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md apps/web/src/lib/screen-inference-events.ts apps/web/src/lib/screen-inference-events.test.ts apps/web/src/lib/screen-inference-run-store.ts apps/web/src/lib/screen-inference-client.ts apps/web/src/model/workbench/use-new-screen-inference.ts 'apps/web/src/app/api/screen-inference/runs/[runId]/events/route.ts'`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run apps/web/src/lib/screen-inference-events.test.ts apps/web/src/lib/screen-inference-run.test.ts apps/web/src/components/App.test.tsx packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md' --artifact-store local-transient --execution-mode step-runner --run-id rollout8-step-runner-fake-check`
- 후속: Web UI가 pipeline event shape를 직접 안정적으로 소비할 만큼 stage reducer가 정리되면, 현재의 snapshot refetch trigger 방식에서 event reducer apply 방식으로 최적화할 수 있다.

## 2026-06-05 - Inference Pipeline Rollout 7

- 변경: `runStepPipeline(...)`에 `PipelineFeedbackRule` 실행을 추가해 `fromStep`, `when`, `goTo`, `then`/`thenStep`, `maxRetries` 기반 cursor routing을 지원함
- 변경: `review-quality` stage가 `buildGenerationNextAction(...)` decision fact를 만들고, `revise-render-tree-if-invalid`는 decision이 revision 요청일 때만 실행되도록 분리함
- 변경: happy path에서 `revise-render-tree-if-invalid`와 `validate-render-tree-after-revision`이 no-op 실행 대신 `skipped` status로 기록되게 함
- 변경: revision 후 validation error count가 이전 후보보다 악화되면 final candidate를 pre-revision 후보로 되돌리는 안전장치를 추가함
- 변경: feedback route 단위 테스트와 screen-generation skipped status/event count 테스트를 추가함
- 이유: Rollout 7 범위에서 revision 여부 판단은 pipeline feedback route가 소유하고, revision node는 실제 수정 실행만 담당하도록 경계를 올리기 위함
- 검증: `pnpm exec biome check AGENTS_HISTORY.md PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md packages/pipeline/src/public/types.ts packages/pipeline/src/pipelines/screen-generation packages/pipeline/src/runtime/run-step-pipeline.ts packages/inference-nodes/src/screen-generation/validation-node.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/inference-nodes/src/__tests__/screen-intent-node.test.ts apps/smoke/src/generation/batch/run-batch.test.ts`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --execution-mode step-runner --run-id rollout7-step-runner-fake-check`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --run-id rollout7-stage-loop-ai-check-3 --use-ai`
- 검증 결과: fake happy path는 optional revision stages를 `skipped`로 기록하고 `pipeline-events.ndjson=22 events`; `rollout7-stage-loop-ai-check-3`는 revision route를 실행하고 `pipeline-status.json.status=completed`, `pipeline-events.ndjson=26 events`, `validation-report.json.ok=true`, error 0건, warning 2건
- 후속: `rollout7-stage-loop-ai-check`와 `rollout7-stage-loop-ai-check-2`에서 revision 결과가 `Screen.Bottom.layout` error를 만들 수 있음을 확인했다. 안전장치로 final 승격은 막았지만, agent revision prompt/repair 정책은 후속 hardening 대상으로 남긴다.

## 2026-06-05 - Inference Pipeline Rollout 6

- 변경: `ScreenGenerationPipelineOptions.references`를 추가해 `componentCatalogs`, `layoutCatalogs`, `skillBundles`, `designContextBundles`를 외부에서 주입할 수 있게 함
- 변경: `screen-generation` stage runtime이 component catalog, layout resolver, skill/design-context loader를 직접 import하지 않고 normalized references만 사용하도록 변경함
- 변경: 기본 references는 `createDefaultScreenGenerationReferences(...)`에서 기존 공개 API(`@cx/components/catalog`, `@cx/layout-pattern-store/resolver`, agent docs loader)를 묶어 제공함
- 변경: RenderTree validation node가 component catalog 값을 직접 import하지 않고 caller가 전달한 `componentCatalog`로 검증하도록 변경함
- 이유: Rollout 6 범위에서 외부 catalog/skill/design-context 자산을 pipeline 실행 옵션으로 교체 가능하게 만들어, 다음 단계의 preset/experiment와 step definition 전환을 쉽게 하기 위함
- 검증: `pnpm exec biome check AGENTS_HISTORY.md PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md packages/pipeline/src/public/types.ts packages/pipeline/src/pipelines/screen-generation packages/inference-nodes/src/screen-generation/validation-node.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/inference-nodes/src/__tests__/screen-intent-node.test.ts apps/smoke/src/generation/batch/run-batch.test.ts`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --execution-mode step-runner --run-id rollout6-step-runner-fake-check-2`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --run-id rollout6-stage-loop-ai-check-2 --use-ai`
- 검증 결과: `rollout6-stage-loop-ai-check-2`는 `pipeline-status.json.status=completed`, `pipeline-events.ndjson=26 events`, `validation-report.json.ok=true`, error 0건, warning 3건
- 후속: 첫 real AI smoke(`rollout6-stage-loop-ai-check`)는 `plan-composition`에서 Claude JSON parse 오류로 실패했다. 재시도는 통과했지만 Rollout 7 이후 agent output parse retry/repair 정책을 별도 보강 대상으로 둔다.

## 2026-06-05 - Inference Pipeline Rollout 5B

- 변경: `runAgentPromptNode(...)` 공통 wrapper를 추가하고 composition, pattern selection, screen generation, component proposal, quality review, screen revision agent stage를 `@cx/inference-nodes/screen-generation` node wrapper로 분리함
- 변경: fake generation runner와 fake composition/pattern/proposal/quality artifact helper를 `@cx/inference-nodes`로 이동함
- 변경: RenderTree validation report 생성을 `createRenderTreeValidationReport(...)` validation node로 이동해 pipeline의 validation rule 소유를 줄임
- 이유: Rollout 5 전체 범위에서 `@cx/pipeline`은 stage 순서, runner 선택, state 기록, artifact write를 유지하고 agent/validation 작업 단위는 node 패키지로 옮기기 위함
- 검증: `pnpm exec biome check AGENTS_HISTORY.md PACKAGE_MAP.md docs/development/PROJECT_STRUCTURE.md docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md packages/inference-nodes packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/inference-nodes/package.json`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec vitest run packages/inference-nodes/src/__tests__/screen-intent-node.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/public-api.test.ts apps/smoke/src/generation/batch/run-batch.test.ts`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --execution-mode step-runner --run-id rollout5b-step-runner-fake-check`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --run-id rollout5b-stage-loop-ai-check --use-ai`
- 검증 결과: `rollout5b-stage-loop-ai-check`는 `pipeline-status.json.status=completed`, `pipeline-events.ndjson=26 events`, `validation-report.json.ok=true`, error 0건, warning 0건

## 2026-06-05 - Inference Pipeline Rollout 5A

- 변경: `@cx/inference-nodes` 패키지를 추가하고 root, `./agent`, `./screen-generation` public surface를 만듦
- 변경: 첫 agent node로 `runScreenIntentNode(...)`를 추가해 ScreenIntent agent input 조립과 agent task 실행을 pipeline 밖으로 분리함
- 변경: fake smoke용 `createFakeScreenIntent(...)`도 `@cx/inference-nodes/screen-generation`으로 이동해 pipeline 내부 pure helper 소유를 줄임
- 변경: `derive-screen-intent` stage는 Claude/fake runner 선택과 pipeline state 반영만 담당하고, 실제 node 실행은 `runScreenIntentNode(...)`에 위임하도록 바꿈
- 이유: Rollout 5A 범위에서 `@cx/pipeline`은 stage order/status/artifact/IO를 유지하고, agent 관련 작업 단위는 `@cx/inference-nodes`로 옮기는 경계를 코드로 확정하기 위함
- 검증: `pnpm exec biome check ...`, `pnpm exec vitest run packages/inference-nodes/src/__tests__/screen-intent-node.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/public-api.test.ts apps/smoke/src/generation/batch/run-batch.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --execution-mode step-runner --run-id rollout5a-step-runner-fake-check`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --run-id rollout5a-stage-loop-ai-check --use-ai`
- 후속: real AI smoke는 `validationOk: true`이나 `divider` unknown-prop과 `layout.region.bottom` candidate warning이 남아 있어 후속 node 추출/contract 정리 때 계속 추적한다.

## 2026-06-05 - Inference Pipeline Rollout 4

- 변경: `ScreenGenerationPipelineOptions.executionMode`를 추가해 기존 `stage-loop`와 신규 `step-runner` 경로를 선택할 수 있게 함
- 변경: screen-generation 13개 기존 stage executor를 `defineStep(...)` wrapper로 감싸 `runStepPipeline(...)`에서 순차 실행하는 경로를 추가함
- 변경: Step runner status에 `outDir`, `runDir`, `sourcePath` 메타데이터를 전달하고, smoke CLI에 `--execution-mode stage-loop|step-runner` 옵션을 추가함
- 변경: `PipelineStep.skipWhen`을 추가해 parse 실패 후 불필요한 step이 completed output처럼 기록되지 않고 `skipped` status로 남도록 함
- 이유: Rollout 4 범위에서 stage 내부 구현, artifact write, revision/validation 로직은 유지하면서 Step runner path가 current runtime을 side-by-side로 실행할 수 있음을 검증하기 위함
- 검증: `pnpm exec vitest run packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/public-api.test.ts apps/smoke/src/generation/batch/run-batch.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec biome check ...`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --execution-mode step-runner --run-id rollout4-step-runner-fake-check-2`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --execution-mode step-runner --run-id rollout4-step-runner-ai-check --use-ai`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --run-id rollout4-stage-loop-ai-check --use-ai`, `git diff --check`
- 후속: real AI smoke에서 `Badge.divider` 또는 `ListText.divider` unknown-prop warning이 1건씩 남아 있어 Rollout 5 이후 node/contract extraction 때 component catalog 계약과 prompt 출력 surface를 함께 정리한다.

## 2026-06-05 - Inference Pipeline Rollout 3

- 변경: `runStepPipeline(...)` generic Step runner를 추가해 작은 `StepPipelineDefinition`을 순차 실행할 수 있게 함
- 변경: executable Step, AI Step adapter, `from(...)`/`value(...)` input resolution, artifact rule, status/event persistence를 runner fixture에서 검증함
- 변경: generic Step runner를 위해 `PipelineRunStatus`와 `PipelineRunEvent`의 `pipelineId`/`stage` 타입을 string-compatible하게 확장함
- 변경: Web screen inference progress handler에는 screen-generation stage guard를 추가해 generic step event와 기존 UI stage 타입 경계를 분리함
- 이유: Rollout 3 범위에서 기존 `runPipeline("screen-generation")` hardcoded stage loop는 유지하면서, Step runner를 side-by-side로 성숙시키기 위함
- 검증: `pnpm exec vitest run packages/pipeline/src/__tests__/step-runner.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/public-api.test.ts apps/web/src/lib/screen-inference-run.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `npm run test:smoke:pipeline`, `git diff --check`

## 2026-06-05 - Inference Pipeline Rollout 0-2

- 변경: `npm run test:smoke:pipeline`을 추가해 fake-mode CLI smoke를 rollout static/fake-mode gate에 포함함
- 변경: `@cx/pipeline/definition`에 `definePipeline`, `defineStep`, `from`, `value` Step Definition helper를 추가함
- 변경: `PipelineStep`, `StepInputRef`, `OutputContract`, `StepPipelineDefinition`, `PipelineExecutionState` 등 Step migration 타입을 public type으로 추가함
- 변경: `resolveStepInputs`, `resolveStepInput`, `createPipelineExecutionState`, `StepInputResolutionError`를 추가해 `input.*`, `step.*`, `ref.*`, `value(...)` resolver를 구현함
- 변경: 현재 screen inference 13단계가 Step 정의 데이터로 표현되는지와 nested input ref resolver가 동작하는지 테스트를 추가함
- 이유: Rollout 0~2 범위에서 기존 screen-generation 런타임은 변경하지 않고, Step migration의 선언/입력 해석 기반만 먼저 세우기 위함
- 검증: `pnpm exec vitest run packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `npm run test:smoke:pipeline`, `npm run smoke:pipeline -- --target data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md --artifact-store local-transient --use-ai`, `git diff --check`

## 2026-06-04 - Inference Pipeline Step Runner Plan

- 변경: `docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md`를 graph/node 중심 설명에서 `PipelineDefinition`, `PipelineStep`, `StepInputRef`, `OutputContract`, `feedback`, `persistence` 중심 설명으로 재정리함
- 변경: 공개 input reference API를 `artifactFrom(...)` 대신 `from(ref)`, `value(value)` 중심으로 단순화함
- 변경: `PipelineStep`을 `AiPipelineStep | ExecutablePipelineStep` union으로 정리하고, AI Step은 `prompt`와 `output` contract 필수, non-AI Step은 `execute` 필수와 `output` 선택으로 기록함
- 변경: 1차 migration 목표를 3-call 축소가 아니라 현재 smoke-proven inference flow를 `defineStep` 구조로 감싸는 것으로 조정함
- 변경: 현재 screen inference 과정을 `definePipeline`/`defineStep` 신규 API 예시로 문서화하고, `feedback`과 `artifacts` 선언 예시를 추가함
- 변경: feedback rule에서 `then`은 optional revision Step 이후 재진입 위치, `maxRetries`는 무한 revise loop 방지 상한으로 역할을 명시함
- 변경: Step runtime cursor 실행 예시, `resolveStepInputs`/feedback 평가 코드 예시, SSE route/Web `EventSource` 통신 예시를 계획 문서에 추가함
- 변경: input API를 1차 `from(ref)`, `value(value)` 체계로 정규화하고, ref namespace를 `input.*`, `step.*`, `ref.*`로 단순화함
- 변경: Web client endpoint 기준으로 run 생성/조회/artifact/apply/events, run directory File I/O, `status.json`과 `pipeline-status.json` 책임 차이를 문서화함
- 변경: 외부 reference 명칭을 `skillBundles`, `designContextBundles`, `layoutCatalogs`, `componentCatalogs`로 정리하고 모두 `ref.*` 아래에서 참조하도록 계획 문서를 갱신함
- 변경: `componentCatalogs`와 `layoutCatalogs` 예시를 실제 `@cx/components/catalog`, `@cx/layout-pattern-store`, `@cx/layout-pattern-store/resolver` public API 기준으로 보정함
- 변경: Step API 예시를 현재 `screenGenerationPipelineDefinition.stages` 순서와 참조 흐름 기준으로 보정하고, `derive-decoration-plan`, `revise-render-tree-if-invalid`, `validate-render-tree-after-revision`, `write-artifacts`를 1차 migration 예시에 포함함
- 변경: 현재 코드 근거 파일, 품질 parity gate, fake-mode/Claude local-first baseline, Step migration rollout 0~9를 계획 문서에 추가함
- 변경: fake-mode CLI smoke를 `npm run test:smoke:pipeline`으로 추가하고 migration static/fake-mode gate에 포함함
- 이유: 현재 요구사항이 범용 graph engine보다 단계 순서, 단계별 참고 자료, 출력 계약, AI 사용 유무, feedback loop, UI 상태 persistence를 빠르게 실험하는 것에 가깝기 때문
- 검증: `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts`, `artifact-commands.ts`, `public/types.ts`, `screen-generation-tags.test.ts`, `public-api.test.ts` 확인 후 문서 변경, `npm run test:smoke:pipeline`, `git diff --check`

## 2026-06-04 - Divider Prop Contract Cleanup

- 변경: PageStack area divider 계약을 `divider: "contents" | "section" | "none"` 단일 prop으로 정리하고 `divider:true`의 trailing 의미와 공개 `sectionDivider` prop을 제거함
- 변경: `"contents"`는 반복 row 사이 1px divider, `"section"`은 area 뒤 4px section break, `"none"`은 구분 없음으로 렌더 의미를 고정함
- 변경: layout-pattern-store registry/catalog/schema, renderer tests, orchestration prompt, agent design-context 문서를 새 divider 계약으로 갱신함
- 이유: heterogeneous stack에 `divider:true`가 붙으며 제목/콜아웃/마지막 row 뒤에 divider가 과다 렌더되는 문제를 막기 위함
- 검증: `pnpm exec vitest run packages/renderer/src/__tests__/layout-pattern-render.test.tsx packages/layout-pattern-store/src/__tests__/public-api.test.ts packages/layout-pattern-store/src/__tests__/schema.test.ts`, `pnpm exec biome check ...`, `pnpm exec tsc --noEmit --pretty false --incremental false`

## 2026-06-04 - New Screen Stage Progress UX

- 변경: `@cx/pipeline`에 stage progress callback을 추가하고, Web 새 화면 run store가 stage 시작마다 `status.json`을 갱신하도록 연결함
- 변경: 새 화면 status DTO에 `currentStage`와 `currentMessage`를 추가해 `Understand -> Compose -> Revise` badge와 `Decorating sections…` 같은 진행 문구를 함께 표시함
- 변경: `NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md`에 3단계 badge와 pipeline stage text 계약을 반영함
- 이유: inference 실행 중 `Understand`만 켜져 있다가 완료되는 UX를 개선하고, 사용자가 현재 pipeline이 무엇을 하고 있는지 polling UI에서 확인하게 하기 위함
- 검증: `pnpm exec vitest run apps/web/src/lib/screen-inference-run.test.ts apps/web/src/components/App.test.tsx packages/pipeline/src/__tests__/screen-generation-tags.test.ts`, `pnpm exec biome check apps/web/src/lib/screen-inference-run.ts apps/web/src/lib/screen-inference-run-store.ts apps/web/src/lib/screen-inference-run.test.ts apps/web/src/components/workbench/canvas/Canvas.tsx packages/pipeline/src/public/types.ts packages/pipeline/src/index.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`

## 2026-06-04 - Workbench Global Area Component Navigation

- 변경: Workbench의 Areas/Components 탭이 선택된 화면의 자식만 보여주지 않고 로드된 전체 screen의 area/component 목록을 보여주도록 변경함
- 변경: 전체 목록 항목에 원본 screen 제목을 표시하고, 다른 screen의 area/component를 선택하면 preview/edit 대상 screen도 해당 원본 screen으로 이동하도록 연결함
- 이유: 그룹/컴포넌트 탐색 탭에서 현재 선택 화면 기준 필터 대신 전체 후보를 한 번에 살펴볼 수 있게 하기 위함
- 검증: `pnpm exec vitest run apps/web/src/components/App.test.tsx`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm exec biome check apps/web/src/components/workbench/AppShell.tsx apps/web/src/components/workbench/navigation/NavigationRoutes.tsx apps/web/src/model/workbench-view-model.ts apps/web/src/components/App.test.tsx`

## 2026-06-04 - Area Metadata Rendering Contract

- 변경: `area.metadata.title`과 `area.props.name`은 구조적 메타데이터로만 사용하고 화면에 직접 렌더하지 않는 계약으로 정함
- 변경: `@cx/renderer`의 `area.static`/`area.dynamic` 자동 title 렌더를 제거하고, dynamic area error fallback에서도 area name을 노출하지 않도록 맞춤
- 변경: PageStack 기반 `layout.area.*` wrapper가 `metadata.title`에 의존하지 않도록 `AreaPageStackFrame`의 titleMode를 `none`으로 고정하고, area pattern catalog에서 `titleMode`/`hideTitle` surface를 제거함
- 변경: visible section heading은 `TitleSection` 같은 명시 컴포넌트가 담당하도록 screen generation prompt와 `SCREEN_GENERATION_PIPELINE.md`를 갱신함
- 이유: area wrapper와 TitleSection이 같은 섹션 제목을 중복 렌더하는 문제를 없애고, area는 layout/provenance/DB 분해 단위로만 유지하기 위함
- 검증: `pnpm exec vitest run packages/renderer/src/__tests__/layout-pattern-render.test.tsx packages/layout-pattern-store/src/__tests__/public-api.test.ts packages/layout-pattern-store/src/__tests__/schema.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, `pnpm exec biome check packages/layout-pattern-store/src/components/area/page-stack/frame.tsx packages/layout-pattern-store/src/components/registry.ts packages/layout-pattern-store/src/catalog/area-patterns.json packages/renderer/src/__tests__/layout-pattern-render.test.tsx`, `pnpm exec tsc --noEmit --pretty false --incremental false`

## 2026-06-04 - New Screen Inference MVP Rollouts

- 변경: `codex/new-screen-inference-rollouts` 브랜치에서 새 화면 MVP를 rollout 단위로 구현하고 각 rollout 완료 후 리뷰/검증/커밋함
- 변경: DnD source intake, run/status polling, final review/rerun, approved DB apply 흐름을 Web API와 workbench 새 화면 탭에 연결함
- 변경: `docs/development/NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md`에 사용자 입력 라이프사이클, 화면 구성 다이어그램, endpoint-to-UI mapping, rollout 구분을 기록함
- 변경: apply 단계는 `final-result.json` RenderTree를 `render_*` DB read model row로 projection/upsert하는 Web facade를 추가함
- 이유: 사용자가 업로드한 client-import source가 추론 결과 UI preview, 검수, 승인, DB 등록으로 이어지는 MVP lifecycle을 빠르게 닫기 위함
- 검증: `pnpm exec vitest run apps/web/src/lib/screen-inference-source.test.ts apps/web/src/components/App.test.tsx apps/web/src/lib/screen-db-save.test.ts`, `pnpm exec biome check ...`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `git diff --cached --check`

## 2026-06-04 - Workbench Puck Logic Split

- 변경: `apps/web/src/components/puck/workbench/workbench-puck.tsx`에서 RenderTree apply, Puck data normalize, catalog candidate resolve, field generation, preview prop parsing 로직을 분리함
- 변경: edit scope 계약을 `apps/web/src/model/puck-edit-scope.ts`로 이동하고, Puck 변환 helper를 `apps/web/src/lib/workbench-puck/`의 `puck-scope`, `puck-fields`, `puck-props`로 분리함
- 변경: Puck 컴포넌트 파일은 Puck `Config`의 React preview/root render bridge만 담당하도록 축소하고, `AppShell`/edit sidebar import를 새 경계로 갱신함
- 이유: React component 폴더에 탭-편집범위 계약, RenderTree mutation, catalog/field 변환 정책이 섞여 있던 코드 냄새를 줄이고 workbench model/lib 책임으로 분리하기 위함
- 검증: `pnpm exec vitest run apps/web/src/components/App.test.tsx packages/adapters/src/__tests__/puck.test.ts`, `pnpm test`, `pnpm lint`, `pnpm build`

## 2026-06-04 - New Screen Inference Lifecycle Plan

- 변경: `docs/development/NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md`를 추가해 DnD 기반 새 화면 추론, `Understand -> Compose -> Revise` 진행 표시, 단계별 검수 snapshot, 승인 후 `final-result.json -> render_*` DB 등록 방향을 문서화함
- 변경: MVP 우선순위에 맞춰 `data/client-imports/{importId}/{batchId}/{screenId}.md` 저장 형식, DnD source upload route, run creation/status polling route, final artifact review route, rerun request, apply route 예시 코드를 추가함
- 변경: 새 화면 탭은 기존 Web 탭 구조를 재활용하고, 좌측 rail/중앙 status+preview/우측 validation-quality summary가 어떤 endpoint를 소비하는지 `New Screen Tab MVP Data Contract`로 정리함
- 변경: 새 화면 탭 예상 구성을 ASCII 다이어그램으로 추가하고, DnD source intake, run/status polling, final review/rerun, approved DB apply, layer snapshot으로 rollout을 분리함
- 변경: `docs/development/README.md`에 새 개발 문서 링크와 책임을 추가함
- 이유: 새 화면 기능을 구현하기 전에 smoke/pipeline/orchestration/agent/Web 경계에 맞는 사용자 입력 데이터 라이프사이클과 진행 UI 계약을 먼저 고정하기 위함
- 검증: 문서 변경만 수행함

## 2026-06-04 - Render DB Canonical Rollout 1

- 변경: `apps/smoke/src/render-db-canonical.ts`에 component/area signature canonicalization 공통 helper를 추가하고, duplicate audit report와 relation remap 결과를 산출하도록 구현함
- 변경: canonical id 규칙을 `docs/development/RENDER_DB_CANONICALIZATION.md`에 고정함: duplicate component는 `component.{slug(type)}.{hash}`, duplicate area는 `area.{slug(layout)}.{hash}`를 사용함
- 변경: `render-db:canonicalize` CLI를 추가해 remote Supabase render DB audit/dry-run SQL/report 생성과 `--write` apply를 지원함
- 변경: `render-db:push-tables`가 기본으로 signature canonical projection을 적용하도록 변경하고, `--report-file`, `--no-canonicalize` 옵션을 추가함
- 변경: remote render DB canonical migration을 적용해 중복 group을 component 10개/area 10개에서 0개로 줄였고, Puck catalog API가 canonical row 수(`screen-region=32`, `area=77`)를 반환하도록 확인함
- 이유: 화면별로 복제된 AppBar/상단 앱바 영역 row를 DB 모델의 reusable row 정책에 맞게 정리하고, 이후 import/push에서도 같은 중복이 재발하지 않게 하기 위함
- 검증: `pnpm run render-db:push-tables -- --report-file tmp/render-db-push-canonical-report.json --out-file tmp/render-db-push-canonical.sql`, `pnpm run render-db:canonicalize -- --report-file tmp/render-db-remote-canonical-report.json --out-file tmp/render-db-remote-canonical.sql`, `pnpm run render-db:canonicalize -- --write --report-file tmp/render-db-remote-canonical-applied-report.json --out-file tmp/render-db-remote-canonical-applied.sql`, postcheck `pnpm run render-db:canonicalize -- --report-file tmp/render-db-remote-canonical-postcheck-report.json`, Puck catalog API count check, `pnpm exec vitest run apps/smoke/src/render-db-canonical.test.ts apps/web/src/components/App.test.tsx apps/web/src/lib/screen-db-loader.test.ts apps/web/src/lib/screen-db-save.test.ts packages/adapters/src/__tests__/puck.test.ts packages/adapters/src/__tests__/table-to-render-tree.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`, `pnpm run lint`, `pnpm run build`, `git diff --check`

## 2026-06-04 - PageStack Area Frame Consolidation

- 변경: `packages/layout-pattern-store/src/components/area/page-stack/`에 `AreaPageStackFrame`과 PageStack area preset 테이블을 추가하고, 기존 `PageStackArea.tsx`는 새 구조를 re-export하도록 정리함
- 변경: `CollectionArea`와 `GeneralArea`를 각각 `area/collection/`, `area/general/` 하위로 이동하고 `area/index.ts` barrel에서 통합 export하도록 정리함
- 변경: PageStack 기반 area layout을 `areaPageStackLayouts`로 재분류하고, `pageStackProps()` 공통 contract 생성기를 통해 `divider`와 `sectionDivider`를 일관 노출하도록 통합함
- 이유: PageStack primitive는 그대로 두고 area에서 PageStack을 소비하는 정책, defaults, divider/sectionDivider 계약을 한 곳에서 관리하기 위함
- 검증: `npm test -- --run packages/renderer/src/__tests__/layout-pattern-render.test.tsx packages/layout-pattern-store/src/__tests__/public-api.test.ts packages/layout-pattern-store/src/__tests__/pattern-store.test.ts`, `npx tsc --noEmit --pretty false --incremental false -p tsconfig.json`, `npx biome check packages/layout-pattern-store/src/components/area packages/layout-pattern-store/src/components/shared/props.ts packages/layout-pattern-store/src/components/registry.ts packages/layout-pattern-store/src/__tests__/public-api.test.ts`

## 2026-06-04 - Puck Shared Reference Policy

- 변경: Puck area/component apply에서 같은 component row를 한 area 안에 반복 배치할 수 있도록 node id 중복 허용 정책을 분리함
- 변경: screen-region 저장 projection은 같은 area row가 한 region 안에 반복 배치되면 `duplicate_area_in_region` error diagnostic으로 차단함
- 변경: 공유 component row가 여러 번 배치돼도 `render_area_children` relation만 반복 투영하고 `render_component_children`는 component id 기준 1회만 투영하도록 보강함
- 변경: 기존 `/api/screens/*` DB 조회 패턴에 맞춰 `listPuckCatalogItems()`와 `GET /api/screens/puck-catalog?scope=...`를 추가하고, `@cx/adapters/table`의 area/component 단위 materializer를 재사용하도록 정리함
- 변경: Workbench Puck 편집 진입 시 `screen-region`/`area` scope는 DB Puck catalog API를 lazy load해 Blocks 후보로 사용하고, `component` scope는 기존 component catalog를 유지하도록 연결함
- 이유: area/component row 공유 편집은 의도된 동작으로 유지하되, region 안 area 중복은 금지하고 component 반복 배치는 저장 가능한 관계 모델로 맞추기 위함
- 검증: `pnpm exec vitest run apps/web/src/components/App.test.tsx apps/web/src/lib/screen-db-loader.test.ts packages/adapters/src/__tests__/table-to-render-tree.test.ts packages/adapters/src/__tests__/puck.test.ts apps/web/src/lib/screen-db-save.test.ts`, `pnpm exec tsc --noEmit --pretty false --incremental false`

## 2026-06-02 - Origin Main Figma Export Merge Prep

- 변경: `origin/main`의 Figma export 기능을 현재 로컬 workbench 경계에 맞춰 병합 준비함
- 변경: 원격 `zustand` store, `LeftAside`/`RightAside`/`SaveButton`, server action 기반 저장 경계는 복원하지 않고 로컬 `App` state, `CanvasToolbar`, `@cx/adapters/puck`, `@cx/adapters/table`, `/api/screens/*` 흐름을 유지함
- 변경: `ExportToolbar`를 `useWorkbenchStore` 의존 없이 `ScreenSummary.renderTree` prop 기반으로 수정하고, RenderTree screen node도 Figma build code/json export 입력으로 받을 수 있게 보강함
- 변경: Figma plugin/generated 산출물은 Biome 검사 대상에서 제외하고, 사람이 관리하는 export scripts는 lint 경고 없이 통과하도록 정리함
- 이유: 원격 기능 가치는 살리되 상태관리/DB apply 책임이 앱 전역 store로 다시 섞이지 않게 하기 위함
- 검증: `npm run lint`, `npm test`, `npm run build`

## 2026-06-02 - Adapters Package Transition Complete

- 변경: `@cx/parser` 구현과 Markdown parser 테스트를 `@cx/adapters/markdown`로 이동하고 legacy parser package를 제거함
- 변경: `renderTreeToTableGenerationResult()`를 `@cx/pipeline`에서 `@cx/adapters/table`로 이동하고 projection 테스트를 adapter 테스트로 분리함
- 변경: `@cx/pipeline`은 Markdown parse command facade만 남기고 실제 parsing/projection rule은 `@cx/adapters/*`를 소비하도록 변경함
- 변경: `AGENTS.md`, `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `PIPELINE_STAGE_PROTOCOL.md`, `ADAPTERS_PACKAGE_TRANSITION_PLAN.md`를 완료 상태 기준으로 갱신함
- 이유: `ADAPTERS_PACKAGE_TRANSITION_PLAN.md`의 최종 기준대로 Markdown/Table/Puck 순수 변환을 `@cx/adapters`로 모으고, parser/materializer compatibility 패키지와 pipeline 내 projection 소유를 제거하기 위함
- 검증: `pnpm exec vitest run packages/adapters/src/__tests__/markdown.test.ts packages/adapters/src/__tests__/render-tree-to-table.test.ts packages/adapters/src/__tests__/table-to-render-tree.test.ts packages/adapters/src/__tests__/puck.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, stale import search, `pnpm exec next build apps/web`, `git diff --check`

## 2026-06-02 - Puck Adapter Package Boundary

- 변경: `@cx/adapters` 패키지 shell을 추가하고 public subpath를 `./markdown`, `./table`, `./puck`으로 제한함
- 변경: Web 내부 `apps/web/src/lib/puck-screen-adapter.ts`를 `@cx/adapters/puck`으로 이동하고, Puck UI는 새 subpath를 소비하도록 변경함
- 변경: `apps/web`은 Puck React UI와 save facade만 소유하고, RenderTree <-> Puck editable data 변환은 `@cx/adapters/puck` 계약으로 분리함
- 이유: Puck/Workbench가 앱 내부 helper나 DB row shape에 직접 결합하지 않고 계약 단위로 순수 변환 서비스를 소비하게 하기 위함
- 검증: `pnpm exec vitest run packages/adapters/src/__tests__/public-api.test.ts packages/adapters/src/__tests__/puck.test.ts apps/web/src/components/App.test.tsx`, `pnpm exec next build apps/web`

## 2026-06-02 - Table Adapter Package Boundary

- 변경: `@cx/table-materializer`의 `materializeRenderScreenFromRows()` 구현과 row 타입을 `@cx/adapters/table`로 이동함
- 변경: `apps/web`의 DB loader/save facade가 `@cx/adapters/table` 계약을 직접 소비하도록 변경함
- 변경: `@cx/table-materializer` compatibility re-export 패키지를 제거하고 신규 소비 경계를 `@cx/adapters/table`로 단일화함
- 이유: DB/read-model row bundle -> RenderTree 조립을 format adapter 경계로 모으고, Web facade가 materializer 전용 패키지에 직접 결합하지 않게 하기 위함
- 검증: `pnpm exec vitest run packages/adapters/src/__tests__/table-to-render-tree.test.ts apps/web/src/lib/screen-db-loader.test.ts apps/web/src/lib/screen-db-save.test.ts`, `pnpm exec next build apps/web`

## 2026-06-02 - Core SOT Observation Completion

- 변경: Figma 메인 페이지 SOT `10042:57541`의 관리/검색/쇼핑 home frame 4개를 조회하고 `management-home-screen`, `search-home-screen`, `shopping-home-feed-screen` 후보를 기록함
- 변경: Figma 카드 리스트 SOT `9896:91122`의 구독상품/단말기/혜택/요금제/부가서비스/인터넷 frame 6개를 조회하고 card list scenario/domain skill 후보를 기록함
- 변경: Figma 결과 및 확인 완료 SOT `10090:60588`의 개통/요금제변경/해지/결제 완료 frame 4개를 조회하고 completion/receipt 계열 skill 후보를 기록함
- 변경: `figma-source.md`와 `FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md`의 SOT 관찰 상태와 scenario/domain/atomic skill backlog를 남은 핵심 SOT 3개 결과에 맞게 갱신함
- 이유: PRD/MBR client import의 메인, 카드형 목록, 완료/결과 화면 품질을 올릴 수 있는 SOT 기반 reference와 skill 후보 pool을 완성하기 위함
- 검증: `rg -n "10042:57541|9896:91122|10090:60588|management-home-screen|card-list-screen|completion-feedback-screen|card-list-filter-bar|completion-bottom-actions" docs/design/reference/figma-sot-observations.md docs/design/reference/figma-source.md docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md AGENTS_HISTORY.md`, `git diff --check`
- 후속: 결과 및 확인 완료 SOT `10090:60588`는 section metadata 조회가 타임아웃되어 skill 생성 직전 shallow tree를 재조회한다.

## 2026-06-02 - Text List SOT Observation

- 변경: Figma 텍스트 리스트 SOT `10042:46203`의 `리스트_이용내역`, `리스트_T플러스포인트내역`, `리스트_할인내역`, `리스트_이용안내`, `리스트_공지사항` frame을 조회하고 `figma-sot-observations.md`에 1차 관찰을 기록함
- 변경: 텍스트 리스트 SOT를 `usage-history-list-screen`, `point-history-list-screen`, `discount-history-list-screen`, `faq-guide-list-screen`, `notice-text-list-screen`으로 분리하고 `summary-card-ledger`, `info-text-list-row`, `filter-chip-row`, `month-grouped-info-list`, `faq-accordion-list` 후보를 추가함
- 변경: `figma-source.md`와 `FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md`의 상태와 skill backlog를 텍스트 리스트 관찰 결과에 맞게 갱신함
- 이유: list 계열 screen inference가 summary/filter/search/accordion을 과잉 또는 누락하지 않도록 내역형 리스트와 안내/공지 리스트의 정본 기준을 분리하기 위함
- 검증: `rg -n "텍스트 리스트|10042:46203|10082:58057|10082:58364|10082:58227|10082:43724|10082:47225|text-list-screen|faq-guide-list-screen|summary-card-ledger|info-text-list-row" docs/design/reference/figma-sot-observations.md docs/design/reference/figma-source.md docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md AGENTS_HISTORY.md`, `git diff --check`

## 2026-06-02 - Old Remote Table Consumer Retirement

- 변경: `RENDER_DB_REST_LOADER_TRANSITION_PLAN.md`의 상태를 갱신해 old remote Supabase table은 아직 별도 drop migration 대상이지만, 현재 app/package runtime 소비자는 제거 완료로 구분함
- 변경: old table consumer 검색 기준을 추가하고, `apps/smoke/src/push-render-db-cli.ts`의 local source filename(`screen_routes.json`, `screen_variants.json`)은 remote table consumer가 아님을 명시함
- 변경: `DB_SCHEMA.dbml`의 상태 주석을 갱신해 non-render table이 남아 있어도 current app/package runtime은 이를 소비하지 않아야 한다고 명시함
- 이유: old remote table drop과 old remote table consumer 제거를 분리하고, 현재 Web/Puck/Workbench 경로가 screen DB facade와 `render_*` read model만 쓰는 상태를 명확히 하기 위함
- 검증: `rg -n "(^|[^A-Za-z0-9_])(screen_routes|screen_variants|organisms|component_renderer_kinds)([^A-Za-z0-9_]|$)" apps packages --glob '!**/*.test.ts' --glob '!**/*.test.tsx' --glob '!apps/smoke/src/push-render-db-cli.ts'`, `rg -n "from\\(\\s*['\\\"](screen_routes|screen_variants|screens|organisms|components|component_renderer_kinds)['\\\"]|/rest/v1/(screen_routes|screen_variants|screens|organisms|components|component_renderer_kinds)" apps packages`

## 2026-06-02 - Adapters Package Transition Plan

- 변경: `docs/development/ADAPTERS_PACKAGE_TRANSITION_PLAN.md`를 추가해 `@cx/adapters` 승격 목적, public subpath, 해야 할 책임, 금지 책임, 패키지/앱 반영 범위, 단계별 커밋 단위를 정리함
- 변경: `docs/development/README.md`에 adapter 전환 계획 문서를 등록함
- 이유: Markdown/Table/Puck 변환 로직이 parser, table-materializer, pipeline, web에 흩어진 상태를 순수 adapter layer로 정리하되 IO/AI/React/DB write 책임이 섞이지 않게 하기 위함
- 검증: `rg -n "ADAPTERS_PACKAGE_TRANSITION_PLAN|Forbidden Responsibilities|Development Phases|Commit" docs/development/ADAPTERS_PACKAGE_TRANSITION_PLAN.md docs/development/README.md AGENTS_HISTORY.md`, `git diff --check`

## 2026-06-02 - RenderTree Node Type Contract Constants

- 변경: `@cx/schema`에 RenderTree node type 상수, area node type guard, screen region node type guard를 추가하고 root export/public API 테스트를 보강함
- 변경: `@cx/table-materializer`의 DB row type -> RenderTree node type 변환을 계약 테이블 조회로 정리하고, web DB save/Puck adapter/pipeline table projection의 RenderTree 타입 판정을 schema guard/상수로 교체함
- 이유: `Screen.*`, `area.*` 문자열 literal 판정이 feature별로 흩어져 DB materializer, web save, Puck adapter, pipeline projection의 경계가 느슨해지는 문제를 줄이기 위함
- 검증: `npm test -- --run packages/schema/src/__tests__/public-api.test.ts packages/table-materializer/src/__tests__/public-api.test.ts apps/web/src/lib/screen-db-save.test.ts apps/web/src/lib/puck-screen-adapter.test.ts apps/web/src/lib/screen-db-loader.test.ts packages/pipeline/src/__tests__/render-tree-to-tables.test.ts`, `npx tsc --noEmit --pretty false --incremental false`, `npm run lint`

## 2026-06-02 - Screen DB Loader And Materializer Implementation

- 변경: `origin/main`에 존재하는 Puck prototype을 현재 브랜치로 직접 덮어쓰지 않고, `RenderTreeScreenNode <-> Puck data/config` adapter 방식으로 이식하기로 전환 계획에 명시함
- 변경: `puck-screen-adapter.ts`, `ScreenPuckEditor`, `AreaPuckEditor`를 후보 구현 단위로 잡고, 1차 MVP 범위를 Screen.Contents area reorder와 area child component reorder로 제한함
- 변경: `apps/web/src/lib/puck-screen-adapter.ts`를 추가해 `RenderTreeScreenNode`와 area node를 reorder-only Puck data로 변환하고, Puck 편집 결과를 원본을 mutate하지 않는 RenderTree candidate로 되돌리는 순수 adapter를 구현함
- 변경: `apps/web/src/lib/puck-screen-adapter.test.ts`를 추가해 Screen.Contents area reorder, area 내부 component reorder, unknown/duplicate Puck item diagnostics를 검증함
- 변경: `@measured/puck`을 `apps/web` workspace dependency로 복구하고, `ScreenPuckEditor`/`AreaPuckEditor`를 추가해 Puck UI가 RenderTree adapter를 통해서만 candidate를 만들도록 연결함
- 변경: Workbench rail에 `PCK` 탭을 추가하고, 선택된 `ScreenSummary.renderTree`를 Puck editor로 열어 screen-level reorder candidate를 메모리 상태로 유지하도록 연결함
- 변경: `ARE` 탭에서 선택 화면의 첫 area를 `AreaPuckEditor`로 열고, area-level component order/props 변경을 상위 `RenderTreeScreenNode` candidate에 병합하도록 연결함
- 변경: Puck item props에 `nodePropsJson`을 추가해 RenderTree node `props`를 JSON textarea로 편집할 수 있게 하고, invalid JSON은 adapter diagnostic으로 차단함
- 변경: `apps/web/src/lib/screen-db-save.ts`와 `PUT /api/screens/:screenId/tree`를 추가해 Puck이 publish한 RenderTree candidate에서 region child order와 area child order를 분해하고 DB child relation row를 교체하는 reorder-only apply 경로를 연결함
- 변경: `apps/web/src/lib/screen-db-save.ts`가 component child `props`를 `render_component_children.props`로 함께 투영하고, 기존 DB row의 `variant`는 보존하도록 확장함
- 변경: `apps/web/src/lib/screen-db-save.test.ts`를 추가해 RenderTree candidate가 `render_screen_region_children`/`render_area_children`/`render_component_children` row로 투영되고, unknown component가 write 전 error diagnostic으로 막히는지 검증함
- 변경: `@cx/table-materializer`에 `RenderReadModelRows` row 타입, `MaterializeDiagnostic`, `materializeRenderScreenFromRows()` public API를 추가함
- 변경: `materializeRenderScreenFromRows()`가 `render_*` relational row bundle에서 `RenderTreeScreenNode`를 조립하고, missing screen/region/area/component와 child order 문제를 diagnostics로 반환하도록 구현함
- 변경: `apps/web/src/lib/screen-db-loader.ts`를 추가해 Supabase REST/PostgREST에서 screen rows를 server-side로 조회하고 `loadScreenTree()`에서 materializer를 호출하도록 연결함
- 변경: `apps/web/src/lib/screen-db-loader.test.ts`를 추가해 screen route/list/rows/tree loader와 empty parent id 방어를 mock fetch로 검증함
- 변경: `/api/screens/routes`, `/api/screens`, `/api/screens/:screenId/rows`, `/api/screens/:screenId/tree` Next API facade를 추가함
- 변경: Web screen source가 DB-backed screen summaries와 RenderTree를 직접 사용하도록 연결하고, `SCREEN_SOURCE`/local-table fallback을 제거함
- 변경: Web의 `/api/smoke-runs/apply`와 `smoke-apply` helper를 제거해 `data/tables` 직접 반영은 smoke CLI/migration utility로만 남김
- 변경: `@cx/table-materializer` public export에서 old local-table `materializeTableScreen(s)` API와 관련 타입/테스트를 제거하고, row-based `materializeRenderScreenFromRows()`만 활성 materializer API로 유지함
- 변경: `smoke:apply-tables`, `apps/smoke/src/apply-tables-cli.ts`, `@cx/pipeline/apply`, `mergeRenderTreeIntoTables()`를 제거해 승인된 smoke 결과가 local table JSON에 쓰이는 경로를 닫음
- 이유: local table JSON 중심 preview에서 DB-backed screen read path로 점진 전환하되, 기존 Puck/Web old table 경로를 즉시 제거하지 않기 위함
- 검증: `npm test -- --run apps/web/src/lib/screen-db-save.test.ts apps/web/src/lib/puck-screen-adapter.test.ts apps/web/src/lib/screen-db-loader.test.ts packages/table-materializer/src/__tests__/public-api.test.ts apps/web/src/components/App.test.tsx`, `npx tsc --noEmit --pretty false --incremental false`, `npm run lint`, `npm run build`, 브라우저 검증(`http://localhost:3411`에서 `PCK` 탭 진입, Puck UI 표시, console error 0; 이후 `ARE` 탭 재검증은 browser session route 단절로 보류), REST loader 직접 검증(`screenCount 55`, first tree diagnostics 0), HTTP API 검증(`/api/screens/routes`, `/api/screens`, `/api/screens/NOVA-PRDD-PG-001-0/rows`, `/api/screens/NOVA-PRDD-PG-001-0/tree`)

## 2026-06-02 - Screen DB REST Loader Transition Plan

- 변경: `docs/development/RENDER_DB_REST_LOADER_TRANSITION_PLAN.md`를 추가해 `render_*` relational DB에서 REST loader, `@cx/table-materializer`, Web/Puck/Workbench로 이어지는 전환 계획을 문서화함
- 변경: `render_*` table prefix가 나중에 제거될 예정이므로 코드 파일/API route/env source 이름은 `screen-db-loader.ts`, `/api/screens/*`, `SCREEN_SOURCE=screen-db`처럼 중립 명칭으로 잡음
- 변경: 기존 local table materializer API를 즉시 제거하지 않고 `materializeRenderScreenFromRows()`를 추가한 뒤 `SCREEN_SOURCE=screen-db`로 Web 경로를 점진 전환하는 순서를 명시함
- 변경: old API/table 제거 조건을 Web rail, preview, Puck, Workbench가 모두 screen DB facade를 쓰는 시점으로 고정함
- 변경: 전환 완료 시 기대 효과, 성공 기준, 실행 순서, 예상 위험과 방지 대책을 추가함
- 이유: 기존 Puck/Web 기능을 깨지 않으면서 DB에서 RenderTree를 조립하는 목표 흐름으로 안전하게 이전하기 위함
- 검증: 문서 추가와 development README 링크 반영

## 2026-06-02 - Relational Render DB Activation

- 변경: 기존 Puck/Web이 참조하는 old Supabase table(`screen_routes`, `screen_variants`, `screens`, `organisms`, `components`, `component_renderer_kinds`)은 유지하고, 신규 relational `render_*` read model을 별도 schema로 활성화함
- 변경: `docs/development/DB_SCHEMA.dbml`을 활성 `render_*` ERD/reference로 갱신하고, `supabase/migrations/20260602000004_create_render_relational_tables.sql`로 screen/region/area/component/children 관계와 순서를 정규화한 테이블을 추가함
- 변경: `apps/smoke/src/push-render-db-cli.ts`와 `render-db:push-tables` script를 추가해 `data/tables/*.json`을 `render_*` row로 투영하고 Supabase PostgREST service-role 쓰기로 반영할 수 있게 함
- 변경: `layout.area.areaAppBar` wrapper area를 `area.static`으로 정규화하고, AppBar direct shortcut은 `Screen.Header -> area -> component(AppBar)` 구조로 유지함
- 이유: local inference 결과가 마음에 들면 DB에 등록하고, 이후 DB에서 RenderTree를 조립하는 방향으로 가되 기존 Puck/Web 연결 기능을 깨지 않기 위함
- 검증: `supabase db push`, `npm run render-db:push-tables`, `npm run render-db:push-tables -- --write`, REST row count 확인(`render_screen_routes 3`, `render_screen_variants 13`, `render_screens 55`, `render_screen_regions 165`, `render_screen_region_children 178`, `render_areas 77`, `render_area_children 122`, `render_components 122`, `render_component_children 122`, old table count 유지), `npx tsc --noEmit --pretty false --incremental false`

## 2026-06-02 - Refactor Hygiene Pass

- 변경: component/schema/token README의 금지된 internal/generated import 코드 예시를 public surface 중심 설명으로 교체함
- 변경: local Vercel output과 Playwright/test report 산출물을 `.gitignore`에 추가함
- 이유: import boundary 검색이 문서의 negative example에 걸리지 않게 하고, refactor 분석 대상에서 로컬/generated 산출물 소음을 줄이기 위함
- 검증: public import boundary 검색, `git diff --check`, `npm run lint`

## 2026-06-01 - Product Detail SOT Observation

- 변경: Figma 상품 상세화면 SOT `10069:97828`의 `상세_구독상품`, `상세_기프티콘`, `상세_단말기` frame을 조회하고 `figma-sot-observations.md`에 1차 관찰을 기록함
- 변경: 상품 상세 SOT를 `subscription-product-detail-screen`, `gifticon-product-detail-screen`, `device-product-detail-screen`으로 분리하고 공통 domain skill 후보 `product-hero-info`, `product-detail-media-section`, `notice-accordion-list`, `bottom-purchase-cta`를 추가함
- 변경: `figma-source.md`와 `FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md`의 상태와 skill backlog를 상품 상세화면 관찰 결과에 맞게 갱신함
- 이유: checkout/form SOT 다음으로 상품 상세 계열의 화면 inference와 component promotion 후보를 수집하기 위함
- 검증: `rg -n "상품 상세화면|10069:97829|10069:97927|10069:121732|subscription-product-detail-screen|gifticon-product-detail-screen|device-product-detail-screen|product-hero-info|notice-accordion-list" docs/design/reference/figma-sot-observations.md docs/design/reference/figma-source.md docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md AGENTS_HISTORY.md`, `git diff --check`

## 2026-06-01 - Figma Skill Collection First

- 변경: `docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md`에 Figma SOT 기반 skill 후보 수집을 pipeline 구현 변경보다 우선한다는 현재 작업 결정을 추가함
- 변경: 수집된 skill 후보가 RenderTree node type이 아니라 `DesignSkillSelection`, `CompositionPlan`, `PatternSelection`, `Generate RenderTree`, `Validate/Revise`에 적용되는 판단 규칙임을 문서화함
- 변경: scenario/domain/atomic skill 후보 backlog와 각 후보의 SOT 근거, 상태, 나중에 작성할 핵심 규칙을 추가함
- 이유: 스킬을 먼저 충분히 모은 뒤 schema/orchestration/pipeline 연결을 설계하도록 컨텍스트 회귀를 방지하기 위함
- 검증: `rg -n "Current Working Decision|Skill candidate levels|Skill Collection Backlog|scenario skill과 atomic" docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md AGENTS_HISTORY.md`, `git diff --check`

## 2026-06-01 - Figma Reference Skill Structure Plan

- 변경: `docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md`를 추가해 Figma SOT 확인 후 reference md, domain design skill, orchestration/artifact 구조를 어떻게 개선할지 고정함
- 변경: `docs/development/README.md`에 해당 계획 문서를 활성 개발 문서로 연결함
- 변경: `docs/design/reference/figma-source.md`에 `SKT GenUI Test 0514`의 메인 페이지, 사용자 정보입력, 상품 상세화면, 텍스트 리스트, 카드 리스트, 결과 및 확인 완료 Figma node 링크를 등록함
- 변경: `docs/design/reference/README.md`를 추가하고 `docs/design/README.md`에서 Figma-derived reference contract 위치를 연결함
- 이유: Figma 링크 제공 전후로 컨텍스트가 회귀하지 않도록, 디자인 정본 reference 구조와 component promotion 연동 방향을 문서화하기 위함
- 검증: 문서 추가 및 링크 반영

## 2026-06-01 - Docs Cleanup

- 변경: 완료됐거나 최신 기준 문서에 흡수된 development/superpowers 계획 문서를 `docs/archive/completed-plans/`로 이동함
- 변경: `docs/development/README.md`를 추가해 현재 활성 개발 문서와 archive 이동 기준을 명확히 함
- 변경: archive README와 이동된 superpowers/archive 내부 참조를 새 위치에 맞게 정리함
- 이유: `docs/` 아래 이전 구현 계획과 현재 운영 기준 문서가 섞여 있어 screen inference/pipeline 문서의 기준점을 빠르게 파악하기 어렵기 때문
- 검증: archive 이동 후 docs tree와 잔여 참조를 확인

## 2026-06-01 - Smoke Navigation Rail

- 변경: smoke 비교 화면의 최좌측에 공통 `NavigationRail`을 추가하고, smoke 페이지에서도 워크벤치(`/`)와 smoke(`/smoke`) 간 이동이 가능하도록 레일을 재사용 가능하게 조정함
- 변경: smoke run 선택 패널을 run별 Left/Right 버튼 방식에서 상단 `Left | Right` 슬롯 선택 후 리스트 항목을 고르는 방식으로 변경함
- 변경: smoke run 선택 패널의 상단 슬롯 토글을 제거하고, 패널 내부를 `Left`/`Right` 1:1 상하 영역으로 분리해 각 영역의 리스트에서 직접 비교 대상을 고르도록 변경함
- 변경: smoke 선택 패널 폭을 `clamp(220px,32vw,320px)`로 조정하고 내부 grid/flex/list/button에 `min-w-0`과 overflow 경계를 보강해 선택 패널이 비교 화면 영역을 밀어내지 않도록 함
- 변경: smoke 비교 화면에서 table apply용 `Dry`/`Apply` 액션과 관련 상태/handler를 제거함
- 변경: smoke run 선택 패널의 반복 `ok`/`check` validation 배지를 제거함
- 이유: smoke testbed가 독립 화면이 되면서 기존 워크벤치 네비게이션으로 돌아갈 수 있는 UI 진입/탈출 경로가 필요했기 때문
- 이유: 비교 슬롯 선택과 run 선택을 분리해 여러 run을 빠르게 훑으며 baseline/candidate를 바꾸기 쉽게 하기 위함
- 이유: Left와 Right의 선택 맥락을 동시에 노출해 토글 상태를 기억하지 않아도 비교 대상을 바꿀 수 있게 하기 위함
- 이유: 긴 source path와 action button이 패널 경계를 넘어가면서 preview 영역과 겹치는 화면 문제를 막기 위함
- 이유: 현재 smoke 화면은 조회/비교 테스트베드이며 table 등록 액션은 비교 UI의 책임이 아니기 때문
- 이유: 리스트에 노출되는 smoke run은 이미 최종 산출물 조회 대상이므로 반복 validation 배지가 비교 선택에 유의미한 정보를 주지 않기 때문
- 검증: `SmokeRunExplorer` 네비게이션 테스트 추가

## 2026-06-02 - Render DB Transition Schema

- 변경: `docs/development/RENDER_DB_TRANSITION_PLAN.md`를 추가해 local inference 결과를 `render_*` DB read model로 이전하는 단계별 계획을 문서화함
- 변경: 기존 Supabase schema를 유지한 채 local `data/tables/*.json` shape를 mirror하는 `render_screen_routes`, `render_screen_variants`, `render_screens`, `render_areas`, `render_components` migration을 추가함
- 변경: `render_*` 테이블 API 접근을 위한 grant migration과 `data/tables/*.json`을 Supabase `render_*` 테이블로 upsert하는 `render-db:push-tables` CLI를 추가함
- 변경: `docs/development/DB_SCHEMA.dbml`을 old `pattern_id`/`organisms` 기준에서 `render_*`와 `layout` 기준으로 갱신함
- 이유: 로컬 테이블이 이미 `layout: "layout.area.areaAppBar"` 같은 layout schema를 사용하므로, DB read model도 pattern schema가 아니라 layout schema를 기준으로 RenderTree를 재구성해야 하기 때문
- 검증: `rg '"pattern"|"layout"' data/tables/*.json`, `supabase db push`, `npm run render-db:push-tables -- --write`, `supabase db query --linked` row count 확인(`routes 3`, `variants 13`, `screens 55`, `areas 24`, `components 122`), `npx biome check . --max-diagnostics=80`, `npx tsc --noEmit --pretty false --incremental false`

## 2026-06-02 - Render DB Mirror Schema Retraction

- 변경: 임시 `render_*` mirror table migration을 원격 Supabase에 drop migration으로 제거함
- 변경: `render-db:push-tables` CLI와 smoke README/package script의 활성 노출을 제거함
- 변경: `docs/development/RENDER_DB_TRANSITION_PLAN.md`를 제거하고 `DB_SCHEMA.dbml`은 현재 활성 render DB schema가 없으며 다음 schema는 관계/순서 구조를 JSONB가 아닌 relational-first로 다시 설계해야 한다고 명시함
- 이유: 기존 `render_*` schema가 screen/region/area/composite 관계와 child ordering을 충분히 정규화하지 못하고 nested JSONB를 과도하게 보존했기 때문
- 검증: `supabase db push`, `supabase db query --linked "select table_name from information_schema.tables where table_schema = 'public' and table_name like 'render_%' order by table_name;"` 결과 0 rows

## 2026-06-02 - Relational Render Read Model DBML Draft

- 변경: `docs/development/DB_SCHEMA.dbml`을 실행 migration이 아닌 검토용 Supabase render read model 설계안으로 갱신함
- 변경: `screens -> screen_regions -> screen_region_children`, `areas -> area_children`, `components -> component_children` 관계를 명시하고 render child ordering을 relation table로 분리함
- 변경: 실제 `areas.json`의 area child 69개가 모두 component 참조임을 확인해 `area_children.child_kind`와 `child_area_id`를 제거하고 `component_id`만 남김
- 변경: 실제 `screens.json`의 region 직속 component 53개가 모두 header AppBar shortcut임을 확인해 `screen_region_children`도 area만 참조하도록 정리하고, header AppBar 역시 `Screen.Header -> area -> component(AppBar)` 형태로 정규화하기로 함
- 변경: `component_children.catalog_component_type`은 [catalog.ts](/Users/plusx/Documents/rnd-screen-generator/packages/component/src/catalog.ts)의 component type lookup key로만 두고, DB가 catalog component 정의를 다시 저장하지 않도록 설계함
- 변경: node row의 자기 타입 컬럼은 `type`으로 통일하고 enum 이름만 `screen_variant_type`, `screen_type`, `screen_region_type`, `area_type`처럼 유지함
- 변경: `screen_regions.type: header | contents | bottom`을 region node type의 단일 기준으로 두고 `region_key`, `node_type`, `description`을 제거함
- 변경: node table 명명 규칙을 정리해 `areas.node_type`을 `areas.type`으로 바꾸고, `screen_regions.title`/`order_index`는 region `type`에서 파생되는 값으로 보아 제거함
- 변경: node label 컬럼을 `name`으로 통일해 `areas.title`, `components.title`을 `name`으로 바꿈
- 변경: AppBar wrapper area 54개를 `area.dynamic`에서 `area.static`으로 정규화해 `layout.area.areaAppBar` 영역이 동적 영역으로 오해되지 않게 함
- 변경: `screens.name`과 `screen_type: page | bottomsheet | popup` 기준을 적용하고, row별 source timestamp, `screens.theme_mode`, `screens.min_renderer_version`, `screen_variants.follow_up`은 제거함
- 변경: record metadata는 가능한 한 `name/title`, `description`, `author` 같은 컬럼으로 풀고, JSONB는 component child `props`, component `display`, `hooks: NodeHook[]`처럼 bounded payload에만 남김
- 이유: DB에서 RenderTree를 재구성하되 screen/region/area/composite 관계와 순서를 JSONB에 숨기지 않기 위함
- 검증: local `data/tables/*.json` -> DBML projection 점검 결과 issue 0건, `git diff --check`, `npx biome check . --max-diagnostics=100`, `npx tsc --noEmit --pretty false --incremental false`

## 2026-06-01 - CompositionPlan Design Decision Fields

- 변경: `CompositionPlan` 계약에 `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, `rejectedPatterns`를 필수 디자인 판단 필드로 추가함
- 변경: composition planning agent input이 새 필드를 생성하도록 지시하고, `layout-composition` design-context 문서가 관련 디자인 문서(`COMPOSITION_LAYERS`, `SECTION_PATTERNS`, `SCREEN_PATTERN_SUMMARY`, `LAYOUT_SPACING_CONTRACT`, `INTERACTION_PATTERNS`)와 각 필드를 연결하도록 보강함
- 이유: pattern selection과 RenderTree generation이 섹션 목록뿐 아니라 화면 위계, CTA, 밀도, 패턴 선택/배제 이유를 근거 있는 중간 산출물로 재사용하게 하기 위함
- 검증: `npm test -- --run packages/schema/src/__tests__/public-api.test.ts packages/validation/src/__tests__/validators.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/public-api.test.ts`, `npx biome check packages/schema/src/composition-plan.ts packages/schema/src/index.ts packages/schema/src/json-schema-registry.ts packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/public/agent-inputs.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/validation/src/__tests__/validators.test.ts packages/agent/docs/design-context/layout-composition.md docs/SCREEN_GENERATION_PIPELINE.md`

## 2026-06-04 - Workbench Navigation Area Component Lists

- 변경: web workbench 왼쪽 2차 네비게이션에서 `그룹` 탭은 현재 화면의 Area 목록, `컴포넌트` 탭은 현재 화면의 Component 목록을 표시하도록 연결함
- 변경: Area/Component 선택 상태를 `AppShell`에서 관리해 첫 번째 항목 고정 대신 사용자가 선택한 항목을 Puck edit scope로 전달하도록 수정함
- 변경: component navigation 수집 기준에서 `Screen.*`, `area.*`, `Layout.*` wrapper를 제외하고 leaf component만 리스트 후보로 사용하도록 보정함
- 변경: App 테스트 mock에 RenderTree를 추가하고 Area/Component 탭 전환 및 리스트 표시를 검증하도록 업데이트함
- 이유: 왼쪽 사이드바가 스크린 탐색만 담당하던 상태에서 벗어나, 선택된 화면의 Area와 Component 구조를 바로 확인하고 편집 범위로 진입할 수 있게 하기 위함
- 검증: `pnpm lint`, `pnpm test`, `pnpm build`, `curl -I http://127.0.0.1:3000`. 인앱 브라우저는 로컬 URL 접근이 `net::ERR_BLOCKED_BY_CLIENT`로 차단되어 시각 확인은 수행하지 못함

## 2026-06-04 - Pipeline Persistence API

- 변경: `@cx/pipeline`에 `PipelineRunStatus`, `PipelineRunEvent`, `PipelinePersistenceAdapter` 계약과 파일 기반 persistence adapter를 추가함
- 변경: `screen-generation` 실행 중 `pipeline-status.json`과 `pipeline-events.ndjson`를 run root에 기본 기록하고, `persistence.enabled: false` 또는 custom adapter로 제어할 수 있게 함
- 변경: `PipelineProgressEvent`에 `failed` 상태와 `timestamp`를 추가하고, Node/memory file system adapter에 append I/O를 확장함
- 이유: web/app shell 외부에서도 파이프라인 실행 중 stage 상태를 조회하고, 향후 SSE/WebSocket/queue UI가 pipeline persistence를 직접 소비할 수 있게 하기 위함
- 검증: `pnpm -s exec tsc --noEmit`, `pnpm test -- --run packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/public-api.test.ts apps/web/src/lib/screen-inference-run.test.ts`

## 2026-06-01 - Understand Compose Revise Artifact Docs

- 변경: `SCREEN_GENERATION_PIPELINE.md`, `SCREEN_DESIGN_STAGE_PLAN.md`, `packages/pipeline/README.md`, `apps/smoke/README.md`에 `Understand -> Compose -> Revise` 논리 레이어와 flat artifact + `trace.json` 통합 저장 기준을 반영함
- 변경: 번호 prefix 없는 결과 파일 목록, `trace.json` key 기반 레이어 해석, manifest 포인터 기반 소비 원칙을 문서화함
- 이유: 실제 artifact 저장 구조가 stage 번호 파일에서 flat 결과 파일 + consolidated trace로 바뀌었으므로, 후속 web/smoke 구현이 파일명 추측 대신 manifest/trace 계약을 따르게 하기 위함
- 검증: 관련 문서에서 numeric prefix, trace, layer, quality artifact 표현 검색 확인. `npx biome check`는 Markdown 경로가 현재 설정에서 ignore되어 처리 대상 없음

## 2026-06-01 - Layered Smoke Artifact Implementation

- 변경: smoke run `manifest.json`에 `stageLayers`를 추가하고, `trace.json`에 `layers`를 기록해 `Understand`, `Compose`, `Revise` 논리 그룹을 산출물 계약에 반영함
- 변경: web smoke explorer가 manifest/trace 기반 레이어 요약과 `CompositionPlan` 디자인 판단 필드를 preview 패널에 표시하도록 추가함
- 이유: artifact 파일은 flat하게 유지하면서도 smoke UI와 후속 도구가 파일명 번호나 위치 추측 없이 추론 과정을 레이어 단위로 탐색하게 하기 위함
- 검증: `npm test -- --run packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts apps/web/src/components/smoke/SmokeRunExplorer.test.tsx`, `npx biome check packages/pipeline/src/public/smoke-run-manifest.ts packages/pipeline/src/pipelines/screen-generation/artifact-commands.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts apps/web/src/lib/smoke-runs.ts apps/web/src/components/smoke/SmokeRunExplorer.tsx apps/web/src/components/smoke/SmokeRunExplorer.test.tsx`, `npx tsc --noEmit --pretty false`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md' --run-id 'layered-artifacts-check' --artifact-store local-transient`

## 2026-06-01 - Layered Quality Review Scores

- 변경: `quality-inspection` 계약의 score 축을 `hierarchy`, `separation`, `fidelity`, `actionClarity`, `densityFit`, `patternFit` 6개로 확장하고, finding에 `understand`/`compose`/`revise` 원인 레이어를 선택 필드로 추가함
- 변경: quality review prompt/checklist/output 문서와 fake quality result가 새 score/layer 계약을 따르도록 보강함
- 이유: Revise 단계가 단순 pass/fail이나 3축 점수에 머물지 않고, action 명료성·밀도·패턴 적합성 문제를 Compose/Revise 원인으로 분리해 smoke UI와 재시도 전략에 활용하게 하기 위함
- 검증: `npm test -- --run packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts`, `npx biome check packages/schema/src/quality-inspection.ts packages/schema/src/index.ts packages/schema/src/json-schema-registry.ts packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/public/agent-inputs.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/__tests__/public-api.test.ts`, `npx tsc --noEmit --pretty false`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md' --run-id 'layered-quality-check' --artifact-store local-transient`

## 2026-06-05 - Pipeline Step Definition SSOT Alignment

- 변경: `@cx/pipeline`의 `buildPipeline()`을 `{ stages }` 복사 helper가 아니라 `definePipeline({ steps })` 기반 builder로 변경함
- 변경: `PipelineDefinition` public type을 `StepPipelineDefinition` alias로 전환하고, run status 생성도 `definition.steps`에서 stage order를 읽도록 변경함
- 변경: `screen-generation` 실행 경로에서 `screenGenerationPipelineDefinition.stages` lookup을 제거하고, `definePipeline({ steps: [...] })` 배열이 실행 순서의 SSOT가 되도록 1차 정리함
- 변경: `screen-generation-pipeline.ts` 내부에서 `screenGenerationPipelineDefinition.stages`를 Step으로 변환하던 경로를 제거하고, `createScreenGenerationStepPipeline()`의 `definePipeline({ steps })` 배열이 stage order를 직접 소유하도록 정리함
- 이유: 최신 Step API가 이미 pipeline/step/input/output/AI 여부를 표현하는데, 별도 stage list를 다시 Step으로 변환하던 중복 정의를 줄이기 위함
- 검증: `pnpm exec tsc -p tsconfig.json --noEmit`, `pnpm exec vitest run packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts packages/pipeline/src/__tests__/step-definition.test.ts packages/pipeline/src/__tests__/step-runner.test.ts`, `pnpm exec biome check AGENTS_HISTORY.md packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/runtime/run-pipeline.ts packages/pipeline/src/runtime/build-pipeline.ts packages/pipeline/src/persistence/run-status.ts packages/pipeline/src/public/types.ts packages/pipeline/src/__tests__/public-api.test.ts`

## 2026-06-01 - Design Skill Backlog Planning

- 변경: `docs/development/SCREEN_DESIGN_STAGE_PLAN.md`에 `Phase G - Design Skill Selection`을 추가하고, 초기 구현 스킬 3개와 후속 구현 후보 8개를 기입함
- 변경: 각 design skill 후보에 primary use, required design docs, 도입 순서 이유/완료 기준, 패키지 소유 경계를 함께 명시함
- 이유: Open Design식 skill catalog를 무작정 확장하지 않고, `CompositionPlan` 품질 개선에 필요한 Compose reference부터 점진적으로 구현하기 위함
- 검증: 문서 변경만 수행. `rg -n "Phase G|detail-confirmation-screen|empty-state-guidance" docs/development/SCREEN_DESIGN_STAGE_PLAN.md AGENTS_HISTORY.md`

## 2026-06-01 - Design Skill Verification Criteria

- 변경: `docs/development/SCREEN_DESIGN_STAGE_PLAN.md`의 `Phase G - Design Skill Selection`에 구현 완료 기준, 검증 완료 기준, 최소 검증 명령 세트를 추가함
- 이유: 후속 구현자가 skill 문서 생성에서 멈추지 않고 schema/orchestration/pipeline/trace/smoke UI까지 완료 여부를 확인하게 하기 위함
- 검증: `rg -n "Completion criteria|Verification criteria|trace.json.designSkillSelection|Minimum verification command set" docs/development/SCREEN_DESIGN_STAGE_PLAN.md AGENTS_HISTORY.md`, `git diff --check`

## 2026-06-01 - Design Skill Selection Implementation

- 변경: `@cx/schema`에 `DesignSkillSelectionContract`와 관련 skill id/screen family/quality gate 타입을 추가함
- 변경: `@cx/orchestration`에 `buildDesignSkillSelection()` 순수 helper를 추가하고, composition/pattern/generation/proposal/review/revision agent input context에 선택 결과를 전달함
- 변경: `@cx/pipeline`이 Compose 단계에서 design skill을 선택해 `trace.json.designSkillSelection`에 기록하고, fake `CompositionPlan`에도 선택 skill id를 반영하도록 연결함
- 변경: 초기 design skill 문서 `detail-confirmation-screen`, `form-entry-screen`, `list-selection-screen`을 `packages/agent/docs/skills/design-skills/`에 추가하고, web smoke explorer가 선택 skill/gate/doc count를 표시하도록 보강함
- 이유: Open Design식 skill catalog를 RenderTree runtime이 아니라 `CompositionPlan`과 quality review를 위한 bounded Compose reference로 흡수하기 위함
- 검증: `npm test -- --run packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts apps/web/src/components/smoke/SmokeRunExplorer.test.tsx`, `npx tsc --noEmit --pretty false`, `npx biome check packages/schema/src/design-skill.ts packages/schema/src/versions.ts packages/schema/src/index.ts packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/public/design-skills.ts packages/orchestration/src/public/types.ts packages/orchestration/src/public/agent-inputs.ts packages/orchestration/src/public/generation.ts packages/orchestration/src/index.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/pipelines/screen-generation/artifact-commands.ts packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/screen-generation-tags.test.ts apps/web/src/lib/smoke-runs.ts apps/web/src/components/smoke/SmokeRunExplorer.tsx apps/web/src/components/smoke/SmokeRunExplorer.test.tsx`, `npm run smoke:pipeline -- --target 'data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md' --run-id 'design-skill-selection-final-check' --artifact-store local-transient`, `git diff --check`

## 2026-06-01 - Pipeline Stage Protocol Consolidation

- 변경: `PIPELINE_STAGE_PROTOCOL.md`를 screen-generation stage 순서와 입출력 계약의 정본으로 확장하고, 실제 구현에 존재하는 `propose-components`, `review-quality`, design skill/context 주입, `Understand -> Compose -> Revise` 레이어, flat artifact/trace 기준을 반영함
- 변경: `PACKAGE_MAP.md`와 `packages/pipeline/README.md`의 stage 상세 중복을 줄이고, stage 순서·계약은 `PIPELINE_STAGE_PROTOCOL.md`를 참조하도록 정리함
- 이유: pipeline 구현, stage protocol, package map, package README 사이에 stage 순서와 품질/revision 흐름 설명이 중복되어 불일치가 생기던 문제를 줄이기 위함
- 검증: `rg -n "propose-components|review-quality|stage 순서|PIPELINE_STAGE_PROTOCOL" docs/development/PIPELINE_STAGE_PROTOCOL.md PACKAGE_MAP.md packages/pipeline/README.md AGENTS_HISTORY.md`, `git diff --check`

## 2026-06-01 - Figma SOT Observation Notes

- 변경: `docs/design/reference/figma-sot-observations.md`를 추가하고, Figma 사용자 정보입력 SOT의 `상세_정보입력인풋` frame 관찰을 기록함
- 변경: `docs/design/reference/README.md`와 `figma-source.md`에 SOT 관찰 문서 링크와 현재 분석 상태를 반영함
- 이유: Figma 정본을 바로 skill로 굳히기 전에 화면별 구조, component usage, layout rhythm, inference 적용 후보, skill 승격 후보를 누적하기 위함
- 검증: 문서 변경 후 `rg`와 `git diff --check` 예정

## 2026-06-01 - Figma SOT Skill Preparation Notes

- 변경: `figma-sot-observations.md`에 모든 관찰 기록이 추후 skill 생성을 위한 준비 기록임을 명시함
- 변경: 사용자 정보입력 SOT 묶음에서 `10095:23484`는 `form-entry-screen`, `10095:23501`은 `checkout-additional-info`로 screen family를 분리해 기록함
- 변경: 각 후보 skill별로 실제 skill 생성 직전 재조회할 Figma node, 조회 목적, 작성할 내용을 `Skill creation lookup plan`으로 추가함
- 이유: skill 생성 시 오래된 관찰만 믿지 않고, 어떤 SOT의 어떤 node를 다시 확인해야 하는지와 skill에 어떤 규칙을 써야 하는지를 명확히 하기 위함
- 검증: 문서 변경 후 `rg`와 `git diff --check` 예정

## 2026-06-01 - Figma SOT Recheck And Skill Brief Rewrite

- 변경: `10095:23484`, `10095:23501`을 Figma에서 재조회하고 `figma-sot-observations.md`의 상태를 재조회 완료로 갱신함
- 변경: 사용자 정보입력 SOT 묶음에 `form-entry-screen`과 `checkout-additional-info`의 공통/분리 기준, skill 생성 브리프, 재조회 순서를 추가함
- 변경: `10095:23501`이 confirmation screen이 아니라 `추가 정보 입력` title의 checkout 추가 옵션/배송 정보 화면임을 명확히 기록함
- 이유: 추후 skill 생성자가 SOT를 다시 조회하기 전에도 어떤 node를 왜 볼지, 어떤 내용을 skill에 작성할지 판단할 수 있게 하기 위함
- 검증: 문서 변경 후 `rg`와 `git diff --check` 예정

## 2026-06-01 - User Info SOT Remaining Frames

- 변경: 사용자 정보입력 SOT 묶음의 남은 frame `10161:49136` `상세_결제`, `10161:49258` `상세_장바구니`를 Figma에서 조회함
- 변경: `상세_결제`를 `checkout-payment-screen`, `상세_장바구니`를 `cart-review-screen`으로 1차 분류하고 각각 section order, component/promotion 후보, skill creation lookup plan을 기록함
- 변경: 공통/분리 기준에 `payment-summary-ledger`, `agreement-gate-cta`, `cart-product-list`, `payment-method-selection` 후보를 추가하고 Figma source 상태를 사용자 정보입력 묶음 4개 frame 1차 관찰 완료로 갱신함
- 이유: 사용자 정보입력 SOT 묶음 전체를 본 뒤 checkout 계열 scenario/domain skill 경계를 정리하기 위함
- 검증: 문서 변경 후 `rg`와 `git diff --check` 예정

## 2026-05 엔트리 (축약)

5월 변경은 날짜별 한 줄로만 유지한다. 세부(이유/검증/후속)는 git 이력 참조.

### 2026-05-30

- **Generated Run Lint Scope** — `data/runs/**` 생성 산출물을 Biome 검사 대상에서 제외함

### 2026-05-29

- **Design Context Injection** — `@cx/schema`에 `DesignContextBundleContent`, `ComponentProposalContract`, `QualityInspection.scores`를 추가하고 artifact-kind/JSON Schema에 등록함
- **Decoration Plan Implementation** — `@cx/schema`에 `DecorationPlan` 계약과 JSON Schema를 추가하고 `screen-generation` pipeline에 `derive-decoration-plan` stage를 연결함
- **Region Layout Id Cleanup** — region layout id를 `layout.region.header`, `layout.region.contents`, `layout.region.bottom` 세 개로 정리하고, layout-pattern-store catalog/registry에서 세부 region layout id를 제거함
- **Decoration Plan Implementation Plan** — `docs/development/DECORATION_PLAN_IMPLEMENTATION_PLAN.md`를 추가해 SourceSpec과 RenderTree 사이의 사용자 노출 구조 보강 단계인 `DecorationPlan` 구현 계획을 정리함
- **Smoke Web Testbed Plan** — `docs/development/SMOKE_WEB_TESTBED_PLAN.md`를 추가해 smoke 결과를 web에서 조회/비교하기 위한 테스트베드 계획을 정리함
- **Orchestration File Responsibility Split** — `packages/orchestration/src/public/generation.ts`를 호환 barrel로 축소하고 agent input, source context, design context, next action helper를 각각 `agent-inputs.ts`, `source-context.ts`, `design-context.ts`, `next-action.ts`로 분리함
- **Open Design Inference Adaptation Implementation** — `packages/agent/docs/design-context/`에 `layout-composition`, `interaction-state`, `visual-foundation`, `quality-review` bundle 초안을 추가하고 agent docs README에 반영함
- **Layout Pattern Divider Restore** — `@cx/layout-pattern-store`의 실제 region/area layout component에서 divider prop/default를 해석해 children 사이에 `@cx/components` Divider를 렌더하도록 복구함
- **Open Design Phase 1 Gate Absorption** — `packages/agent/docs/quality-review/checklist.md`에 state coverage, anti-slop, source-fidelity P0/P1 gate를 추가함
- **Boundary Cleanup Pass** — Biome 검사 범위에서 `tmp`, `.claude`, `*.tsbuildinfo`를 제외하고 전역 `biome check .`가 생성 산출물에 막히지 않도록 정리함
- **Page Navigation Panel UI Restore** — `apps/web/src/components/layout/NavigationPanel.tsx`의 SCN 패널에 원격 main 계열의 분할 핸들, 도메인/루트 hover 액션 아이콘, 루트 추가 행을 UI-only 상태로 복구함
- **Web Component Restructure Implementation** — `apps/web/src/components/App.tsx`를 69줄 shell로 축소하고 navigation rail, navigation panel, canvas, inspection panel, screen variant card를 별도 컴포넌트로 분리함
- **Open Design Screen Inference Adaptation Plan** — `docs/development/OPEN_DESIGN_SCREEN_INFERENCE_ADAPTATION_PLAN.md`를 추가해 Open Design의 화면 infer 방식 중 바로 흡수 가능한 gate와 개념적으로 번역할 process를 적용 계획, 성공 기준, 리스크, 예상 화면 품질 기준으로 정리함
- **Web Component Restructure Plan** — `docs/development/WEB_COMPONENT_RESTRUCTURE_PLAN.md`를 추가해 원격 `origin/main`의 web 책임 분리 구조를 현재 재설계 브랜치에 맞게 이식하는 작업 순서와 완료 기준을 정의함
- **Completed Planning Docs Archive** — 완료된 계획/전환 점검 문서를 `docs/archive/completed-plans/`로 이동함
- **Main Merge Documentation Audit** — `codex/table-shaped-pattern-contract` 작업을 로컬 `main`에 merge하고, 문서의 활성 패키지/계약 설명을 현재 구조 기준으로 점검함
- **Renderer Resolver Interpreter Implementation** — `@cx/renderer`를 resolver 기반 interpreter 구조로 전환하고 `interpreter/`, `adapters/`, `runtime/` 디렉토리를 추가함
- **Renderer Interpreter Restructure Plan** — `docs/development/RENDERER_INTERPRETER_RESTRUCTURE_PLAN.md`를 추가해 renderer fallback 제거, resolver 기반 interpreter core 분리, adapter 디렉토리 분리, 디렉토리 재편 작업 단계를 기록함
- **Layout Divider Restore** — `PageStackArea` 계열(`listStack`, `fieldStack`, `checkboxStack`, `accordionList`, `messageStack`)이 `divider: true` prop을 소비해 PageStack contents slot 안에 trailing `Divider`를 렌더하도록 연결함
- **MBR Section Stack Contents** — MBR 화면 53개의 `Screen.Contents` region에 `layout.region.sectionStack`을 명시해 area 사이 section divider가 region 책임으로 렌더되도록 정규화함
- **NOVA-MBR-PG-001-0 Smoke Apply** — `data/client-imports/{id}/260528_mbr/NOVA-MBR-PG-001-0.md` 생성 스모크 결과의 `final-result.json`을 `data/tables`에 등록함
- **Region Rail And Area Layout Guard** — pattern layer 후보 생성이 region layout을 `layout.region.header`, `layout.region.contents`, `layout.region.bottom` 3개 표준 rail로만 만들도록 정리함

### 2026-05-28

- **Layout Rendering Redesign Final Verification** — layout rendering redesign plan의 남은 항목을 최종 감사하고 public surface, catalog shape, renderer table legacy import, table data pattern field를 current state 기준으로 확인함
- **Legacy Pattern Normalization Removal** — `@cx/layout-pattern-store` schema에서 legacy `layout`/`match` catalog record normalization을 제거하고 `layout.*` component catalog entry만 pattern store input으로 허용함
- **Renderer Table Legacy Removal** — `@cx/renderer` public exports에서 `./table`, `./table-view`, `TableScreenView`, `materializeTableScreen(s)`를 제거하고 renderer 내부 table source/test를 삭제함
- **Composite Pattern Catalog Completion** — composite 49개를 `layout.composite.*` component catalog entry로 전환하고 공통 `createCompositeWrapper` component factory를 추가함
- **Area Pattern Catalog Completion** — 남은 area 18개를 `layout.area.*` component catalog entry로 전환하고 `GeneralArea` component group을 추가함
- **Area Collection Pattern Conversion** — `@cx/layout-pattern-store`에 `CollectionArea` component group을 추가하고 option grid, benefit/store list, product list controls, horizontal/row card list 등 area collection 계열 17개를 실제 registered layout component로 전환함
- **Layout Redesign Responsibility Clarification** — layout rendering redesign plan에 `@cx/table-materializer`, `@cx/renderer`, `@cx/layout-pattern-store`, `@cx/layout`, `@cx/components`, `@cx/validation`, `apps/web`의 실행 체크 책임을 보강함
- **Screen Pattern Component Conversion** — `screen-patterns.json` 4개를 `layout.screen.*` component catalog entry로 전환하고 `ScreenShell`, `CommerceDetailScreen`, `TextListScreen`, `CardListScreen` registry component identity를 추가함
- **Region Pattern Component Conversion** — `region-patterns.json` 16개를 `layout.region.*` component catalog entry로 전환하고 `SectionStackRegion`, `PlainStackRegion`, 상품/리스트 contents region component registry를 추가함
- **Table Materializer Boundary** — table-to-RenderTree 순수 변환 경계를 `@cx/table-materializer` 패키지로 확정하고 `AGENTS.md`, `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, layout rendering redesign plan에 반영함
- **Layout Pattern Catalog Inventory** — `docs/development/LAYOUT_PATTERN_CATALOG_INVENTORY.md`를 추가해 screen/region/area/composite catalog 109개 pattern의 legacy id, 새 layout id, 예정 componentID, spacing key, children contract, 전환 상태를 기록함
- **Layout Rendering Redesign Plan** — `docs/development/LAYOUT_RENDERING_REDESIGN_PLAN.md`를 추가해 pattern store의 실제 layout component library 전환, renderer interpreter 전환, table schema 전환, table-to-RenderTree materializer 분리 계획을 정리함
- **PRDD Sidebar Visibility Restore** — `apps/web` 사이드바를 원격 main 기준의 좌측 rail + 380px sidebar 구조로 다시 분리하고, Screen 탭을 도메인/루트 목록과 선택 루트의 variant 목록으로 상하 분리함
- **Area PageStack Responsibility Restore** — `@cx/layout`의 `PageStack`을 단순 `VStack` alias에서 자체 padding, item gap, section padding, item template, title mode marker를 가진 section rail primitive로 복구함
- **Remote Main Sidebar Styling Sync** — `origin/main`의 sidebar 스타일 기준을 현재 `apps/web` 사이드바에 이식해 rail 폭, sidebar 배경, accent active/hover, border, inspector header/content 레이아웃을 맞춤
- **Web Sidebar Table Reconnect** — `apps/web` 화면을 예전 workbench 사이드바 구조에 맞춰 좌측 navigation rail/list, 중앙 preview canvas, 우측 inspector 3열 레이아웃으로 복구함
- **Web Screen Rail Restore** — `apps/web` 첫 화면에 이전 workbench 스타일의 좌측 `SCN/OGN/CMP/SRC/AGT` 아이콘 레일과 route/variant 기반 screen 탐색 패널을 복구하고, `data/client-imports/{id}/260528_mbr` Markdown frontmatter에서 화면 목록을 읽어 선택할 수 있게 함
- **Web App Default Preview Restore** — `apps/web` 첫 화면에서 `final-result.json` 자동 로딩과 `runDir` 상태 패널을 제거하고 기본 앱 preview 화면으로 되돌림
- **Layout Pattern Component Registry** — `@cx/layout-pattern-store`에 `components/`와 `registry/` 구조를 추가하고, 모든 catalog pattern id가 React layout component entry로 resolve되도록 함
- **RenderTree Final Result And Table Apply Boundary** — screen generation의 최종 결과물은 `final-result.json` RenderTree이고, table 반영은 이 RenderTree를 screen/area/composite 레이어로 분해해 등록하는 apply 단계만 수행한다는 기준을 문서화함
- **Final Screen RenderTree Handoff Shape** — 최종 `final-result.json`/테이블 전달 기준을 top-level RenderTree + `Screen` root + `Screen.Header/Contents/Bottom` region + `area.static|area.dynamic` children 형태로 고정함
- **SourceSpec Render Skeleton and Pattern Exploration** — Markdown parser가 화면 구성 표의 섹션 유형/설명/레이아웃/노출 조건/개수/오류 처리와 컴포넌트 상세 표의 props/description/note를 SourceSpec에 구조화해 보존하도록 함
- **Web Final Result Preview** — `apps/web` 첫 화면이 smoke run의 `final-result.json`을 읽어 `@cx/renderer`로 바로 렌더하도록 연결함
- **Final RenderTree Artifact** — screen generation smoke 산출물에 `final-result.json`을 추가하고, agent payload에서 추출한 `renderTree` 자체를 저장하도록 함
- **Source Reference and Component Contract Context** — SourceSpec component node에 `sourceId`, `roleAlias`, `componentType`를 추가하고, area node에 `sourceAreaName`을 추가해 원본 컴포넌트 명과 실제 렌더 컴포넌트 타입을 분리함
- **Agent Reference Asset Absorption** — `docs/development/generation-skills/render-tree-generation/`의 RenderTree 생성 workflow, checklist, output 규칙을 `packages/agent/docs/screen-generation/`의 prompt contract/checklist/output contract로 흡수하고 기존 generation-skills 파일을 제거함
- **Agent Runtime and Pipeline Protocol Docs** — `docs/development/AGENT_RUNTIME_PROTOCOL.md`, `docs/development/PIPELINE_STAGE_PROTOCOL.md`를 추가해 `@cx/agent`, `@cx/orchestration`, `@cx/pipeline`의 실행 계약과 stage/runtime 경계를 별도 SSOT 문서로 분리함
- **Pipeline Runtime Restructure Implementation** — `@cx/pipeline`에 `buildPipeline()`/`runPipeline()` runtime API와 `screen-generation` pipeline definition/stage 구현을 추가함
- **Pipeline Runtime Restructure Plan** — `docs/development/PIPELINE_RUNTIME_RESTRUCTURE_PLAN.md`를 추가해 `apps/smoke -> @cx/pipeline`, `@cx/pipeline -> @cx/orchestration/@cx/agent/@cx/validation/@cx/schema`, `@cx/orchestration -> @cx/schema` 의존성 목표를 문서화함
- **Docker Development Environment** — 루트 `Dockerfile`, `docker-compose.yml`, `.dockerignore`를 추가해 Next.js workbench와 Node 기반 검증 명령을 컨테이너에서 실행할 수 있게 함
- **Generation Skill Smoke Catalog** — `docs/development/generation-skills/render-tree-generation/`에 smoke용 `SKILL.md`, RenderTree 출력 규칙, checklist reference를 추가함
- **Screen Design Stage Seed** — `screen-intent`와 `composition-plan` schema 계약, agent task kind, orchestration input builder, pipeline stage를 추가함
- **MBR ActionButton Size Contract** — MBR 주요 액션 레코드 `action-area-next`, `action-area-guardian-request`, `action-area-next-member-input`, `action-area-join-proceed`, `action-area-dormant-release`, `action-area-eligibility-proceed`를 `button`/`componentButton`에서 `ActionButton`/`componentActionButton`으로 정규화함

### 2026-05-27

- **Table-shaped Pattern Contract** — `@cx/schema`에 `table-generation-result.v0.1` 계약을 추가해 `data/tables` 정본과 같은 screen/region/area/component 중간 산출물 shape를 정의함
- **Pattern Selection Stage** — `@cx/agent`에 `pattern-selection` task를 추가함
- **Smoke/Pipeline IO Boundary Cleanup** — `@cx/pipeline`에 `source-artifact-read` side effect command와 executor를 추가해 smoke source file read를 pipeline으로 이동함
- **Screen Revision Smoke Step** — generation plan에 `revise-render-tree-if-invalid` step과 revision 후 재검증 step을 추가함
- **SourceSpec Component Raw Source** — `SourceSpecComponentNode`에 `raw.displayText`, `raw.bindingSource`, `raw.note`를 추가함
- **Generation Step Contract** — generation plan step id 정본을 `GENERATION_PLAN_STEP` const contract로 분리하고 `GenerationPlanStepKind`를 해당 const에서 파생하도록 정리함
- **Generation Plan Orchestration** — `@cx/orchestration`에 작은 `buildGenerationPlan` API와 generation plan step 타입을 추가함
- **RenderTree Schema Validation** — RenderTree 계약을 좁혀 top-level `metadata.title`을 제거하고 node `metadata.title`만 필수로 유지함
- **Schema Contract Package** — `@cx/schema` 패키지를 추가해 generation pipeline 전반 DTO/schema 계약의 SSOT를 만들고 root export만 공개하도록 함
- **Smoke App Promotion** — `tests/smoke` 하네스를 `apps/smoke`의 `@cx/smoke` workspace app으로 격상함
- **Generation Smoke Harness** — `scripts/smoke-generation-pipeline.ts`의 실행 본문을 `tests/smoke/generation/*` 하네스로 분리하고 CLI는 인자 처리와 summary 출력만 담당하도록 축소함
- **Global Package Map** — 루트 전역 문서 `PACKAGE_MAP.md`를 추가해 활성 패키지의 책임, 주요 기능, public surface, 관계망을 한 곳에서 볼 수 있게 함
- **Smoke Pipeline Script** — `scripts/smoke-generation-pipeline.ts`를 추가해 사용자가 `client-imports`의 Markdown 파일을 직접 지정해 md -> SourceSpec -> screen-generation AgentTaskInput -> fake agent query 흐름을 실행할 수 있게 함
- **Orchestration Screen Generation Input** — `@cx/orchestration`에 `buildScreenGenerationAgentInput`을 추가해 `SourceSpec`을 `@cx/agent`의 `screen-generation` 입력으로 조립하도록 함
- **Pipeline Parser Issue Envelope Cleanup** — `runParseMarkdownSourceCommand` 결과에서 pipeline `issues`와 `commands[].issues` 복제를 제거하고 `parseResult.issues`만 남기도록 정리함
- **Parser PRDD Table Extraction** — `@cx/parser`가 PRDD Markdown의 `화면 ID`, `화면 명`, `화면 구성` 표, `컴포넌트 상세` 표를 SourceSpec으로 추출하도록 확장함
- **Generation V2 Schema Version Normalize** — generation-v2 schemaVersion을 `*.mock.v1`에서 정규 계약 버전 `*.v0.1`로 변경함
- **Pipeline MVP Directory Split** — `@cx/pipeline` MVP 구조를 `commands`, `runner`, `executors`, `adapters`, `errors`, `testing` 디렉토리로 분리함
- **Parser MVP and Pipeline Adapter** — `packages/parser`에 `@cx/parser` 패키지를 추가하고 Markdown source bundle을 SourceSpec으로 정규화하는 `parseMarkdownSourceBundle` public API를 추가함
- **Validation First Implementation** — `@cx/validation`에 `validateAgentResult`, `validateComponentUsage`, `validateRenderTree`, `validateLayoutProps` public API를 추가함
- **Renderer Naming Cleanup** — renderer public component/function 이름을 `RenderTreeView`, `RenderNodeView`, `renderJsonNode`로 정리하고 registry 타입을 `NodeRenderer`, `NodeRenderContext`, `NodeRendererDefinition`, `NodeRendererRegistry`로 변경함
- **Renderer Functional Directory Split** — `@cx/renderer` 내부를 `tree/`, `registry/`, `render/`, `nodes/`로 재배치해 RenderTree JSON 해석, renderer 연결표, 재귀 렌더 실행, 구조 node 렌더 정의의 책임을 분리함
- **Master Plan Direction Document Restore** — `MASTER_PLAN.md`를 제품 방향성, 핵심 원칙, 목표 흐름, 고도화 순서 중심의 루트 전역 문서로 다시 추가함
- **Orchestration Validation Pipeline Boundary Allocation** — `packages/orchestration`의 `@cx/orchestration` 패키지를 추가하고 root, `./contract`, `./types` public subpath를 할당함
- **Pipline Side Effect Package Allocation** — `packages/pipline`에 `@cx/pipline` 패키지를 추가하고 root, `./contract`, `./types` public subpath를 할당함
- **Layout Package Public Boundary** — `@cx/layout`에 `src/public/chrome.ts`, `src/public/primitives.ts`, `src/public/style.ts`, `src/public/types.ts`, `src/public/contract.ts` 공개 표면을 추가함
- **Layout Pattern Store CRUD API** — `@cx/layout-pattern-store` package exports를 루트 catalog API, `./resolver`, `./mutations`, `./types` 명시 subpath로 재정리함
- **Component Package Structure Split** — `packages/component/src/components/`로 정본 component 구현을 이동하고, candidate 구현 위치로 `packages/component/src/candidates/`를 추가함
- **Layout Pattern Store Rename** — `packages/pattern-store`를 `packages/layout-pattern-store`로 옮기고 패키지명을 `@cx/layout-pattern-store`로 변경함
- **Outdated Planning Docs Removal** — 오래된 책임 경계를 담고 있던 `MASTER_PLAN.md`, `docs/development/AGENT_MODULE_BOUNDARY.md`, `docs/development/DEVELOPMENT_ARCHITECTURE.md`, `docs/development/DATA_MAP.md`를 제거함
- **Renderer Package Rename** — `packages/engine` / `@cx/engine`을 `packages/renderer` / `@cx/renderer`로 이름 변경하고 앱 import, Next transpile package, workspace lockfile, 운영/프로젝트 구조 문서의 현재 기준 참조를 갱신함
- **Pattern Store Package Restore** — 삭제됐던 `packages/pattern-store`를 복구하고 `@cx/types` 의존 없이 내부 `types.ts`와 `schema.ts`가 pattern/preset/ref 계약과 zod 검증을 직접 소유하도록 정리함
- **Token Package Public Boundary** — `@cx/tokens`의 공개 export를 `@cx/tokens`, `@cx/tokens/variables.css`, `@cx/tokens/tailwind.css`로 정의하고 `packages/token/README.md`에 공개/내부 경계를 문서화함
- **Component Package Public Contract** — `packages/component/README.md`를 추가해 `@cx/components` 외부 사용법, 단일 catalog 공개 원칙, `components`/`candidates`/`type`/`catalog`/`tokens`/`__tests__` 디렉토리 책임을 명시함
- **Claude Agent Package Boundary** — `packages/agent`를 Claude Agent SDK local-first 실행 adapter 패키지로 다시 추가하고 README에 디렉토리 책임과 public adapter 호출 경계를 기록함
- **Web App Consumer Reset** — `apps/web/src/data`, `apps/web/src/model`, `apps/web/src/server`, `apps/web/src/app/api`, `apps/web/src/adapters`를 제거함
- **Redesign Package Reset** — `packages/agent`, `packages/importer`, `packages/types`, `packages/workflow`, `packages/pattern-store`를 제거함
- **Types Contract Directory Split** — `@cx/types`의 실제 계약 파일을 `src/contracts/*`로 이동하고 `src/contracts/index.ts`를 중앙 contract barrel로 추가함
- **Business Flow Simplification** — 제품/문서 기준 흐름을 `명세 -> 품질 검수 -> 미리보기 -> 반영` 4단계로 정리하고, `DraftTables`, `QualityReport`, `QualityBacklog`, `Promote`는 내부 구현 산출물 이름으로 내림
- **Engine Boundary Split** — `packages/renderer`를 `packages/engine` / `@cx/engine`으로 변경하고 public surface를 `client-import`, `renderer`, `materializer` 세 영역으로 정리함
- **Remove Orphan Legacy Surfaces** — legacy asset pipeline, design-review, deck builder, Agent SDK runtime adapter, component-pattern-store, ai-deck/component-pattern 타입, legacy web registry view와 관련 fixture 산출물을 제거함
- **Remove Experimental Composition Surface** — `database/client-imports/PRDD/variants/` 76개 deferred PRDD 파일, `docs/agents-history/2026-05.md`, `database/AI-COMPOSITION-SPEC.md`를 제거함
- **Product Summary Placeholder Values** — 상품 상세 핵심 요약 화면의 운영 테이블 샘플 표시값을 첨부 화면 기준으로 `iPhone 16 Pro`, `Apple / 스마트폰 / 월 50,000원`, `가입가능`, `혜택`, `T 우주패스 제휴 혜택 제공`으로 교체함
- **MBR Bottom ActionButton CTA** — `bottom-action-area` area pattern의 기대 component type을 일반 `button`에서 `action-button`으로 좁힘
- **MBR Auth Request Layout** — `auth-code-entry` area pattern을 추가하고 `ogn-mbr-auth-request`에 적용함
- **MBR AppBar Headers** — `NOVA-MBR-*` 53개 화면의 빈 `Screen.Header`에 화면별 `mbr-appbar-*` AppBar component를 추가함
- **MBR Auth Method List Pattern** — `@cx/pattern-store` area catalog에 `auth-method-list` 패턴을 추가하고 `ogn-mbr-auth-select`에 적용함
- **MBR Guardian Result Placement** — `NOVA-MBR-FP-001-0/E1/E2/E3`에서 `ogn-mbr-guardian-result`를 `Screen.Bottom`에서 `Screen.Contents`의 `ogn-mbr-guardian-input` 다음으로 이동함
- **MBR Tables Promote** — 복구한 예전 MBR 테이블과 현재 운영 테이블을 병합한 후보본을 `database/tables` 운영 테이블로 반영함
- **Archetype Choice Becomes LLM Decision** — `packages/agent/src/compose-screen/scaffold.ts`에서 `ARCHETYPE_KEYWORDS` 가중치 매처와 `buildArchetypeScaffold()`를 제거하고, `ARCHETYPE_SCAFFOLD_CATALOG` + `lookupArchetypeScaffold` + `listArchetypeCatalog`만 남김
- **Scaffold And Component Pattern Docs** — `AGENTS.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`에 archetype scaffold, componentPattern, layout pattern의 책임 경계를 명시함
- **Preview Pipeline Always Runs** — `scripts/preview-pipeline-output.ts`가 저장된 `database/ai-imports/pipeline-smoke-output.json`을 읽지 않고, PRDD 원문과 generated deck을 읽어 `runPipeline`을 매번 실행하도록 전환함
- **Coupon Component Surface** — `@cx/components`에 `Coupon` 혜택 카드 surface를 추가하고 component catalog/shared render kind에 `coupon`을 등록함
- **Area Intent Display Boundary** — Composition materializer가 `area.intent`를 `metadata.title` 또는 `props.name`으로 자동 승격하지 않도록 분리함
- **OptionList Component Surface** — `@cx/components`에 `OptionList`를 추가해 기존 `OptionCard` 반복 선택 묶음을 실제 render component surface로 제공함
- **Component Pattern Store Package** — reusable semantic UI block registry를 위한 `@cx/component-pattern-store` 패키지를 추가하고 registered/proposed componentPattern catalog 위치를 확정함
- **RenderTree Responsibility Docs Sync** — 루트 `AGENTS.md`의 RenderTree Projection 책임 분리를 현재 `Register -> Composer -> Decorator -> Design Review -> Materializer -> @cx/renderer` 단계 흐름에 맞게 갱신함
- **Supabase Skeleton Cleanup** — 당장 사용하지 않는 `supabase/migrations`, `supabase/seed` 골격 디렉토리의 tracked `.gitkeep` 파일을 제거함
- **PRDD Base Screen Import Split** — `database/client-imports/PRDD/screen/`에는 `*-0.md` base 화면 17개만 남기고, `*-1.md`, `*-2.md`, `*-E*.md` 비-base 화면 76개를 `database/client-imports/PRDD/variants/`로 이동함
- **Pattern Store Package Migration** — `database/pattern-store/*.json` 원천을 `packages/pattern-store/src/catalog/*.json`로 이동하고 `@cx/pattern-store` 패키지에 schema/store/resolver/barrel export를 추가함
- **ButtonMore TextButton Absorption** — `TextButton` component catalog alias에 `ButtonMore`, `ButtonMoreProduct`, `button-more`, `button-more-product`를 추가해 Figma 더보기 레이어를 실제 render surface로 흡수함
- **PageStack Section Model Hardening** — `ChildWrapPreset`/pattern schema/design-review schema에 `titleMode`, `itemTemplate`, `slotInsetX`, `sectionGap`을 추가해 Figma Pagestack의 ContentsTitle hidden/visible, Card 0/Default 20 template, slot inset, section gap 힌트를 보존할 수 있게 함
- **Simplification Parallel Plan** — 생성 파이프라인 고도화를 유지하되 MVP active path를 `source -> draft tables -> validate -> preview -> quality report -> promote`로 단순화하는 병렬 실행 계획을 추가함
- **Simplification Parallel Work Start** — `docs/development/AGENT_MODULE_BOUNDARY.md`를 추가해 `packages/agent` 모듈을 active/experimental/legacy로 분류함
- **Plan Harness Pipeline Boundary**
- **SourceSpec Region Tree Outline** — SourceSpec `sourceShape`를 flat `screen.areas + components[]`에서 `screen.regions[].children[]` tree outline으로 변경함
- **Parser Reserved Area Slots** — `@cx/parser`가 PRDD 예약 영역 번호를 우선 해석하도록 보강함. `0`은 `screen.header`, `999`는 `screen.bottom` 대상 slotHint로 고정한다.
- **Schema Public Subpaths** — `@cx/schema`에 artifact 계약별 공개 subpath를 추가하고, parser/orchestration/smoke 일부 소비 코드를 `@cx/schema/source-spec`, `@cx/schema/versions`로 좁힘
- **Agent Runtime Model Default** — `@cx/agent` Claude runner가 `model` 옵션, `CLAUDE_GENERATION_MODEL`, 패키지 기본값 순서로 생성 모델을 해석하도록 추가함

### 2026-05-26

- **Filter Sorting Component Surface** — `@cx/components`에 `FilterSorting` 실제 render component를 추가하고 public export, component catalog, renderer shared kind(`filter-sorting`)에 연결함
- **Product List Card Component Surface** — `@cx/components`에 `ListProductHorizontal`, `ListProductRow` 실제 render component를 추가하고 public export, component catalog, renderer shared kind(`product-card`)에 연결함
- **Figma Product Detail Subtype Pattern QA** — Figma `SKT GenUI Test 0514` `Page (상세-상품)` section(node `10069:97828`)의 구독상품/기프티콘/혜택브랜드/단말기 variants를 region/area/composite subtype별 pattern-store metadata로 보강함
- **Figma Card List Pattern Scaffold QA** — Figma `SKT GenUI Test 0514` `Page (리스트-카드)` section(node `9896:91122`)의 요금제/단말기/구독상품/혜택/부가서비스/인터넷 variants를 screen/region/area/composite layer별 pattern-store metadata로 보강함
- **Design Foundation Deck Inclusion** — `DESIGN_FOUNDATION.md`를 `DesignDocumentId`와 design deck whitelist에 추가해 Compose/Decorate가 토큰·컬러·타이포그래피·radius·spacing 근거로 참조할 수 있게 함
- **Composition Validator Traceability Hardening** — Compose validator가 `sourceRefs[]` 내부의 screen/area/component 참조를 PRDD Screen Record와 대조하도록 보강함
- **Composition Validator Strictness Clarification** — `database/AI-COMPOSITION-SPEC.md`에서 decision-level `designRefs[]`를 항상 필수로 두지 않고, high emphasis·재구성/합성 근거·decision-level layoutPatternDraft·모호 판단인 경우에만 hard requirement로 좁힘
- **Composition Creative Freedom** — `database/AI-COMPOSITION-SPEC.md`의 Schema B에 `screen.strategy`, area `compositionAction`, `sourceRefs[]`, `visualIntent`, decision `emphasis`, synthetic area 추적 필드를 추가함
- **Compose Owns Layout Draft** — `database/AI-COMPOSITION-SPEC.md`에서 Compose가 `docs/design/` 기반 design deck과 layoutPatternStore deck을 입력받아 componentPattern뿐 아니라 layoutPattern 1차안까지 작성하도록 책임을 확장함
- **AI Composition Remaining Decisions** — `database/AI-COMPOSITION-SPEC.md`의 남은 결정 사항을 순차 확정함
- **AI Composition Pattern Terminology** — `database/AI-COMPOSITION-SPEC.md`에서 Compose가 다루는 재사용 UI 조합을 `componentPattern`, Decorate가 다루는 배치 recipe를 `layoutPattern`/`layoutPatternStore`로 분리함
- **AI Composition Decision Schema** — `database/AI-COMPOSITION-SPEC.md`에 LLM #1 Compose의 주 산출물인 Schema B `CompositionOutput`/`CompositionDecision` 계약을 추가함
- **AI Composition Spec Register Boundary** — `database/AI-COMPOSITION-SPEC.md`에서 LLM #1의 `Extract+Compose` 표현을 제거하고, deterministic Register가 Schema A(Extended Registered)를 만든 뒤 LLM #1 Compose가 semantic composition decision만 수행하도록 경계를 정리함
- **Compose Placement Review** — Compose AI가 prop 보정뿐 아니라 잘못된 screen region 배치 후보를 `placements`로 제안하고, bottom에 들어온 비-system area를 contents로 재배치할 수 있도록 확장함
- **Agent Artifact Cleanup** — 생성 파이프라인의 `client-import.parsed.json`, `client-import.validation.json`, `client-import.materialized.json` 출력을 제거하고 `agent-assets.*.json`만 AI import 산출물로 남기도록 정리함
- **Composition Materializer Area Preservation** — `materializeComposition`이 header/contents/bottom 모든 slot의 Compose area를 `DatabaseAreaRow`로 보존하고, screen region children은 component 직접 참조 대신 area 참조로 일관화함
- **Commerce Detail Scaffold Vocabulary** — Figma `SKT GenUI Test 0514` fileKey `ovg86eZdOa16MRWkuQXY7s`, node `12449:8336`의 `Page (상세-정보입력)` 레이어를 확인해 상세/장바구니/결제 화면의 반복 block metadata를 scaffold 어휘에 반영함
- **AI Context Deck SOT Boundary** — `database/catalog/generated/`를 `database/generated-decks/`로 리네임하고, 원천 catalog가 아니라 재생성 가능한 AI prompt/validation context deck 산출물로 문서화함
- **Decorator Vocabulary Retry Hints** — layoutPattern validator가 unknown/incompatible ID를 발견하면 node kind에 맞는 `suggestions[]` 후보를 issue data와 retry hint에 포함하도록 보강함
- **Pipeline Preview Renderability** — Composition materializer가 preview 산출 시 `component-fallback`, `screen-region-default`, 구식 `patternId/patternVariant` 없이 pattern-store의 구체 pattern ref와 `minRendererVersion`을 쓰도록 정리함
- **Archetype Scaffold Contract** — Compose 앞단에 deterministic `Archetype Scaffold`를 추가해 PRDD 어휘 기반으로 `commerce-detail`, `form-entry`, `agreement-flow`, `confirmation`, `list-browse`, `support`, `generic-detail` 원형과 required/optional block 골격을 산출하도록 함
- **Design Review Contract Tables** — Design Review의 CTA 판정, operation dispatch, placement 처리, synthetic action area 생성을 contract table과 pattern-store reference로 분리함
- **Design Review Apply Expansion** — `createComposite`가 `Layout.Flex` composite wrapper로 적용되고 materialize/render projection까지 nested children을 전달하도록 확장함
- **Design Review Schema** — Design Review patch 스키마를 추가하고 `moveComponent`, `updatePattern`, `createNewPattern`, `createComponent`, `createComposite`, `setDisplay`, `updateComponentProps` operation을 정의함
- **Node Type Taxonomy** — `@cx/types`에 node type taxonomy 계약을 추가해 `screen.*`, `Screen.*`, `area.*`, layout/wrapper/system type을 분리함
- **Data Agent** — `tablesToRenderTree`/`tablesToRenderTrees` projection을 `apps/web` adapter에서 `@cx/renderer`의 `render-tree-projection.ts`로 이동하고, renderer가 table shape -> RenderTree DTO -> React render 책임을 갖도록 조정함
- **Data Agent** — `@cx/renderer`의 public 입력 타입/API를 `WireframeNode` 계열에서 `RenderTreeNode`/`RenderTree`/`RenderTree*Renderer` 계열로 변경하고, render tree를 DB로 되돌리는 `renderTreeToTables` 역변환 adapter를 제거함
- **Data Agent** — `pattern-store` layout preset의 `props`를 `layoutProps`로 좁히고, `WireframeNode`를 저장/편집 관리 모델이 아니라 `@cx/renderer` 입력용 render projection DTO로 문서화함
- **Data Agent** — `components.json` row를 component render row로 정리하고, `composite`는 2개 이상의 `@cx/components`가 결합된 wrapper 의미로만 남기도록 계약/코드/문서를 갱신함
