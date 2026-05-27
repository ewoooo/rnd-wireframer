# @cx/agent

`@cx/agent`는 active path의 deterministic 처리와 Agent SDK 실행 adapter를 담는 패키지다.

이 패키지는 화면을 직접 렌더링하지 않는다. 렌더 가능한 JSON 계약과 validation은 `@cx/renderer`가 소유하고, `@cx/agent`는 source를 draft tables로 만들고 quality report/preview/promote 흐름에 넘기는 중간 처리만 담당한다.

## 기본 경로

현재 기본 narrative는 아래 하나다.

```text
source -> DraftTables -> QualityReport -> QualityBacklog -> Preview -> Promote
```

- **source**: PRDD markdown 또는 read model 입력.
- **DraftTables**: `database/tables` shape의 승인 전 후보.
- **QualityReport**: renderer validation issue를 MVP quality category로 접은 검수 결과.
- **QualityBacklog**: 반복되는 catalog/pattern/component gap을 보강 후보로 묶은 목록.
- **Preview**: draft tables를 renderer 입력으로 projection해 확인하는 단계. preview 자체는 `@cx/renderer`가 담당한다.
- **Promote**: 승인된 draft tables만 소비 테이블로 반영.

## 공개 import

패키지 루트에서는 active path에 필요한 기능만 import한다.

```ts
import {
	createQualityReport,
	createQualityBacklog,
	promoteDatabaseTablesCandidate,
	registerPrddScreen,
	runDraftTablesPipeline,
} from "@cx/agent";
```

legacy/experimental pipeline은 기본 경로가 아니다. 호환 뷰에 필요한 `register-assets`와 명시적 experimental barrel만 공개하고, legacy 생성/compose/decorate/design-review subpath는 신규 제품 entrypoint로 열지 않는다.

```ts
import { createCxTextAgent } from "@cx/agent/agent-sdk-runtime";
import { registerAssets } from "@cx/agent/register-assets";
import type { GeneratedNodeTree } from "@cx/agent/types";
```

## 현재 기능

| 경로 | 책임 |
|---|---|
| `src/pipeline/draft-tables-pipeline.ts` | **Active** — `source -> DraftTables -> QualityReport` orchestration |
| `src/register/prdd-parser.ts` | **Active** — PRDD markdown deterministic parsing |
| `src/register/prdd-record-builder.ts` | **Active** — parsed PRDD를 `PrddScreenRecord`로 정규화 |
| `src/register/register-prdd-screen.ts` | **Active** — 단일 화면 register와 source invariant report |
| `src/validate/quality-report.ts` | **Active** — detailed validation issue를 MVP quality category로 접는 report adapter |
| `src/validate/quality-backlog.ts` | **Active** — 반복되는 catalog/pattern/component gap을 backlog로 묶는 aggregation |
| `src/database/promote-database-tables.ts` | **Active** — 승인된 draft tables를 소비 테이블로 반영 |
| `src/runtime/agent-sdk-runtime.ts` | `@openai/agents` 기반 text agent 생성/실행 adapter |
| `src/compose-screen/*`, `src/decorate-screen/*`, `src/design-review/*` | **Experimental subpath only** — archetype/decorator/design-review 고도화 |
| `src/compose/*`, `src/decorate/*`, `src/register/register-assets.ts`, `src/database/register-assets-to-database-tables.ts` | **Legacy subpath only** — `GeneratedNodeTree` 계열 asset pipeline 호환 |
| `src/types.ts` | agent NodeTree, pattern, hook, table row 타입 |
| `src/index.ts` | 패키지 공개 export 집약 |
| `src/__tests__/` | 패키지 단위 동작 검증 |

## Active Path

```text
PRDD/source
-> registerPrddScreen
-> runDraftTablesPipeline
-> createQualityReport
-> createQualityBacklog
-> renderer preview
-> promoteDatabaseTablesCandidate
```

Active path의 기본값은 deterministic이다. AI runtime은 draft 생성 또는 검수 보강이 필요한 subpath에서만 붙인다. markdown parsing은 register 단계에 가둔다. DraftTables 이후에는 `database/tables` shape, renderer validation, quality report, promote 계약만 본다.

## Subpath-only Pipelines

아래 흐름은 active narrative가 아니다. 기존 샘플, 실험, 고도화 작업에서만 명시적으로 subpath import한다.

### Experimental composition

```text
source
-> compose-screen
-> decorate-screen
-> design-review
-> materialize-composition
```

이 흐름은 archetype/componentPattern/layoutPattern 판단을 다시 실험할 때만 사용한다. active path의 필수 의존성으로 추가하지 않는다.

### Legacy asset pipeline

```text
GeneratedNodeTree
-> registerAssets
-> composeAssetContents
-> decorateRegisteredAssets
-> applyDesignReview
-> materializeDecoratedAssetsToNodeTree
```

이 흐름은 `database/ai-imports`의 과거 asset 산출물과 테스트 호환용이다. 신규 active path에서 import하지 않는다.

### Agent SDK runtime

```text
createCxTextAgent
-> runCxTextAgent
-> finalOutput 검사
-> deterministic validation 또는 table conversion
```

Claude 생성은 로컬 Claude 실행 파일을 우선 사용한다. 각 생성 요청은 기본적으로 새 세션에서 실행하며, 이전 대화를 이어야 하는 명시적 검수/재시도 흐름에서만 `continueSession: true`를 전달한다.

## 아직 없는 것

- Claude 생성 agent의 role-specific instructions
- Codex 검수 agent의 local-first runner와 guardrail 확장
- local-first Claude/Codex runner
- 원격 API fallback 정책
- Persistence adapter for the future operational DB/storage layer

위 기능은 `agent-sdk-runtime` 위에 별도 파일로 추가한다.
