# Development Documents

이 디렉토리는 현재 개발자가 따라야 하는 운영 기준 문서만 둔다.

| 문서 | 책임 |
|---|---|
| [AGENT_RUNTIME_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/AGENT_RUNTIME_PROTOCOL.md) | Claude Agent SDK 실행 계약, local-first/fallback 기준 |
| [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md) | pipeline stage/runtime artifact 계약 |
| [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md) | 저장소 구조와 패키지 경계 |
| [DB_SCHEMA.dbml](/Users/plusx/Documents/rnd-screen-generator/docs/development/DB_SCHEMA.dbml) | Supabase DB schema ERD/reference. 기존 Puck/Web table은 유지하고 신규 `render_*` relational read model을 별도 운영함 |
| [ADAPTERS_PACKAGE_TRANSITION_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/ADAPTERS_PACKAGE_TRANSITION_PLAN.md) | `@cx/adapters` 패키지 승격 계획, 금지 책임, 단계별 커밋 기준 |
| [RENDER_DB_REST_LOADER_TRANSITION_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/RENDER_DB_REST_LOADER_TRANSITION_PLAN.md) | `render_*` DB read model을 materializer, REST loader, Web/Puck 경로에 연결하는 전환 계획 |
| [SCREEN_DESIGN_STAGE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_DESIGN_STAGE_PLAN.md) | 현재 screen generation inference layer 확장 계획 |
| [NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md) | DnD 기반 새 화면 추론, 진행 상태, 단계별 검수, 승인 후 DB 등록 라이프사이클 계획 |
| [INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md) | 현재 screen inference 품질 보존 기준 Step migration rollout, inference node graph, pipeline executor, prompt node, validation/decision feedback route, SSE 전환 계획 |
| [FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/FIGMA_REFERENCE_SKILL_STRUCTURE_PLAN.md) | Figma SOT 기반 reference md/domain skill/orchestration 구조 개선 계획 |
| [DOCKER.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DOCKER.md) | Docker 개발 환경 참고 |

완료됐거나 최신 기준 문서에 흡수된 구현 계획은 [archive](/Users/plusx/Documents/rnd-screen-generator/docs/archive/README.md)로 이동한다.
