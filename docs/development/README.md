# Development Documents

이 디렉토리는 현재 개발자가 따라야 하는 운영 기준 문서만 둔다. 완료됐거나 최신 기준 문서에 흡수된 구현 계획은 [archive](/Users/plusx/Documents/rnd-screen-generator/docs/archive/README.md)로 이동한다.

## 문서 책임 기준

| 분류 | 책임 | 보관 위치 |
|---|---|---|
| 전역 제품/운영 기준 | 제품 방향, 패키지 관계, 에이전트 운영, 변경 이력 | 루트 `MASTER_PLAN.md`, `PACKAGE_MAP.md`, `AGENTS.md`, `AGENTS_HISTORY.md` |
| 개발 운영 기준 | 저장소 구조, runtime 계약, stage 계약, DB/Docker 참고 | `docs/development/` |
| 디자인 정본 | Figma-derived 패턴, spacing, component inventory, interaction 기준 | `docs/design/` |
| 생성 과정 상세 해설 | 현재 screen-generation 단계별 입력, prompt, output, artifact 해설 | `docs/SCREEN_GENERATION_PIPELINE.md` |
| 진행 중인 설계 계획 | 아직 완료되지 않은 reference 수집, Puck 편집 등 작업 계획 | `docs/development/` 또는 책임별 하위 폴더 |
| 완료된 계획 기록 | 구현 완료, 전환 완료, 최신 기준 문서에 흡수된 계획 | `docs/archive/completed-plans/` |

운영 문서는 같은 내용을 중복 설명하지 않는다. 상세 책임은 하나의 SSOT 문서에 두고, 다른 문서는 해당 문서로 링크한다.

## 현재 운영 기준 문서

| 문서 | 책임 |
|---|---|
| [AGENT_RUNTIME_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/AGENT_RUNTIME_PROTOCOL.md) | Claude Agent SDK 실행 계약, local-first/fallback 기준 |
| [API_ENDPOINTS.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/API_ENDPOINTS.md) | Web client가 호출하는 Next.js API route 표면과 endpoint 작성 기준 |
| [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md) | pipeline stage/runtime artifact 계약 |
| [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md) | 저장소 구조와 패키지 경계 |
| [DB_SCHEMA.dbml](/Users/plusx/Documents/rnd-screen-generator/docs/development/DB_SCHEMA.dbml) | Supabase DB schema ERD/reference. 기존 Puck/Web table은 유지하고 신규 `render_*` relational read model을 별도 운영함 |
| [FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md) | Figma SOT 기반 reference md/domain skill/orchestration 구조 개선 계획 |
| [DOCKER.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DOCKER.md) | Docker 개발 환경 참고 |

## 현재 활성 하위 계획

| 문서 | 책임 |
|---|---|
| [CATALOG_FACADE_ALIGNMENT_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/CATALOG_FACADE_ALIGNMENT_PLAN.md) | `@cx/components/catalog`와 `@cx/layout-pattern-store/catalog`의 public facade, export subpath, candidate/lookup/list API 통일 계획 |
| [PIPELINE_STEP_REFERENCE_MANIFEST_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STEP_REFERENCE_MANIFEST_PLAN.md) | `defineStep`에서 step별 참조 자료, named output, output contract를 직관적으로 파악하기 위한 개선 계획 |
| [PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md) | Puck 편집 패널 개선 rollout 상위 계획 |
| [WEB_API_CONSUMPTION_HOOK_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/WEB_API_CONSUMPTION_HOOK_PLAN.md) | Browser-facing UI가 `/api/*` endpoint만 소비하도록 hook 경계를 정리하는 계획 |
| [puck-edit/](/Users/plusx/Documents/rnd-screen-generator/docs/development/puck-edit) | Puck 편집 패널 rollout별 세부 계획 |

## Archive 이동 문서

다음 문서는 구현 완료 또는 최신 운영 기준 문서에 흡수되어 `docs/archive/completed-plans/`로 이동했다.

| 문서 | 현재 기준 |
|---|---|
| [ADAPTERS_PACKAGE_TRANSITION_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/ADAPTERS_PACKAGE_TRANSITION_PLAN.md) | `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`의 `@cx/adapters` 책임 |
| [RENDER_DB_REST_LOADER_TRANSITION_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/RENDER_DB_REST_LOADER_TRANSITION_PLAN.md) | `DB_SCHEMA.dbml`, `PROJECT_STRUCTURE.md`, `PACKAGE_MAP.md`의 screen DB/read model 경계 |
| [SCREEN_DESIGN_STAGE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/SCREEN_DESIGN_STAGE_PLAN.md) | `PIPELINE_STAGE_PROTOCOL.md`, `docs/SCREEN_GENERATION_PIPELINE.md` |
| [NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md) | `PIPELINE_STAGE_PROTOCOL.md`, Web screen inference 구현 |
| [INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md) | `PIPELINE_STAGE_PROTOCOL.md`, `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md` |
