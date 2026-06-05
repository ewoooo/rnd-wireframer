# @cx/pipeline

`@cx/pipeline`은 생성 과정을 실행하는 pipeline runtime이자 side effect/IO 유틸리티 패키지다.

stage/runtime 계약의 정본은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)를 따른다.

현재 MVP에서는 `buildPipeline()`/`runPipeline()`으로 screen generation pipeline을 실행하고, 내부 stage에서 승인된 side effect command 배열을 순서대로 실행한다. source artifact read/versioned artifact/write log/approved artifact apply 결과는 감사 가능한 envelope로 반환한다. 외부 저장소 sync, queue/worker, 병렬 실행, 복잡한 retry 정책은 후속으로 미룬다.

`@cx/inference-nodes`는 각 stage에서 실행할 node wrapper와 deterministic helper를 제공하고, `@cx/validation`은 순수 검증 결과를 반환한다. `@cx/pipeline`은 stage 순서, runtime context, AI step 선언과 agent adapter 연결, validation 호출, IO/effect 실행을 조립한다.

AI stage는 `usesAI: true` Step으로 선언하고 `runStepPipeline(..., { agent })` 경로로 실행한다. fake/Claude local-first 전환은 screen-generation stage executor 내부가 아니라 pipeline agent adapter가 담당하며, 전환 후에도 agent input context와 trace의 runner request shape를 유지한다.

Step 결과는 named output map으로 저장한다. 기본 참조점은 `state.steps[step.id].outputs.result`이며, step 간 wiring은 `stepOutput("step-id", "result")` helper를 우선 사용한다. 기존 `state.steps[step.id].output`은 migration compatibility alias다.

생성/검수 prompt, checklist, output 규약 같은 문장형 자산의 정본은 `@cx/pipeline`이 아니라 [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs)에서 관리한다.

screen generation의 최종 산출물은 `final-result.json`으로 저장한다. 이 파일은 agent raw result나 table-shaped intermediate가 아니라 `RenderTreeContract` 자체이며, `children` 아래에 `Screen` root와 Header/Contents/Bottom region을 갖는 스크린 렌더트리 형태여야 한다.

기본 smoke artifact store는 `data/runs/screen-generation/<run-id>`이며, run root에는 `manifest.json`, 실제 산출물은 `artifacts/` 아래에 둔다. `tmp/generation-runs`는 local-transient/debug preset으로만 사용한다.

`artifacts/` 아래 결과 파일은 stage 번호 없이 flat하게 저장한다. `source-spec.json`, `screen-intent.json`, `composition-plan.json`, `decoration-plan.json`, `pattern-selection.json`, `agent-result.json`, `final-result.json`, `validation-report.json`, `quality-review.json`, `component-proposal.json`, `pipeline-result.json` 같은 결과 파일은 개별로 두고, agent input, runner request, 후보, bundle 선택, skill 참조, initial validation, revision decision 같은 디버그 스캐폴딩은 `trace.json` 하나로 통합한다.

추론 모델은 물리 폴더가 아니라 `Understand -> Compose -> Revise` 논리 레이어로 표현한다. 레이어별 stage 묶음과 stage 입출력 계약은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)를 따른다.

소비자는 파일명을 하드코딩하지 않고 `manifest.json` 포인터와 `trace.json` key를 따른다.

테이블 반영은 `final-result.json` RenderTree를 screen, area, composite/component 레이어로 분해해 등록하는 apply 단계만 수행한다. apply 단계는 새 생성, 의미 재해석, 디자인 보정, validation retry를 하지 않는다.

## 책임

- 버전 있는 생성 산출물을 파일 시스템이나 외부 저장소에 반영한다.
- source artifact를 파일 시스템이나 외부 저장소에서 읽는다.
- 등록된 pipeline definition을 실행한다.
- pipeline stage context와 stage artifact bag을 관리한다.
- pipeline stage 내부에서 `@cx/inference-nodes`, `@cx/agent`, `@cx/validation`을 연결한다.
- catalog CRUD 결과나 agent 실행 결과를 승인된 side effect 명령으로 연결한다.
- 이미 읽힌 Markdown source를 `@cx/adapters/markdown`에 전달해 MVP SourceSpec 산출물을 회수한다.
- 승인된 side effect 명령의 실행 순서와 실행 결과 envelope를 관리한다.
- CLI, 서버 action, 후속 backend bridge가 공유할 side effect 실행 경계를 제공한다.
- 실행 결과와 실패 정보를 감사 가능한 형태로 돌려준다.

## MVP 구조

```text
packages/pipeline/src/
  index.ts
  public/        외부 contract와 type surface
  runtime/       buildPipeline/runPipeline 실행 runtime
  pipelines/     screen-generation 같은 pipeline definition과 stage 구현
  commands/      pipeline이 실행 가능한 side effect command 타입과 command helper
  runner/        command 배열 실행, executor registry, result envelope
  executors/     파일 읽기, 파일 쓰기, run log 쓰기, 승인 artifact 반영
  adapters/      fs/clock/id 환경 의존성 adapter와 Node 기본 factory
  errors/        pipeline 전용 error
  testing/       memory fs와 test adapter fixture
```

`@cx/pipeline`은 실행 흐름을 관리하지만 stage별 업무 입력 조립 자체는 `@cx/inference-nodes` node/helper에 위임한다. IO는 기존 `runSideEffects()` command runner를 통해 실행한다.

## Public API

```ts
import { runPipeline } from "@cx/pipeline";

await runPipeline("screen-generation", {
  agentMode: "fake",
  source: {
    path: "data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
    type: "file",
  },
});
```

Side effect command만 직접 실행해야 하는 내부/테스트 경로에서는 `runSideEffects()`와 adapter contract를 사용할 수 있다. Node 환경에서는 `createNodePipelineAdapters()`를 사용하고, 테스트나 서버 특수 환경에서는 같은 contract를 직접 주입한다.

## Pipeline Boundary

`@cx/pipeline`은 pipeline definition을 실행하고, stage 내부에서 이미 결정된 side effect command를 실행한다.

할 수 있는 일:

- versioned artifact write
- source artifact read
- run log write
- approved artifact apply by decomposing final RenderTree layers
- file system adapter를 통한 파일 write/copy/read
- side effect 실행 결과 반환
- screen-generation pipeline 실행
- agent/validation/inference node 호출 조립

하지 않는 일:

- stage별 deterministic input 조립 rule 소유
- Claude adapter 구현
- validation rule 판단
- retry 정책 결정
- SourceSpec 또는 RenderTree의 업무 의미 해석

즉 pipeline은 runtime을 실행하지만, 각 stage의 순수 판단과 입력 조립 규칙은 `@cx/inference-nodes`에 둔다.

## 두지 않는 책임

- 순수 stage input/output 조립
- Markdown parsing rule 소유
- 검증 rule 판정
- 비즈니스 workflow 소유
- RenderTree React render
- component/layout/pattern catalog 값 소유
- final RenderTree 의미 재해석
- 생성/검수 계약의 SSOT

## Public Subpaths

| Subpath                 | 책임                                                      |
| ----------------------- | --------------------------------------------------------- |
| `@cx/pipeline`          | 패키지 루트 public API                                    |
| `@cx/pipeline/adapters` | Node adapter factory                                      |
| `@cx/pipeline/commands` | side effect command 타입과 command helper                 |
| `@cx/pipeline/contract` | side effect boundary contract                             |
| `@cx/pipeline/parser`   | 이미 읽힌 Markdown source를 markdown adapter로 전달하는 command facade |
| `@cx/pipeline/runner`   | side effect command runner                                |
| `@cx/pipeline/runtime`  | pipeline runtime builder/runner                           |
| `@cx/pipeline/testing`  | 테스트 전용 memory adapter fixture                        |
| `@cx/pipeline/types`    | public type surface                                       |

`screen-generation` pipeline의 design skill/context 주입, component proposal, quality review, revision 조건은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)에 둔다.

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.
