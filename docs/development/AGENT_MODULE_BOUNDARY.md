# Agent Module Boundary

작성일: 2026-05-27

## 1. 목적

`packages/agent`의 MVP active path와 고도화/실험 경로를 분리한다. 이 문서는 병렬 작업자가 어느 모듈을 건드려도 되는지 빠르게 판단하기 위한 작업 경계표다.

## 2. Active MVP Path

현재 active path는 아래 흐름 하나다.

```text
PRDD/source
-> Register
-> DraftTables
-> Validate
-> Preview/QualityReport
-> Promote
```

| Module | Status | 책임 |
|---|---|---|
| `register/prdd-parser.ts` | active | PRDD markdown deterministic parsing |
| `register/prdd-record-builder.ts` | active | parsed PRDD를 `PrddScreenRecord`로 정규화 |
| `register/register-prdd-screen.ts` | active | 단일 화면 register와 source invariant report |
| `pipeline/draft-tables-pipeline.ts` | active | `source -> draft tables -> optional quality report` orchestration |
| `database/promote-database-tables.ts` | active | 승인된 draft tables를 소비 테이블로 반영 |
| `deck/build-*` | active-support | direct-to-tables prompt 입력용 catalog/design/layout deck 생성 |
| `runtime/agent-sdk-runtime.ts` | active-support | 후속 local-first AI runtime 연결점 |

## 3. Experimental Quality Layers

아래 모듈은 화면 품질 문제가 반복될 때 다시 끌어올릴 수 있는 고도화 레이어다. MVP active path의 필수 의존성으로 추가하지 않는다.

| Module | Status | 비고 |
|---|---|---|
| `compose-screen/*` | experimental | archetype/componentPattern/layoutPattern draft를 포함한 1차 LLM composition |
| `decorate-screen/*` | experimental | layout pattern 보정용 2차 LLM decoration |
| `design-review/*` | experimental | design docs 근거 patch 제안/적용 |
| `validate/validate-composition.ts` | experimental-support | composition-specific hard gate |
| `validate/validate-decorated.ts` | experimental-support | decorated output hard gate |
| `database/materialize-composition.ts` | experimental-support | composition/decorated output을 tables로 변환 |
| `pipeline/run-pipeline.ts` | experimental | 기존 Register -> Compose -> Decorate -> Materialize 전체 흐름 |

## 4. Legacy Compatibility

아래 모듈은 기존 테스트와 샘플 흐름 유지용으로 남긴다. 신규 active path에서 import하지 않는다.

| Module | Status | 비고 |
|---|---|---|
| `compose/*` | legacy | `GeneratedNodeTree` 계열 asset composition |
| `decorate/*` | legacy | asset decoration/pattern selection |
| `register/register-assets.ts` | legacy | `GeneratedNodeTree` 등록 |
| `database/register-assets-to-database-tables.ts` | legacy | asset tree를 database tables로 변환 |
| `pattern/pattern-store.ts` | legacy-support | 구 asset pipeline pattern helper |

## 5. 병렬 작업 규칙

- Active Pipeline 작업자는 `pipeline/draft-tables-pipeline.ts`, register, promote 경계만 수정한다.
- Quality Report 작업자는 `@cx/types/quality-report`와 validator/report adapter를 수정한다.
- DraftTables Generator 작업자는 prompt와 generator adapter만 수정하고 renderer/validation 계약을 바꾸지 않는다.
- Experimental 모듈은 active path가 요구하지 않는 한 public root export에 추가하지 않는다.
- 기존 experimental 테스트가 깨질 가능성이 있는 변경은 active path 테스트를 먼저 추가한 뒤 별도 정리 작업으로 다룬다.
