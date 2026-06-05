# Documentation Archive

이 디렉토리는 현재 운영 기준 문서는 아니지만, 완료된 설계 결정과 전환 과정을 추적해야 하는 문서를 보관한다.

현재 패키지 책임과 구조는 루트 `PACKAGE_MAP.md`, `MASTER_PLAN.md`, `AGENTS.md`, `docs/development/PROJECT_STRUCTURE.md`를 우선 기준으로 본다.

## 보관 기준

- 구현이 완료되어 히스토리 추적 용도로만 남은 계획 문서
- 최신 운영 문서에 내용이 흡수된 이전 설계 문서
- 단발성 검증 로그, 실험 계획, 외부 workflow용 실행 계획

## 현재 보관 묶음

- `completed-plans/`: 완료된 package/runtime/web/smoke/design inference 관련 계획과 검증 로그

## 최근 이동된 개발 계획

| 문서 | 이동 이유 | 현재 기준 |
|---|---|---|
| [ADAPTERS_PACKAGE_TRANSITION_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/ADAPTERS_PACKAGE_TRANSITION_PLAN.md) | `@cx/adapters` 승격 완료 | `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md` |
| [RENDER_DB_REST_LOADER_TRANSITION_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/RENDER_DB_REST_LOADER_TRANSITION_PLAN.md) | Web/Puck/smoke read path 전환 대부분 완료, 남은 DB migration은 별도 작업 | `DB_SCHEMA.dbml`, `PACKAGE_MAP.md` |
| [SCREEN_DESIGN_STAGE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/SCREEN_DESIGN_STAGE_PLAN.md) | screen-generation stage 확장 내용이 현재 pipeline 문서에 흡수됨 | `PIPELINE_STAGE_PROTOCOL.md`, `docs/SCREEN_GENERATION_PIPELINE.md` |
| [NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/NEW_SCREEN_INFERENCE_LIFECYCLE_PLAN.md) | lifecycle 방향이 Web/pipeline 구현과 stage protocol에 흡수됨 | `PIPELINE_STAGE_PROTOCOL.md`, Web screen inference 구현 |
| [INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/INFERENCE_PIPELINE_ARCHITECTURE_PLAN.md) | step runner/persistence/API 논의가 현재 package boundary와 stage protocol에 흡수됨 | `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `PIPELINE_STAGE_PROTOCOL.md` |
