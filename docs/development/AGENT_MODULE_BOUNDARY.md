# Agent Module Boundary

작성일: 2026-05-27

## 1. 목적

`packages/agent`의 active path와 legacy 호환 subpath를 분리한다. 이 문서는 병렬 작업자가 어느 모듈을 건드려도 되는지 빠르게 판단하기 위한 작업 경계표다.

## 2. Active Path

현재 기본 narrative는 아래 흐름 하나다.

```text
source -> DraftTables -> QualityReport -> QualityBacklog -> Preview -> Promote
```

Active path는 승인 전 draft tables를 만들고, quality report/backlog로 확인하고, renderer preview를 거쳐 승인된 후보만 promote한다. preview rendering과 RenderTree validation의 소유권은 `@cx/renderer`에 있다.

| Module | Status | 책임 |
|---|---|---|
| `register/prdd-parser.ts` | active | PRDD markdown deterministic parsing |
| `register/prdd-record-builder.ts` | active | parsed PRDD를 `PrddScreenRecord`로 정규화 |
| `register/register-prdd-screen.ts` | active | 단일 화면 register와 source invariant report |
| `pipeline/draft-tables-pipeline.ts` | active | `source -> DraftTables -> QualityReport` orchestration |
| `pipeline/prdd-draft-tables.ts` | active-support | PRDD register 결과를 DraftTablesBundle로 만드는 deterministic draft generator |
| `validate/quality-report.ts` | active | renderer validation issue를 MVP quality category로 접는 report adapter |
| `validate/quality-backlog.ts` | active | 반복되는 catalog/pattern/component gap을 보강 backlog로 묶는 report aggregation |
| `database/promote-database-tables.ts` | active | 승인된 draft tables를 소비 테이블로 반영 |
| `compose/compose-prdd.ts` | active-support | register 결과를 tables 생성 전 내부 composed 구조로 정규화 |
| `decorate/decorate-prdd.ts` | active-support | pattern resolver를 적용해 tables 변환 입력을 준비 |

## 3. Removed Experimental Subpath

2026-05-27 감량 라운드에서 기존 `compose-screen`, `decorate-screen`, composition/decorated validator, `materialize-composition`, experimental pipeline은 제거했다. 화면 품질 고도화는 active DraftTables/QualityReport 경로에 직접 붙인다.

## 4. Removed Legacy Subpath

2026-05-27 orphan 정리에서 legacy asset pipeline, design-review, deck builder, Agent SDK runtime adapter를 제거했다. 남은 생성 경로는 active DraftTables pipeline뿐이다.

## 5. Export 규칙

- `@cx/agent` root export는 active path만 공개한다.
- `@cx/agent/pipeline`은 `runDraftTablesPipeline` 중심의 active path만 공개한다.
- `@cx/agent/validate`는 active `QualityReport` adapter와 `QualityBacklog` aggregation만 공개한다.
- legacy asset pipeline, deck builder, Agent SDK runtime adapter export는 제공하지 않는다.

## 6. 병렬 작업 규칙

- Active Pipeline 작업자는 `pipeline/draft-tables-pipeline.ts`, register, promote 경계만 수정한다.
- Quality Report 작업자는 `@cx/types/quality-report`, `@cx/types/quality-backlog`, validator/report adapter를 수정한다.
- DraftTables Generator 작업자는 prompt와 generator adapter만 수정하고 renderer/validation 계약을 바꾸지 않는다.
- 제거된 experimental/legacy 모듈은 되살리기보다 DraftTables/QualityReport 경로의 보강 지점으로 재설계한다.
