# Pipeline Stage Protocol

## 1. 문서 책임

이 문서는 `@cx/pipeline`이 실행하는 stage 순서, stage 간 입출력, side effect 경계의 정본이다.

제품 방향은 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 패키지 관계망은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 저장소 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다.

이 문서는 개별 validator 규칙 본문, prompt 원문, agent-facing design skill/checklist 본문을 소유하지 않는다. 해당 내용은 각 패키지와 [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs)에서 관리한다.

## 2. 목적

`@cx/pipeline`은 실행 가능한 pipeline과 side effect를 소유한다. 이 문서는 다음 두 가지를 고정한다.

- 어떤 stage가 어떤 순서와 책임으로 실행되는가
- 각 stage에서 어느 패키지가 입력 조립, AI 실행, 검증, 파일 반영을 소유하는가

`PACKAGE_MAP.md`와 `packages/pipeline/README.md`는 패키지 관계와 사용법만 요약하고, stage 순서와 stage별 계약은 이 문서로 링크한다.

## 3. 소유 경계

```text
source artifact read
-> @cx/adapters/markdown
-> @cx/inference-nodes
-> @cx/agent
-> @cx/validation
-> @cx/pipeline side effects
```

경계 규칙:

- `@cx/pipeline`: stage 순서, runtime context, AI step 선언과 agent adapter 연결, command 실행, artifact write
- `@cx/inference-nodes`: 각 stage의 순수 입력 조립
- `@cx/agent`: Claude 실행과 세션 정책
- `@cx/validation`: schema/catalog/layout 검증 리포트 반환
- `@cx/renderer`: 완료된 RenderTree preview 소비만 담당

AI stage 실행 규칙:

- AI stage는 `usesAI: true` Step으로 선언하고 `runStepPipeline(..., { agent })` 경로에서만 실행한다.
- stage별 context 조립은 `@cx/inference-nodes` node/helper를 그대로 사용한다.
- AI step runner는 stage executor 내부 전역 상태만 보지 않고 runtime이 resolve한 `inputs`를 인자로 받는다. 예: `runGenerateRenderTreeAiStep(inputs, state, runner)`.
- fake/Claude 전환은 stage executor 내부 분기가 아니라 pipeline agent adapter에서 결정한다.
- 실행 방식이 fake에서 Claude local-first로 바뀌어도 agent input context와 trace의 runner request shape는 유지한다.

Step input/output 규칙:

- 모든 step의 공개 output contract는 named output map으로 선언한다. 기본 output name은 `result`다.
- runtime은 step 완료 시 `state.steps[step.id].outputs.result`에 결과를 저장한다. migration 기간에는 기존 `state.steps[step.id].output`도 compatibility alias로 유지한다.
- 새 step 간 참조는 `stepOutput("step-id", "result")`를 사용한다. `from("step.step-id.some.path")`는 compatibility path로만 남긴다.
- 외부 reference는 `refInput("componentCatalogs")`처럼 입력 API helper로 선언한다.

design skill/context 경계:

- `@cx/inference-nodes`: `DesignSkillSelection`과 design-context bundle ref를 결정론적으로 선택한다.
- `@cx/pipeline`: 선택된 bundle ref의 agent-facing 본문을 로드해 필요한 agent stage context에 주입하고, 선택 결과를 artifact trace에 기록한다.
- `@cx/agent`: 주입된 skill/context를 prompt 입력으로 소비한다. 파일 도구로 디자인 문서를 직접 읽지 않는다.
- `packages/agent/docs/`: design skill 본문, design-context bundle 본문, prompt/checklist/output contract의 agent-facing 정본을 소유한다.

## 4. 현재 pipeline 식별자

현재 실행 가능한 pipeline id:

- `screen-generation`

## 5. 현재 stage 순서

현재 `screen-generation` 기준 stage 순서:

```text
read-source
-> parse-source
-> derive-screen-intent
-> plan-composition
-> derive-decoration-plan
-> select-pattern
-> generate-render-tree
-> validate-render-tree
-> propose-components
-> review-quality
-> revise-render-tree-if-invalid
-> validate-render-tree-after-revision
-> write-artifacts
```

stage 순서는 `@cx/pipeline`이 소유한다. 코드 기준 SSOT는
`packages/pipeline/src/pipelines/screen-generation/descriptor.ts`의
`SCREEN_GENERATION_STAGE_DESCRIPTORS`이며, `@cx/inference-nodes`은 이 순서를 결정하지
않는다.

## 6. 논리 레이어

물리 artifact 파일은 stage 번호가 없는 flat 구조로 저장하지만, manifest와 trace는 stage를 다음 논리 레이어로 묶는다.

| 레이어 | Stage |
|---|---|
| `Understand` | `read-source`, `parse-source`, `derive-screen-intent` |
| `Compose` | `plan-composition`, `derive-decoration-plan`, `select-pattern`, `generate-render-tree` |
| `Revise` | `validate-render-tree`, `propose-components`, `review-quality`, `revise-render-tree-if-invalid`, `validate-render-tree-after-revision`, `write-artifacts` |

소비자는 파일명 prefix를 추측하지 않고 `manifest.json.stageOrder`, `manifest.json.stageLayers`, `trace.json.layers`, artifact pointer를 따른다.
Web 진행 상태와 smoke manifest의 layer metadata도 같은 screen-generation descriptor에서
파생한다.

## 7. Stage 입출력 계약

### `read-source`

- 입력: source path, source kind
- 실행 소유: `@cx/pipeline`
- 출력: `PipelineMarkdownSourceFile`
- side effect: source artifact read

### `parse-source`

- 입력: `PipelineMarkdownSourceFile`
- 실행 소유: `@cx/pipeline` -> `@cx/adapters/markdown`
- 출력: `SourceSpec`, parser issues
- side effect: 없음

### `derive-screen-intent`

- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 출력: `screen-intent` agent result
- side effect: 없음

### `plan-composition`

- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 입력: SourceSpec, screen-intent result, pattern layer candidates, design skill selection
- 출력: `composition-plan` agent result, selected design skill trace
- 책임: `buildDesignSkillSelection()`으로 화면군별 bounded design skill을 선택하고 composition planning 입력에 포함한다.
- side effect: 없음

### `derive-decoration-plan`

- 입력 조립 소유: `@cx/inference-nodes`
- 실행 소유: `@cx/pipeline` -> `@cx/inference-nodes`
- 출력: deterministic `DecorationPlan`
- 책임: SourceSpec 내부 이름과 사용자 노출 구조를 분리하고, 약관 목록/동의 controls처럼 source section 안에서 역할이 갈리는 area를 contract에 따라 split한다.
- side effect: 없음

### `select-pattern`

- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 입력: SourceSpec, screen-intent result, composition-plan result, DecorationPlan, pattern layer candidates, design skill selection, design-context bundle refs
- 출력: pattern-selection agent result
- 책임: DecorationPlan 기반 layer candidates와 selected design skill을 함께 참조해 bounded pattern 후보를 고른다.
- side effect: 없음

### `generate-render-tree`

- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 출력: 최소 `tableGenerationResult` + `renderTree`를 포함하는 생성 결과
- 참조 자산: `@cx/agent` 내부 생성 자산 문서, selected design skill, design-context bundle body
- 책임: `@cx/pipeline`이 design-context bundle body를 로드해 generation 입력 context에 주입한다. 생성 결과의 primary handoff는 `RenderTreeContract`이며, `tableGenerationResult`는 validation/comparison용 intermediate다.
- side effect: 없음

### `validate-render-tree`

- 입력: generation result
- 실행 소유: `@cx/validation`
- 출력: validation report
- 책임: schema/catalog/layout/source-ref 계약 검증 결과를 반환한다. 디자인 품질 판단과 retry 여부 결정은 소유하지 않는다.
- side effect: 없음

### `propose-components`

- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 검증 소유: `@cx/validation`
- 입력: SourceSpec, generated candidate, component contract catalog, upstream design artifacts, selected design skill, design-context bundle body
- 출력: 비파괴 `component-proposal` agent result와 proposal validation report
- 책임: catalog 밖 후보를 제안 artifact로만 남긴다. 확정·반영은 `@cx/components` mutation과 별도 승인 흐름으로만 수행한다.
- side effect: 없음

### `review-quality`

- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 입력: SourceSpec, generated candidate, validation report, upstream design artifacts, selected design skill quality gates, design-context bundle body
- 출력: `quality-review` / `quality-inspection` agent result
- 책임: hierarchy, separation, fidelity, actionClarity, densityFit, patternFit 등 디자인 품질을 bounded finding으로 기록한다. P0 finding은 revision 판단의 입력이 된다.
- side effect: 없음

### `revise-render-tree-if-invalid`

- 조건: validation report 또는 quality review 결과가 revision을 요구할 때만 실행
- 입력 조립 소유: `@cx/inference-nodes`
- AI 실행 소유: `@cx/agent`
- 입력: previous candidate, validation report, quality review, upstream design artifacts, selected design skill, design-context bundle body
- 출력: revised generation result
- 책임: 기존 selected design skill과 bundle context를 유지한 채 bounded revision을 수행한다.
- side effect: 없음

### `validate-render-tree-after-revision`

- 입력: revision result
- 실행 소유: `@cx/validation`
- 출력: 후속 validation report
- side effect: 없음

### `write-artifacts`

- 입력: sourceSpec, agent result, validation report, quality review, component proposal, selected design skill, design-context bundle selection, trace 대상 부가 artifact
- 실행 소유: `@cx/pipeline`
- 출력: versioned artifacts, run log, pipeline result envelope
- side effect: 있음

## 8. Stage별 금지 사항

- `@cx/inference-nodes`은 파일 IO를 하지 않는다.
- `@cx/inference-nodes`은 stage 순서와 retry 정책을 소유하지 않는다.
- `@cx/agent`는 artifact write를 하지 않는다.
- `@cx/validation`은 다음 액션을 결정하지 않는다.
- `@cx/pipeline`은 prompt 원문, design skill 본문, design-context bundle 본문, validator 세부 규칙을 소유하지 않는다.
- `@cx/pipeline`은 design-context bundle 파일을 로드할 수 있지만, bundle 본문 규칙을 재작성하거나 해석하지 않는다.
- `@cx/agent`는 디자인 문서를 파일 도구로 직접 읽지 않는다. 필요한 본문은 pipeline이 context로 주입한다.

## 9. 실패와 중단 규칙

- `parse-source`가 실패하면 이후 design stage는 건너뛰고 `write-artifacts`만 수행할 수 있다.
- validation 실패 또는 quality review P0 finding은 곧바로 파일 반영 금지를 뜻하지 않지만, revision 또는 후속 next action 판단의 입력이 된다.
- 어느 stage를 재시도할지의 실행 판단은 `@cx/pipeline`이 소유하되, 재개 세션 해석은 `@cx/agent` 프로토콜을 따른다.
- 기본 생성 요청은 새 세션이다. revision/retry/이어쓰기 흐름에서만 `@cx/agent` 세션 resume 정책을 따른다.

## 10. Artifact 추적 규칙

pipeline은 가능한 한 각 stage의 입력과 결과를 감사 가능한 artifact로 남긴다.

대표 예시:

- source read result
- parse result / `SourceSpec`
- screen-intent agent input/result
- composition-plan agent input/result
- decoration plan
- pattern-selection input/result
- generation input/result
- validation reports
- component proposal and validation report
- quality review / quality inspection
- design skill selection
- design-context bundle selection
- revision decision and revision input/result when executed
- pipeline result summary

대표 flat artifact:

- `source-spec.json`
- `screen-intent.json`
- `composition-plan.json`
- `decoration-plan.json`
- `pattern-selection.json`
- `agent-result.json`
- `final-result.json`
- `validation-report.json`
- `quality-review.json`
- `component-proposal.json`
- `trace.json`
- `pipeline-result.json`

agent input, runner request, 후보, bundle 선택, skill 선택, initial validation, revision decision 같은 디버그 스캐폴딩은 개별 stage 번호 파일로 흩뜨리지 않고 `trace.json`으로 통합한다.

## 11. 관련 참조 자산

- stage 순수 입력 조립: `@cx/inference-nodes`
- agent prompt/checklist/output 규약: [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs)
- design skill 본문: [`packages/agent/docs/design-skills/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs/design-skills)
- design-context bundle 본문: [`packages/agent/docs/design-context/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs/design-context)
- 현재 단계별 상세 해설: [SCREEN_GENERATION_PIPELINE.md](/Users/plusx/Documents/rnd-screen-generator/docs/SCREEN_GENERATION_PIPELINE.md)
- 완료된 확장 설계 기록: [SCREEN_DESIGN_STAGE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/SCREEN_DESIGN_STAGE_PLAN.md)

## 12. 검증 기준

- `PipelineStageId`와 문서의 stage 목록이 일치한다.
- stage 순서 소유자가 `@cx/pipeline`으로 유지된다.
- stage 입력 조립 소유자가 `@cx/inference-nodes`으로 유지된다.
- `write-artifacts`만 side effect stage라는 기준이 유지된다.
- `PACKAGE_MAP.md`와 `packages/pipeline/README.md`가 stage 순서 상세를 중복하지 않고 이 문서를 참조한다.
