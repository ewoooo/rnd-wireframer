# Agent Module Boundary

작성일: 2026-05-27

## 1. 목적

`packages/importer`, `packages/workflow`, `packages/agent`의 경계를 분리한다. importer는 명세 변환, workflow는 제품 흐름 오케스트레이션, agent는 AI 실행만 담당한다. 이 문서는 병렬 작업자가 어느 모듈을 건드려도 되는지 빠르게 판단하기 위한 작업 경계표다.

## 2. Business Path

현재 기본 narrative는 아래 흐름 하나다.

```text
명세 -> 품질 검수 -> 미리보기 -> 반영
```

Business path는 승인 전 table 후보를 만들고, quality report/backlog로 확인하고, renderer preview를 거쳐 승인된 후보만 반영한다. 명세 변환은 `@cx/importer`, preview rendering과 RenderTree validation은 `@cx/engine`에 있다. `DraftTables`, `QualityReport`, `QualityBacklog`, `Promote`는 내부 구현 이름이다.

| Module | Status | 책임 |
|---|---|---|
| `spec/index.ts` | business-boundary | 명세 단계 공개 import |
| `inspection/index.ts` | business-boundary | 품질 검수 단계 공개 import |
| `apply/index.ts` | business-boundary | 반영 단계 공개 import |
| `@cx/importer/prdd` | importer-boundary | PRDD parsing/register/table 후보 생성 |
| `@cx/importer/materializer` | importer-boundary | PRDD runtime tree를 table 후보로 변환 |
| `pipeline/draft-tables-pipeline.ts` | active | importer 호출과 optional 품질 검수 orchestration |
| `validate/quality-report.ts` | active | renderer validation issue를 MVP quality category로 접는 report adapter |
| `validate/quality-backlog.ts` | active | 반복되는 catalog/pattern/component gap을 보강 backlog로 묶는 report aggregation |
| `database/promote-database-tables.ts` | active | 승인된 draft tables를 소비 테이블로 반영 |

## 3. Removed Experimental Subpath

2026-05-27 감량 라운드에서 기존 `compose-screen`, `decorate-screen`, composition/decorated validator, `materialize-composition`, experimental pipeline은 제거했다. 화면 품질 고도화는 명세 후보/품질 검수 경로에 직접 붙인다.

## 4. Removed Legacy Subpath

2026-05-27 orphan 정리에서 legacy asset pipeline, design-review, deck builder, Agent SDK runtime adapter를 제거했다. 남은 생성 경로는 명세 후보 pipeline뿐이다.

## 5. Export 규칙

- `@cx/importer/prdd`, `@cx/importer/materializer`, `@cx/importer/types`를 명세 변환 공개 import로 사용한다.
- `@cx/workflow/spec`, `@cx/workflow/inspection`, `@cx/workflow/apply`를 비즈니스 단계별 공개 import로 우선 사용한다.
- `@cx/workflow/pipeline`은 `runDraftTablesPipeline` 중심의 internal path만 공개한다.
- `@cx/workflow/validate`는 active `QualityReport` adapter와 `QualityBacklog` aggregation만 공개한다.
- `@cx/agent` root export는 AI 실행 계약만 공개한다.
- legacy asset pipeline, deck builder export는 제공하지 않는다.

## 6. 병렬 작업 규칙

- Importer 작업자는 PRDD parser/register/compose/decorate/materializer만 수정한다.
- Active Pipeline 작업자는 `pipeline/draft-tables-pipeline.ts`, importer 호출, promote 경계만 수정한다.
- Quality Report 작업자는 `@cx/types/quality-report`, `@cx/types/quality-backlog`, validator/report adapter를 수정한다.
- DraftTables Generator 작업자는 prompt와 generator adapter만 수정하고 renderer/validation 계약을 바꾸지 않는다.
- 제거된 experimental/legacy 모듈은 되살리기보다 명세 후보/품질 검수 경로의 보강 지점으로 재설계한다.
