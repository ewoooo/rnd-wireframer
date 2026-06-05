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

**S1 잔여(의도적):** `generationNextAction`(결정), `initialValidationReport`(첫 리포트), `retryCount`(루프 횟수), `preRevision*`(스냅샷) — 피드백 루프의 **cross-iteration 제어 상태**. 단순 데이터 input이 아니라 제어흐름 5번째 축에 속함.

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
