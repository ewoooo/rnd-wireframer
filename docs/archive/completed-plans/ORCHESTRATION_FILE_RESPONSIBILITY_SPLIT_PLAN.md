# Orchestration File Responsibility Split Plan

Implementation status as of 2026-05-29: done. `generation.ts` is now a compatibility barrel, and implementations live in `agent-inputs.ts`, `source-context.ts`, `design-context.ts`, and `next-action.ts`.

## 1. 문서 책임

이 문서는 `@cx/orchestration`의 public helper 파일을 파일 단위 책임으로 분리하는 계획을 정의한다.

패키지 책임은 루트 `AGENTS.md`, `PACKAGE_MAP.md`, `docs/development/PROJECT_STRUCTURE.md`를 따른다. 이 문서는 새 패키지 경계를 만들지 않는다.

`@cx/orchestration`은 계속 다음 책임만 가진다.

- SourceSpec, upstream design artifact, pattern candidate, validation/quality result를 agent input과 next-action data로 조립한다.
- 파일을 읽거나 쓰지 않는다.
- Claude를 실행하지 않는다.
- validation rule을 판정하지 않는다.
- pipeline stage 순서나 retry loop를 소유하지 않는다.

## 2. 현재 문제

현재 `packages/orchestration/src/public/generation.ts`는 다음 네 책임을 한 파일에 함께 가진다.

1. Agent input builder
2. Source context extraction
3. Design context bundle selection
4. Generation next-action decision

패키지 책임은 맞지만 파일 단위로 보면 다음 문제가 생긴다.

- 파일명이 `generation`인데 source catalog, bundle selection, next-action decision까지 담고 있다.
- 새 helper를 추가할 때 어디에 넣어야 하는지 판단이 느슨해진다.
- AI나 사람이 “비슷해 보이는 orchestration helper”를 같은 파일에 계속 붙이기 쉽다.
- public helper가 늘어날수록 테스트 실패가 나기 전까지 책임 혼합이 눈에 잘 보이지 않는다.

## 3. 현재 함수 분류

### 3.1 Agent Input Builders

대상 함수:

- `buildScreenIntentAgentInput`
- `buildCompositionPlanAgentInput`
- `buildPatternSelectionAgentInput`
- `buildScreenGenerationAgentInput`
- `buildScreenRevisionAgentInput`
- `buildQualityReviewAgentInput`

책임:

- agent query 문장과 context shape를 만든다.
- schema version, JSON schema, source summary, source reference catalog를 prompt context에 넣는다.
- Claude 실행, 파일 IO, validation 판정은 하지 않는다.

### 3.2 Source Context Helpers

대상 함수:

- `createSourceSummary`
- `countSourceAreas`
- `listSourceComponentIds`
- `buildSourceReferenceCatalog`
- `uniqueStrings`

책임:

- `SourceSpec`에서 agent input에 필요한 deterministic context만 추출한다.
- source ref vocabulary를 만든다.
- source 값을 해석하거나 검증하지 않는다.

### 3.3 Design Context Bundle Selection

대상 상수/함수:

- `DESIGN_CONTEXT_BUNDLE_VERSION`
- `DESIGN_CONTEXT_BUNDLE_SOURCE_DOCS`
- `DESIGN_CONTEXT_BUNDLE_REASONS`
- `buildDesignContextBundleRefs`
- `createDesignContextBundleRef`
- `hasStatefulSurface`
- `STATEFUL_SURFACE_TERMS`
- `hasValidationIssues`

책임:

- SourceSpec, ScreenIntent, CompositionPlan, ValidationReport를 보고 bundle ref id와 이유만 선택한다.
- bundle 문서 본문은 읽지 않는다.
- prompt 본문 조립이나 artifact write는 하지 않는다.

### 3.4 Generation Next Action Decision

대상 함수:

- `buildGenerationNextAction`
- `readReport`
- `readQualityInspection`
- `isRecord`

책임:

- validation summary와 quality inspection summary를 next action으로 변환한다.
- pipeline stage 실행 여부를 직접 바꾸지 않는다.
- retry count를 입력으로 받아 deterministic decision만 반환한다.

## 4. 분리 목표 파일

### 4.1 `source-context.ts`

위치:

```text
packages/orchestration/src/public/source-context.ts
```

포함:

- `buildSourceReferenceCatalog`
- `createSourceSummary`
- `countSourceAreas`
- `listSourceComponentIds`
- `uniqueStrings`

Public export:

- `buildSourceReferenceCatalog`
- 필요 시 `createSourceSummary`
- 필요 시 `listSourceComponentIds`

비공개 유지 후보:

- `countSourceAreas`
- `uniqueStrings`

### 4.2 `agent-inputs.ts`

위치:

```text
packages/orchestration/src/public/agent-inputs.ts
```

포함:

- `buildScreenIntentAgentInput`
- `buildCompositionPlanAgentInput`
- `buildPatternSelectionAgentInput`
- `buildScreenGenerationAgentInput`
- `buildScreenRevisionAgentInput`
- `buildQualityReviewAgentInput`

의존:

- `source-context.ts`
- `types.ts`
- `@cx/schema`

금지:

- `buildDesignContextBundleRefs` 구현을 이 파일에 두지 않는다.
- `buildGenerationNextAction` 구현을 이 파일에 두지 않는다.

### 4.3 `design-context.ts`

위치:

```text
packages/orchestration/src/public/design-context.ts
```

포함:

- `buildDesignContextBundleRefs`
- bundle version/source docs/reason 상수
- stateful surface 판정 helper
- validation issue 존재 판정 helper

의존:

- `types.ts`
- `@cx/schema`

금지:

- `packages/agent/docs/design-context/*` 파일 읽기
- prompt 본문 조립
- artifact write

### 4.4 `next-action.ts`

위치:

```text
packages/orchestration/src/public/next-action.ts
```

포함:

- `buildGenerationNextAction`
- `readReport`
- `readQualityInspection`
- `isRecord`

의존:

- `types.ts`

금지:

- validation issue 생성
- revision 실행
- pipeline stage skip/continue 직접 제어

### 4.5 `generation.ts`

위치:

```text
packages/orchestration/src/public/generation.ts
```

역할:

기존 import path 호환을 위한 barrel로 축소한다.

```ts
export * from "./agent-inputs";
export * from "./design-context";
export * from "./next-action";
export * from "./source-context";
```

## 5. Export 전략

1차 변경에서는 기존 public API 호환을 우선한다.

- `packages/orchestration/src/index.ts`는 계속 `./public/generation`에서 re-export해도 된다.
- 내부 구현 파일만 나눈다.
- 테스트와 pipeline import가 깨지지 않아야 한다.

2차 정리 후보:

- `index.ts`가 `agent-inputs`, `design-context`, `next-action`, `source-context`에서 직접 export하도록 바꾼다.
- 이 변경은 import provenance를 더 명확하게 하지만, 1차 분리보다 surface churn이 크므로 후속으로 둔다.

## 6. 실행 순서

1. `source-context.ts` 생성
   - source summary/catalog helper를 이동한다.
   - `agent-inputs.ts`에서 사용할 수 있도록 필요한 함수만 export한다.

2. `next-action.ts` 생성
   - `buildGenerationNextAction`과 private parser helper를 이동한다.
   - tests가 기존 import 경로로 계속 통과하는지 확인한다.

3. `design-context.ts` 생성
   - bundle selection 상수와 helper를 이동한다.
   - `next-action.ts`의 private `readReport`를 공유하지 않는다.
   - 같은 shape parser가 일부 중복되더라도 파일 책임을 우선한다.

4. `agent-inputs.ts` 생성
   - agent input builder들을 이동한다.
   - `source-context.ts`에서 `buildSourceReferenceCatalog`, `createSourceSummary`, `listSourceComponentIds`를 import한다.

5. `generation.ts`를 barrel로 축소
   - 기존 public import 경로를 유지한다.

6. 필요 시 `index.ts` export 정리
   - 1차에서는 선택 사항이다.

## 7. 검증 방법

필수:

```bash
npx tsc --noEmit --pretty false
npx biome check packages/orchestration/src/public packages/orchestration/src/__tests__/public-api.test.ts
npx vitest run packages/orchestration/src/__tests__/public-api.test.ts
```

권장:

```bash
npx vitest run packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/validation/src/__tests__/validators.test.ts packages/pipeline/src/__tests__/public-api.test.ts
npm run smoke:pipeline -- --target 'data/client-imports/{id}/260528_mbr/NOVA-MBR-PG-001-0.md' --run-id open-design-split-smoke --out-dir tmp/generation-runs/open-design-split-smoke
```

## 8. AI 재량이 아니라 스크립트와 계약으로 강제하는 이유

이 프로젝트에서 AI가 “알아서 잘 생각하게” 두지 않고 typed DTO, checklist, validation, smoke script로 좁히는 이유는 AI를 못 믿어서가 아니다. 이 프로젝트의 출력물이 한 번 보고 끝나는 시안이 아니라, pipeline artifact와 renderer가 소비하는 계약 산출물이기 때문이다.

### 8.1 반복 가능성이 필요하다

같은 `SourceSpec`에서 실행할 때마다 화면 목적, pattern candidate, source ref vocabulary, validation warning 기준이 크게 흔들리면 이후 apply, review, regression 비교가 어렵다.

스크립트와 계약은 “좋은 결과”를 보장하기보다, 같은 입력에서 같은 판단 축을 남기게 한다.

### 8.2 실패 지점이 보여야 한다

AI에게 자유롭게 맡기면 결과가 틀렸을 때 다음 중 무엇이 문제인지 분리하기 어렵다.

- SourceSpec 해석 문제
- ScreenIntent 문제
- CompositionPlan 문제
- pattern candidate 선택 문제
- RenderTree schema 문제
- component contract 문제
- quality review 문제
- revision decision 문제

Stage artifact와 validation report를 강제하면 실패 지점이 파일로 남는다.

### 8.3 책임 경계를 보존해야 한다

AI는 문맥이 길어지면 renderer, validation, orchestration, pipeline 책임을 자연스럽게 섞으려는 경향이 있다.

예를 들어:

- renderer가 infer를 하기 시작한다.
- validation이 retry decision을 하기 시작한다.
- orchestration이 파일을 읽기 시작한다.
- agent prompt가 schema 밖 필드를 사실상 계약처럼 쓰기 시작한다.

스크립트와 파일 경계는 이런 혼합을 막는 guardrail이다.

### 8.4 품질 기준을 말로만 두면 drift가 생긴다

“좋은 화면을 만들어라”는 지시는 실행마다 다르게 해석된다. 반면 다음 항목은 drift를 줄인다.

- source 없는 metric 금지
- pattern candidate 밖 layout id warning
- stateful surface의 state coverage warning
- quality P0 finding은 revision 후보
- warning-only는 human review

이런 규칙은 AI의 창의성을 없애는 것이 아니라, 창의성이 발휘될 수 있는 범위를 제품 계약 안으로 제한한다.

### 8.5 사람이 인수인계할 수 있어야 한다

이 저장소는 여러 agent 역할과 사람이 이어받는 구조다. 따라서 “AI가 그때 잘 판단했다”보다 “어떤 입력, 어떤 helper, 어떤 artifact, 어떤 report 때문에 이 결과가 나왔는지”가 중요하다.

스크립트는 인수인계 가능한 증거를 만든다.

## 9. 결론

AI에게 완전히 맡기지 않는 이유는 화면 품질을 낮추기 위해서가 아니라, 생성 과정을 제품화 가능한 pipeline으로 만들기 위해서다.

AI의 역할:

- SourceSpec을 해석한다.
- 화면 의도와 구성안을 제안한다.
- bounded context 안에서 RenderTree 후보를 만든다.
- quality finding을 제안한다.

스크립트와 계약의 역할:

- 입력과 출력 surface를 고정한다.
- 사용 가능한 source ref, layout id, component prop 범위를 고정한다.
- 실패와 warning을 artifact로 남긴다.
- revision/human review decision을 반복 가능하게 만든다.

즉, AI는 판단을 하지만 pipeline은 판단이 탈선하지 않도록 난간을 둔다.
