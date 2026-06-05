# 파이프라인 선언화 Plan — 5축 defineStep + descriptor 제거

> 목표: 파이프라인 정의를 self-contained `defineStep({ id, layer, input, run, output })` 호출만으로 남기고, 별도 `descriptor.ts`(stage 메타 배열) + `screenGenerationStageRuntimes`(run 맵) + 명령형 `runXAiStep` 오케스트레이션을 제거한다.
>
> 브랜치: `codex/pipeline-declarative-steps`

## 5축 모델 (합의됨)

```ts
defineStep({
  id: "generate-render-tree",
  layer: "compose",
  input: {                       // 이전 step 출력 + references (refs ⊂ input)
    source: outputOf("parse-source"),
    intent: outputOf("derive-screen-intent"),
    references: refs(["componentCatalog", "layoutCatalog", "designContext", "skillBundle"]),
  },
  run: screenGenerationNode,     // 순수 fn | AI 노드 → useAI 파생
  output: renderTreeCandidateContract,
})
// 제어흐름은 별도 5번째 축(when/feedback) — generationNextAction 등 cross-iteration 상태
```

## 동작 보존 게이트 (불변식)

**매 증분마다** fake-agent 스모크 산출물(안정 파일: source-spec / screen-intent / composition-plan / decoration-plan / pattern-selection / agent-result / final-result / validation-report / component-proposal / quality-review / trace)을 runId·경로·타임스탬프 정규화 후 sha256 비교 → **byte-identical**. 추가로 `tsc --noEmit` 0, `biome lint` clean, 파이프라인 테스트 green.

- 게이트 스크립트: `/tmp/pipe-gate/gate.sh` (golden sha: 정규화 blob 기준)
- 깨지면 그 증분에서 멈추고 diff로 원인 추적.

## 완료 현황

| 단계 | 상태 | 커밋 |
|---|---|---|
| **S0** 엔진 `refs([])` + async resolver + run단위 memoize | ✅ | `8600d402` |
| **S1** 데이터흐름 선언화 (7 AI step + validate가 파생 데이터를 선언적 `inputs`로 읽음, references는 `inputs.X`, validate는 rich output) | ✅ | `da1df530`~`2faa9e10` (10커밋) |
| **S2a** artifact-commands → descriptor 순환 끊기 (layer-groups를 입력으로) | ✅ | `e6de25bc`, `…(test fix)` |
| **S4b** 7 AI step이 rich output(`agentStepOutput`: agent triple + payload + 파생) 반환, 다운스트림은 `readAgentStepPayload`로 subfield 읽음 | ✅ | `a960f9d0` |
| **S2/S3** descriptor.ts·`screenGenerationStageRuntimes`·`createScreenGenerationStep` 팩토리 제거 → 단일 `SCREEN_GENERATION_STEPS`(`defineScreenStep`) 배열로 통합. 순수 상수/맵은 leaf `constants.ts`로 분리. getter/layers는 배열에서 파생, public API는 descriptor 전용 export 제거 | ✅ | `464e254c` |
| **S5** 죽은 블랙보드 필드 제거(`designContextBundleContents`→지역변수, `sourceReadResult` 삭제) + S4a 미사용 배선 회수 | ✅ | `5b9819d0` |
| **S4c/S4d** 블랙보드 데이터 write 완전 제거(write-artifacts/projection을 engine step 출력에서 조립) | ⏸️ 보류(아래 결정 사항) | — |

**S1 잔여(의도적):** `generationNextAction`(결정), `initialValidationReport`(첫 리포트), `retryCount`(루프 횟수), `preRevision*`(스냅샷) — 피드백 루프의 **cross-iteration 제어 상태**. 단순 데이터 input이 아니라 제어흐름 5번째 축에 속함.

## 실현된 아키텍처 & 결정 사항 (2026-06-05)

**달성:** 파이프라인 정의가 `descriptor 배열 + stageRuntimes 맵 + step 팩토리`의 3분할 인다이렉션 없이, 메타데이터와 run이 한곳에 있는 단일 `SCREEN_GENERATION_STEPS = [defineScreenStep({ id, layer, kind, message, input, output, run/runAi, taskKind?, skipPolicy? }), …]` 배열로 collapse됨. 순환 없는 leaf `constants.ts`(어휘) + 배열 파생 getter. 5축 모델 충족(제어흐름은 `skipPolicy`/feedback = 5번째 축). 동작 보존 게이트(11개 산출물 byte-identical) 전 구간 green.

**보류한 것 — 블랙보드 데이터 write 완전 제거(S4c/S4d):** 도메인 `state`는 현재 **run-context/aggregator + 제어 상태**로 남아 있다(데이터 흐름의 1차 경로는 이미 선언적 `inputs`). 완전 제거를 보류한 기술적 근거:

1. **엔진이 skip된 step의 출력 참조 시 throw** (`resolveStepInput`, `step-input-resolver.ts`). `write-artifacts`는 parse 실패·happy-path에서 일부 step이 skip되는 **terminal aggregator**라 `stepOutput([...])` 선언 입력으로 조립할 수 없다. 선언적 조립을 하려면 *옵셔널 step-output 입력* 또는 *engine 실행 state를 `StepRunContext`로 노출*하는 **엔진 변경**이 선행돼야 한다.
2. **revision(피드백 루프) 경로가 무테스트.** golden 게이트는 happy-path만 커버하고, `generationNextAction`/`preRevision*`/rollback(악화 시 복원)으로 결정되는 **최종 후보(state.generation.agentResult)·최종 validationReport**는 cross-iteration 제어 상태다. 이를 step 출력 기반으로 재구성하면 검증 불가능한 revision 경로에서 silent regression 위험이 있다. → **revision fixture 확보가 선행 조건.**

따라서 S4c/S4d는 (엔진 `StepRunContext`에 실행 state 노출 + revision fixture) 두 선행 작업 후 별도로 진행하는 것이 안전하다. 현재 상태는 사용자가 명시한 핵심(“descriptor 제거 + 단일 defineStep”)을 충족하며, 게이트로 완전 검증된 안정 지점이다.

## 핵심 제약 (왜 이 순서인가)

1. **`createScreenGenerationStageLayers`는 public** (`@cx/pipeline` export, `apps/web/src/lib/screen-inference-run.ts`가 사용) → stage 메타가 **leaf 모듈**에 있어야 함.
2. **run+메타를 한 배열(defineStep)로 합치려면** 그 배열이 run 함수와 같은 모듈에 있어야 하는데, run 함수가 pipeline 상태(`state`)에 의존하면 leaf로 못 내림.
3. 따라서 **run을 순수화(S4)** → run+메타 배열을 leaf로 이동 가능 → 그때 descriptor 제거(S2/S3)가 순환 없이 성립.

→ **올바른 순서: S4 → (순환 해소) → S2/S3 → S5**

---

## S4 — projection 일반화 (run 순수화)

**목표:** step 본문의 `state` 쓰기 제거. 각 step이 **rich output**을 반환하고, 최종 projection(`createScreenGenerationPipelineResult` + artifact 입력)이 **engine step 출력**(`runStepPipeline` 반환의 `state.steps[id].outputs.result`)에서 조립. 결과적으로 run 함수는 `(inputs) → output` 순수형(제어 상태 제외).

### 단계 (각 gate)
1. **S4a** `runScreenGenerationStepRunner`가 `runStepPipeline`의 반환(`StepPipelineRunResult`)을 호출부로 전달. (additive, 미사용 → gate neutral)
2. **S4b** 각 AI step이 agent triple을 포함한 rich output 반환:
   - 현재 payload만 반환하는 step(derive-screen-intent, select-pattern, propose, review, revise, generate)을 `{ agentInput, agentResult, runnerRequest, payload, …파생 }` 형태로 확장.
   - plan-composition/validate는 이미 rich. 일관 스키마로 통일(`AgentStepOutput<T>`).
3. **S4c** projection을 engine step 출력에서 조립하도록 전환:
   - `createScreenGenerationPipelineResult(runResult)` — `runResult.state.steps[id].outputs.result`에서 flat 필드 생성. 기존 `projectCommonAgentSteps`/`flattenAgentStep` 재사용하되 소스를 state 블랙보드 → step 출력으로 교체.
   - `runWriteArtifactsStage`도 동일하게 step 출력에서 구성.
   - **출력 키 byte-identical** 게이트로 검증.
4. **S4d** step 본문의 데이터 `state` 쓰기 제거 (제어 상태 쓰기만 유지: `generationNextAction`, `initialValidationReport`, `preRevision*`). run 함수가 순수형에 근접.
5. **S4e** 제어 상태 정리: `generationNextAction`을 review step의 output으로 노출 → revise/feedback이 `inputs`/feedback `when(deps)`로 소비. `initialValidationReport`/retryCount는 feedback 루프 상태로 엔진/feedback 규칙에 위임. (제어흐름 5번째 축 정착)

### 리스크
- rich output 스키마 변경이 trace/result 산출물에 영향 → byte-identical 게이트로 차단.
- 제어 상태(S4e)는 피드백 루프 동작에 직결 → revision 경로를 타는 시나리오로 추가 검증 필요(현 golden은 happy-path; revision 트리거 fixture 확보 권장).

---

## 순환 해소 (S4 이후)

1. run이 순수해지면 **stage 정의 배열(메타 + 순수 run)을 leaf 모듈**(`steps.ts`)로 이동 가능.
2. `createScreenGenerationStageLayers` + getters(`getScreenGenerationStageOrder` 등)를 그 배열에서 파생하도록 leaf에 배치.
3. `@cx/pipeline` index + `apps/web`의 import 경로 유지(재export).
4. S2a로 이미 artifact-commands 순환은 끊김 → 남은 건 descriptor↔pipeline 순환뿐이며 leaf 이동으로 해소.

---

## S2/S3 — 5축 defineStep 인라인 + descriptor 제거

1. **S2** `steps.ts`에서 각 step을 `defineScreenStep({ id, layer, input, run, output, taskKind?, skipPolicy?, message })`로 직접 선언. `SCREEN_GENERATION_STAGE_DESCRIPTORS`(데이터 배열) + `createScreenGenerationStep`(매퍼) + `screenGenerationStageRuntimes`(run 맵) 삭제.
   - `defineScreenStep`: 엔진 `PipelineStep`(usesAI 파생) + screen-gen 메타(layer/taskKind/skipPolicy/message) 보유.
   - `input`에 `refs([...])` 그룹 사용(현재 개별 refInput → 그룹화). 본문은 `inputs.references.X`.
2. **S3** `descriptor.ts` 정리: 타입 + 순수 상수(`SCREEN_GENERATION_PIPELINE_ID`, `ARTIFACT_FILES`, `LAYER_ORDER/LABELS`)만 남기거나 `steps.ts`로 통합. `createFakeAgentRunner`를 node 단위 fake로 재배치(stage 키 미러링 제거).
3. helper(layers/manifest/getters)는 `steps.ts` 배열에서 파생, public export 유지.

### 게이트
- 매 step 전환마다 byte-identical + tsc + lint.
- public API(@cx/pipeline export, apps/web 소비) 보존: tsc 전체가 안전망.

---

## S5 — 정리·전체 검증

- 죽은 코드 제거(미사용 헬퍼/타입), import 정리.
- 전체 `tsc --noEmit` 0, `vitest run` green, `biome lint` clean, fake-agent 스모크 byte-identical.
- revision 경로 fixture로 제어흐름(S4e) 동작 보존 추가 확인.

---

## 공유 워킹트리 주의

- 이 브랜치는 옆 세션(inference-nodes 최적화)과 공유될 수 있음. 전역 git 조작(stash/reset/checkout) 금지. 커밋은 **파이프라인 파일만 pathspec**으로 분리.
- inference-nodes는 본 plan에서 **수정하지 않음**(순수 primitive 유지). 노드 조합은 preset 레벨에서.

---

# 부록: 최종 설계 명세 (Target)

## A. 디렉토리 구조

의존 DAG(단방향, 무순환): **contract ← persistence ← runtime ← presets** (+ testing는 dev 전용 sibling).

```
packages/pipeline/src/
  contract/                 # 공유 어휘. ZERO 내부 의존 (leaf).
    types.ts                #   StepInputRef, PipelineExecutionState, PipelineRunStatus/Event,
                            #   PipelineRunResult, OutputContract, SideEffect* …
    contract.ts             #   sideEffectBoundary
    smoke-run-manifest.ts
  runtime/                  # 제네릭 엔진 (도메인 무지)
    run-step-pipeline.ts    #   오케스트레이션 루프
    definition/             #   definePipeline, defineStep, from/refInput/refs/stepOutput/value,
                            #   step-input-resolver(async + reference memoize)
    side-effects/           #   run-side-effects, command-registry, executors/*
    adapters/               #   clock, id, node-fs (IO 포트)
  persistence/              # run-status 상태머신 + file adapter (contract에만 의존)
    run-status.ts, file-persistence.ts
  presets/
    screen-generation/
      steps.ts              #   ★ 5축 defineStep 배열 (메타 + 순수 run) — descriptor 대체
      nodes/                #   composed step-node (inference-nodes primitive 조합)
      references.ts, skill-catalog.ts, design-context-catalog.ts
      artifact-commands.ts  #   산출물 커맨드 (layer-groups는 입력)
      projection.ts         #   step 출력 → PipelineRunResult/trace 조립
      run.ts                #   runScreenGenerationPipeline + runPipeline 디스패처
  testing/                  # fixtures, memory-fs (dev)
  index.ts                  # public 배럴
```

현재→목표 매핑: `public/`→`contract/`; `runtime`+`definition`+`runner`+`executors`+`adapters`→`runtime/*`; `persistence/`→그대로; `pipelines/screen-generation/`→`presets/screen-generation/`(+ `descriptor.ts`는 `steps.ts`로 흡수, 명령형 `screen-generation-pipeline.ts`는 `run.ts`+`nodes/`+`projection.ts`로 분해); `commands/`→preset(도메인 전용).

## B. API

### B-1. 제네릭 엔진 (재사용 가능, 도메인 무지)
- **정의**: `definePipeline`, `defineStep`, `from`, `refInput`, `refs`, `stepOutput`, `value`
- **실행**: `runStepPipeline(definition, options) → StepPipelineRunResult`
- **입력 해석**: `resolveStepInputs`(async), `resolveStepInput`, `createReferenceResolution`
- **상태머신**: `createPipelineRunStatus` / `updatePipelineRunStatus` / `completePipelineRunStatus` / `skipPipelineRunStatus` / `createPipelineRunEvent` / `persistPipelineRunEvent`
- **side-effect/adapter**: `runSideEffects`, `createNodePipelineAdapters`, `createFilePipelinePersistenceAdapter`
- **subpath**: `@cx/pipeline/{definition,runtime,runner,persistence,adapters,types,contract,testing,parser,commands}`

### B-2. screen-generation preset
- `runScreenGenerationPipeline(options) → PipelineRunResult` (또는 `runPipeline("screen-generation", options)`)
- `ScreenGenerationPipelineOptions`: `{ source, references?, agentMode?, useAI?, artifactStore?, outDir?, persistence?, onProgress?, disableDesignContext?, tags?, runId? }`
- 헬퍼(public, apps/web 사용): `createScreenGenerationStageLayers`, `getScreenGenerationStageOrder/Layer/Message`, `getScreenGenerationStagesByKind`, `isScreenGenerationAiStageDescriptor`, 상수 `SCREEN_GENERATION_{PIPELINE_ID,ARTIFACT_FILES,LAYER_ORDER,LAYER_LABELS}`

### B-3. 목표 step 정의 형태
```ts
definePipeline({
  id: "screen-generation",
  steps: [ defineStep({ id, layer, input, run, output, /* taskKind?, skipPolicy?, message? */ }) ],
  feedback: [{ from, goTo, thenStep, maxRetries, when }],
})
```

## C. 라이프사이클

`runScreenGenerationPipeline(options)`:
1. **normalize**: source/references/adapters/persistence/runId/paths 확정.
2. **build**: pipeline 정의(steps + feedback) 생성.
3. **runStepPipeline**:
   - init `PipelineRunStatus`(queued) → `writeStatus`
   - cursor 루프, step마다:
     1. `skipWhen(state)` → skipped 기록 → 다음(또는 feedback target)
     2. started 상태 + started 이벤트 emit(`writeStatus`+`appendEvent`+`onEvent`)
     3. **입력 해석**(await): `refs([...])` resolve+run단위 memoize, `outputOf`는 이전 step 출력에서, `value`/`ref` 즉시
     4. **실행**: AI → agent adapter(runAi 노드 + runner) / non-AI → `run(inputs)`
     5. 출력 저장 → `state.steps[id].outputs.result`
     6. completed 상태 + completed 이벤트
     7. **feedback**: `fromStep` 일치 & `retry<max` & `when(output,state)` → `goTo`로 점프, `afterStep[goTo]=thenStep`
     8. 실패 → failed 상태+이벤트 + throw
   - complete 상태(completed) → `writeStatus`
   - artifacts 해석 → `{ artifacts, events, runId, state, status }`
4. **project**: step 출력 → `PipelineRunResult` 조립.

**Revision 피드백 루프**: `review-quality` →(`generationNextAction.action==='request-revision'`)→ `revise-render-tree-if-invalid` → `validate-render-tree-after-revision` (maxRetries 1, 악화 시 pre-revision으로 롤백).

## D. 비즈니스 로직 (13 stage / 3 layer)

| layer | stage | kind | 역할 |
|---|---|---|---|
| understand | read-source | effect | md 소스 읽기 |
| understand | parse-source | deterministic | md → `SourceSpec` 파싱 |
| understand | derive-screen-intent | ai | 화면 의도 추론 |
| compose | plan-composition | ai | compositionPlan + designSkillSelection + designContextBundleSelection + patternLayerCandidates |
| compose | derive-decoration-plan | deterministic | decorationPlan + (decoration 반영) patternLayerCandidates |
| compose | select-pattern | ai | layout 패턴 선택 |
| compose | generate-render-tree | ai | RenderTree 초안 생성 |
| revise | validate-render-tree | validation | 검증 리포트 + (validationReport 반영) bundleRefs 재계산 |
| revise | propose-components | ai | 컴포넌트 제안(비파괴) |
| revise | review-quality | ai | 품질 검수 → `generationNextAction` 결정 |
| revise | revise-render-tree-if-invalid | ai | 요청 시 초안 수정 |
| revise | validate-render-tree-after-revision | validation | 재검증, 악화 시 롤백 |
| revise | write-artifacts | effect | 모든 산출물 + manifest 기록 |

**제어 신호** `generationNextAction`: `request-revision` | `request-human-review` | `accept` — 피드백 루프와 skipPolicy를 구동(5번째 축).

## E. 데이터 구조

```ts
// 입력 참조 (engine)
type StepInputRef = RefStepInputRef | ReferencesStepInputRef | StepOutputStepInputRef | ValueStepInputRef
type ResolvedStepInputs = Record<string, unknown>
type ReferenceResolver = (name, refs) => Promise<unknown> | unknown   // refs([...]) 해석

// 실행 상태 (engine, 블랙보드 아님 — step 출력 보관)
type PipelineExecutionState = {
  input: Record<string,unknown>; refs: Record<string,unknown>; retryCounts: Record<string,number>;
  steps: Record<id, { status; startedAt?; completedAt?; outputs?: { result } ; error? }>
}
type PipelineRunStatus = { …, stageOrder, stages: Record<id,{status,startedAt?,completedAt?}>, status: queued|running|completed|failed }
type PipelineRunEvent  = { eventId, pipelineId, runId, stage?, status: started|completed|failed, timestamp, type }

// step 출력 (preset, target rich 스키마)
type AgentStepOutput<TInput> = { agentInput?: TInput; agentResult?: AgentRunResult; runnerRequest?: AgentRunnerRequest; payload?: unknown }
type CompositionStepResult = { compositionPlan?; designContextBundleSelection?; designSkillSelection?; patternLayerCandidates? }
type DecorationStepResult  = { decorationPlan?; patternLayerCandidates? }
type ValidationStepResult  = { validationReport; designContextBundleSelection? }

// 최종 결과 (preset, flat projection — public 계약)
type PipelineRunResult = {
  outDir; runId; sourcePath; pipelineResult; pipelineResultWrite; summary: PipelineSummary;
  finalResult?; …<stage>Agent{Input,Result}/RunnerRequest; decorationPlan?; designContextBundleSelection?;
  designSkillSelection?; patternLayerCandidates?; validationReport?; revisionDecision?; parseCommandResult?; …
}

// 계약 (메타) + 도메인 타입(@cx/schema)
type OutputContract = { artifactKind?; jsonSchema?; schemaVersion? }
// SourceSpec, CompositionPlanContract, DecorationPlanContract, ValidationReportContract,
// DesignSkillSelectionContract, DesignContextBundle* … 는 @cx/schema 소유.
```

> 주(2026-06-05 갱신): **descriptor.ts·`screenGenerationStageRuntimes`·step 팩토리는 제거 완료**되어 단일 `SCREEN_GENERATION_STEPS`(`defineScreenStep`) 배열 + leaf `constants.ts`로 실현됨. `state` 블랙보드는 **run-context/제어 상태**로 축소되어 잔존한다(데이터 write 완전 제거 S4c/S4d는 위 “결정 사항”의 두 선행조건 후 진행). 위 디렉토리 트리(`steps.ts`/`run.ts`/`projection.ts` 분리)는 추가 목표이며, 현재는 단일 `screen-generation-pipeline.ts`에 통합되어 있다.
