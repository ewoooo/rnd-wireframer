# Simplification Parallel Plan

작성일: 2026-05-27

## 1. 목표

RND Screen Generator의 단기 목표를 "명세를 검토 가능한 모바일 화면 초안으로 빠르게 변환하고 품질 개선 루프를 짧게 돌리는 것"으로 재정렬한다.

이번 단순화는 생성 파이프라인 고도화를 포기하는 작업이 아니다. 중간 표상과 검증 단계를 줄여 화면 제작 품질 향상에 직접 연결되는 루프를 먼저 안정화한다.

```text
PRDD/source
-> DraftTables
-> RenderTree preview
-> Quality Report
-> Quality Backlog
-> prompt/catalog/pattern/component 보강
-> regenerate
```

## 2. 단순화 원칙

- MVP active path는 `source -> draft tables -> validate -> preview -> quality report -> promote` 하나로 둔다.
- `database/tables` shape를 MVP의 중심 계약으로 삼고, 중간 의미 모델은 품질 문제가 반복될 때만 후속 레이어로 되살린다.
- `CompositionOutput`, `DecoratedNodeTree`, `DesignReview patch`, `MaterializedNodeTree`는 당장 삭제하지 않고 experimental/legacy 경계로 격리한다.
- 화면 품질 개선의 기준은 중간 산출물 완성도가 아니라 렌더 결과와 구조화된 quality report다.
- 카탈로그는 생성 판단을 과도하게 지배하는 계약이 아니라 허용 어휘와 개선 후보의 근거로 사용한다.

## 3. 성공 기준

1. 한 화면 입력을 받아 `database/tables` shape의 draft 후보를 만든다.
2. draft 후보가 schema, reference, component/pattern existence, renderability 검증을 통과하거나 명확한 report를 남긴다.
3. workbench에서 렌더 화면과 quality report를 함께 확인할 수 있다.
4. quality report가 prompt, catalog, pattern, component, source parsing 중 어느 축을 고쳐야 하는지 분류한다.
5. agent 패키지의 active MVP 경로가 문서와 코드에서 하나로 보인다.

## 4. 병렬 작업선

| Track | 담당 | 목표 | 주요 산출물 | 의존성 |
|---|---|---|---|---|
| A. Active Pipeline | Agent Runtime Agent | MVP active path를 `source -> draft tables -> validate -> preview`로 고정 | `runDraftTablesPipeline` 초안, active/experimental export 경계 | 없음 |
| B. Quality Report | QA Agent + Design System Agent | 렌더 결과 품질 문제를 구조화 | `QualityReport` 타입, issue category, sample report | A의 draft shape |
| C. DraftTables Generator | Claude Generation Agent | Claude가 중간 의미 모델 없이 tables 후보를 직접 생성 | draft tables prompt, retry prompt, sample output | A의 입출력 계약 |
| D. Validation Collapse | Data Agent | 60개 validation code를 MVP category로 접기 | `schema/reference/vocabulary/renderability/sourceTrace` category | A, B |
| E. Preview Feedback | Frontend Agent | workbench에서 preview와 report를 같이 보여줌 | quality panel, issue navigation | B |
| F. Catalog Quality Loop | Design System Agent | 반복 품질 문제를 catalog/pattern/component 보강 작업으로 연결 | missing pattern/component backlog format | B |
| G. Documentation Boundary | Documentation Agent | 장기 파이프라인과 MVP active path를 문서에서 분리 | MASTER_PLAN/ARCH/DATA_MAP 갱신안 | A-D 결정 |

## 5. 1주차 계획

| Task | Effort | Owner | Depends On | Done Criteria |
|---|---:|---|---|---|
| active/experimental 모듈 경계 목록 작성 | 3h | Architecture Agent | 없음 | agent 하위 폴더별 active/experimental/legacy 표 작성 |
| DraftTables 입출력 계약 정의 | 4h | Data Agent | 없음 | `screen_routes/screen_variants/screens/areas/components` draft bundle 타입 확정 |
| QualityReport v1 category 정의 | 4h | QA Agent | 없음 | renderability, layout, component, hierarchy, sourceTrace category 확정 |
| direct-to-tables prompt 초안 작성 | 6h | Claude Generation Agent | DraftTables 계약 | PRDD 1개 화면으로 draft tables sample 생성 가능 |
| tables validation category mapper 설계 | 4h | Data Agent | QualityReport category | 기존 validation issue를 5개 category로 매핑 |
| preview report UI 와이어 작성 | 4h | Frontend Agent | QualityReport v1 | workbench 패널 구조와 필요한 props 정의 |
| 문서 정리 PR 초안 | 3h | Documentation Agent | 위 결정 | MVP active path와 후속 확장 경계가 문서에 반영됨 |

## 6. 2주차 계획

| Task | Effort | Owner | Depends On | Done Criteria |
|---|---:|---|---|---|
| `runDraftTablesPipeline` 구현 | 8h | Agent Runtime Agent | 1주차 계약 | source 입력부터 draft tables artifact까지 생성 |
| DraftTables validator 구현 | 8h | Data Agent | category mapper | schema/reference/vocabulary/renderability 검증 실행 |
| QualityReport 생성기 구현 | 8h | QA Agent | validator | validation + preview 결과를 report JSON으로 출력 |
| workbench report panel 구현 | 8h | Frontend Agent | QualityReport 생성기 | 현재 화면의 issue와 원인 category 표시 |
| prompt retry loop 구현 | 6h | Claude Generation Agent | QualityReport | report를 바탕으로 regenerate prompt 구성 |
| catalog backlog 추출 | 4h | Design System Agent | QualityReport samples | missing component/pattern 후보 목록 생성 |
| smoke scenario 3개 고정 | 6h | QA Agent | pipeline 구현 | agreement-flow, form-entry, generic-detail 화면 smoke 통과 |

## 7. 의존성 지도

```text
DraftTables 계약
  ├─> direct-to-tables prompt
  ├─> runDraftTablesPipeline
  └─> validator category mapper

QualityReport category
  ├─> validator output
  ├─> workbench report panel
  ├─> retry prompt
  └─> catalog backlog

runDraftTablesPipeline + validator
  └─> smoke scenario
      └─> MVP active path 문서화
```

## 8. 작업 분리 규칙

- Track A는 orchestration/export 경계만 다루고 화면 품질 판단을 넣지 않는다.
- Track B는 report schema와 category만 다루고 prompt 문구를 직접 고치지 않는다.
- Track C는 Claude prompt와 retry만 다루고 renderer/validation 계약을 바꾸지 않는다.
- Track D는 validation 결과의 분류를 다루고 개별 화면 디자인 판단을 하지 않는다.
- Track E는 표시와 탐색만 다루고 report 의미를 재해석하지 않는다.
- Track F는 quality report에서 반복되는 gap을 catalog/pattern/component backlog로 바꾸는 일만 한다.

## 9. 보류 항목

아래 항목은 삭제하지 않고 MVP 밖으로 내린다.

- Puck 기반 Screen/OGN 편집
- Design Review patch 자동 적용
- proposed componentPattern 큐레이션
- archetype completeness hard gate
- FastAPI read model과 운영 DB migration
- 공유 OGN 편집본 자동 전파
- Codex review의 전체 자동화

## 10. 리스크와 대응

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| direct-to-tables 생성 품질이 낮음 | High | Medium | QualityReport 기반 retry와 sample-driven prompt 개선을 먼저 둔다 |
| 기존 agent 테스트가 대량으로 흔들림 | Medium | High | 기존 경로는 experimental로 보존하고 active path 테스트를 별도로 만든다 |
| validation category가 너무 뭉뚱그려짐 | Medium | Medium | 사용자 표시는 category, 개발 로그는 original code를 유지한다 |
| catalog 보강이 다시 과설계로 번짐 | Medium | Medium | 반복 issue가 2회 이상 나온 항목만 catalog backlog로 승격한다 |
| 문서와 코드 경계가 다시 불일치 | Medium | Medium | active path 변경 시 MASTER_PLAN, DATA_MAP, AGENTS_HISTORY를 함께 갱신한다 |

## 11. 첫 실행 체크리스트

- [x] `packages/agent` 하위 모듈을 active/experimental/legacy로 분류한다.
- [x] `DraftTablesBundle` 계약 이름과 저장 위치를 정한다.
- [x] `QualityReport` category와 최소 JSON 예시를 만든다.
- [x] PRDD sample 1개로 direct-to-tables prompt를 실행한다.
- [x] renderability 실패 원인이 report로 보이는지 확인한다.
- [x] 반복되는 품질 gap을 catalog/pattern/component backlog로 분리한다.

## 12. 진행 기록

### 2026-05-27

- `docs/development/AGENT_MODULE_BOUNDARY.md`를 추가해 `packages/agent` 하위 모듈을 active, experimental, legacy로 분류했다.
- `@cx/types`에 `DraftTablesBundle`, `DraftTablesArtifact`, `QualityReport` v1 타입을 추가했다.
- `@cx/agent`에 active path 진입점 `runDraftTablesPipeline`을 추가했다.
- 기존 detailed validation issue를 MVP quality category로 접는 `createQualityReport` adapter를 추가했다.
- `@cx/agent/pipeline`, `@cx/agent/validate`의 기본 barrel을 active path 중심으로 줄이고, 기존 2-stage 흐름을 experimental subpath로 이동했다.
- `scripts/run-draft-tables.ts` active runner를 추가하고 기존 pipeline scripts를 experimental runner로 명시했다.
- `apps/web/src/server/agent/generate-draft-tables.ts`와 `/api/agent/generate-draft-tables`를 추가해 legacy `generate-register`와 active DraftTables entrypoint를 분리했다.
- `pnpm run lint:agent-boundary` active path import guard를 추가했다.
- workbench store에 DraftTables 생성 결과를 구조화해 보관하고, Agent 패널에서 화면별 quality report 요약과 산출물 경로를 확인할 수 있게 했다.
- `QualityBacklog` 계약과 `createQualityBacklog` aggregation을 추가해 반복되는 catalog/pattern/component gap을 `quality-backlog.json` 산출물로 분리했다.
- workbench table loader를 재사용 가능한 builder로 분리하고, DraftTables 생성 성공 시 preview tables를 앱 상태에 주입해 화면 탭에서 즉시 렌더 확인할 수 있게 했다.
- legacy `generate-register` API와 생성 UI를 제거해 workbench의 생성 entrypoint를 DraftTables 하나로 줄였다.
- legacy 생성/compose/decorate/design-review package subpath export와 오래된 preview runner 산출물을 제거해 public surface와 런타임 파일 노이즈를 줄였다.
