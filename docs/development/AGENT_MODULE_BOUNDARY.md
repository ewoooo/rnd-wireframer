# Agent Module Boundary

작성일: 2026-05-27

## 1. 목적

`packages/agent`의 active path와 legacy/experimental subpath를 분리한다. 이 문서는 병렬 작업자가 어느 모듈을 건드려도 되는지 빠르게 판단하기 위한 작업 경계표다.

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
| `deck/build-*` | active-support | direct-to-tables prompt 입력용 catalog/design/layout deck 생성. active path의 저장/검증 기준은 아님 |
| `runtime/agent-sdk-runtime.ts` | active-support | local-first AI runtime 연결점. active path에 자동 의존시키지 않음 |

## 3. Experimental Subpath

아래 모듈은 화면 품질 문제가 반복될 때 다시 끌어올릴 수 있는 고도화 레이어다. active path의 필수 의존성으로 추가하지 않는다. 필요한 작업자는 명시적 experimental subpath로만 import한다.

| Module | Status | 비고 |
|---|---|---|
| `compose-screen/*` | experimental | archetype/componentPattern/layoutPattern draft를 포함한 1차 LLM composition |
| `decorate-screen/*` | experimental | layout pattern 보정용 2차 LLM decoration |
| `design-review/*` | experimental | design docs 근거 patch 제안/적용 |
| `validate/validate-composition.ts` | experimental-support | composition-specific hard gate. `@cx/agent/validate/experimental`에서만 공개 |
| `validate/validate-decorated.ts` | experimental-support | decorated output hard gate. `@cx/agent/validate/experimental`에서만 공개 |
| `database/materialize-composition.ts` | experimental-support | composition/decorated output을 tables로 변환 |
| `pipeline/run-pipeline.ts` | experimental | 기존 Register -> Compose -> Decorate -> Materialize 전체 흐름. `@cx/agent/pipeline/experimental`에서만 공개 |

## 4. Legacy Subpath

아래 모듈은 기존 테스트와 샘플 흐름 유지용으로 남긴다. 신규 active path에서 import하지 않고, 호환 작업에서만 legacy subpath로 사용한다.

| Module | Status | 비고 |
|---|---|---|
| `compose/*` | legacy | `GeneratedNodeTree` 계열 asset composition |
| `decorate/*` | legacy | asset decoration/pattern selection |
| `register/register-assets.ts` | legacy | `GeneratedNodeTree` 등록 |
| `database/register-assets-to-database-tables.ts` | legacy | asset tree를 database tables로 변환 |
| `pattern/pattern-store.ts` | legacy-support | 구 asset pipeline pattern helper |

## 5. Export 규칙

- `@cx/agent` root export는 active path만 공개한다.
- `@cx/agent/pipeline`은 `runDraftTablesPipeline` 중심의 active path만 공개한다.
- 기존 Register -> Compose -> Decorate -> Materialize 흐름은 `@cx/agent/pipeline/experimental`에서만 공개한다.
- `@cx/agent/validate`는 active `QualityReport` adapter와 `QualityBacklog` aggregation만 공개한다.
- composition/decorated validator는 `@cx/agent/validate/experimental`에서만 공개한다.
- legacy asset pipeline은 root export에 추가하지 않는다.

## 6. 병렬 작업 규칙

- Active Pipeline 작업자는 `pipeline/draft-tables-pipeline.ts`, register, promote 경계만 수정한다.
- Quality Report 작업자는 `@cx/types/quality-report`, `@cx/types/quality-backlog`, validator/report adapter를 수정한다.
- DraftTables Generator 작업자는 prompt와 generator adapter만 수정하고 renderer/validation 계약을 바꾸지 않는다.
- active path import guard는 `pnpm run lint:agent-boundary`로 실행한다. 이 검사는 active path가 `composition-output`, `decorated-output`, compose/decorate/design-review 모듈을 다시 import하지 못하게 막는다.
- Experimental 모듈은 active path가 요구하지 않는 한 public root export에 추가하지 않는다.
- Legacy 모듈은 호환성 유지가 목적이며 신규 active path narrative에 섞지 않는다.
- 기존 experimental 테스트가 깨질 가능성이 있는 변경은 active path 테스트를 먼저 추가한 뒤 별도 정리 작업으로 다룬다.
