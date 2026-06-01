# Open Design Screen Inference Adaptation Plan

## 1. 문서 책임

이 문서는 Open Design의 화면 infer 방식에서 이 프로젝트에 적용할 수 있는 항목을 실행 계획으로 정리한다.

이 문서는 새 패키지 경계를 정의하지 않는다. 패키지 책임은 루트 `AGENTS.md`, `MASTER_PLAN.md`, `PACKAGE_MAP.md`, `docs/development/PROJECT_STRUCTURE.md`를 따른다.

특히 다음 경계를 유지한다.

- `@cx/agent`는 Claude 실행 adapter와 패키지 내부 참조 문서 자산만 소유한다.
- `@cx/orchestration`은 SourceSpec, 후보 pattern, validation report를 agent input과 next-action data로 조립하는 순수 helper만 소유한다.
- `@cx/pipeline`은 stage 순서, runtime, side effect, artifact write를 소유한다.
- `@cx/schema`는 DTO/schema 계약만 소유한다.
- `@cx/validation`은 검증 report만 반환한다.
- `@cx/renderer`는 완성된 RenderTree JSON을 React로 렌더링한다.
- `docs/design/`은 SKT SDUI 디자인 패턴 정본이다. `packages/agent/docs/`는 agent-facing prompt/checklist/output 자산의 정본이다.

## 2. Open Design 관찰 요약

Open Design은 화면을 typed DTO pipeline으로 직접 infer하지 않는다. 대신 agent가 자유롭게 추론하는 범위를 다음 장치로 좁힌다.

- 첫 턴 discovery form으로 목적, 대상, 플랫폼, 규모, 브랜드/참조 여부를 잠근다.
- skill frontmatter와 `references/checklist.md`로 artifact 유형별 P0/P1 gate를 둔다.
- `DESIGN.md` 9-section design system 문서와 `craft/` 문서를 prompt context로 주입한다.
- visual direction library로 색, typography, posture를 deterministic하게 고른다.
- TodoWrite plan, checklist self-check, 5-dimension critique를 생성 전에 강제한다.
- HTML artifact, template, iframe preview를 런타임 산출물로 사용한다.

우리 프로젝트는 HTML artifact runtime을 흡수하지 않는다. 대신 `SourceSpec -> ScreenIntent -> CompositionPlan -> pattern selection -> RenderTree -> validation` 흐름 안에서 같은 제어 원리를 데이터 계약과 checklist로 번역한다.

## 3. 현재 Pipeline 실행 흐름

현재 실행 가능한 pipeline id는 `screen-generation`이다. public entry는 `@cx/pipeline`의 `runPipeline("screen-generation", options)`이며, 실제 stage 순서는 `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts`가 소유한다.

현재 stage 순서:

```text
read-source
parse-source
derive-screen-intent
plan-composition
select-pattern
generate-render-tree
validate-render-tree
review-quality
revise-render-tree-if-invalid
validate-render-tree-after-revision
write-artifacts
```

### 3.1 Stage별 책임

| Stage                                 | 실행 소유                                            | 주요 입력                                                                                       | 주요 출력                                | Open Design 적용 지점                                                 |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `read-source`                         | `@cx/pipeline`                                       | source path                                                                                     | markdown source artifact                 | 직접 적용 없음                                                        |
| `parse-source`                        | `@cx/pipeline` -> `@cx/parser`                       | markdown source                                                                                 | `SourceSpec`                             | source fidelity gate의 기준점                                         |
| `derive-screen-intent`                | `@cx/pipeline` -> `@cx/orchestration` -> `@cx/agent` | `SourceSpec`                                                                                    | `screen-intent` agent result             | discovery form 개념을 이 stage로 번역                                 |
| `plan-composition`                    | `@cx/pipeline` -> `@cx/orchestration` -> `@cx/agent` | `SourceSpec`, `screenIntent`, `layerCandidates`                                                 | `composition-plan` agent result          | 화면 유형/section role/context bundle 결정 근거                       |
| `select-pattern`                      | `@cx/pipeline` -> `@cx/orchestration` -> `@cx/agent` | `layerCandidates`, `screenIntent`, `compositionPlan`                                            | `pattern-selection` agent result         | visual direction library 개념을 pattern candidate library로 번역      |
| `generate-render-tree`                | `@cx/pipeline` -> `@cx/orchestration` -> `@cx/agent` | `SourceSpec`, `screenIntent`, `compositionPlan`, `patternSelection`, `componentContractCatalog` | `tableGenerationResult`, `renderTree`    | checklist/context bundle을 실제 생성 prompt에 주입                    |
| `validate-render-tree`                | `@cx/pipeline` -> `@cx/validation`                   | agent payload                                                                                   | `ValidationReport`                       | hard contract 검증, warning 후보                                      |
| `review-quality`                      | `@cx/pipeline` -> `@cx/orchestration` -> `@cx/agent` | candidate, validation report, upstream artifacts                                                | `qualityInspection` agent result         | state coverage, anti-slop, source fidelity review                     |
| `revise-render-tree-if-invalid`       | `@cx/pipeline` -> `@cx/orchestration` -> `@cx/agent` | invalid candidate, validation report                                                            | revised candidate                        | 현재는 validation error만 revision trigger                            |
| `validate-render-tree-after-revision` | `@cx/pipeline` -> `@cx/validation`                   | revised payload                                                                                 | final validation report                  | revision 결과 검증                                                    |
| `write-artifacts`                     | `@cx/pipeline`                                       | 모든 중간 입력/결과                                                                             | versioned artifacts, `final-result.json` | bundle id, checklist version, review result를 감사 가능하게 남길 위치 |

### 3.2 현재 Pipeline Output

`write-artifacts`는 `tmp/generation-runs/<runId>/` 아래에 다음 성격의 파일을 남긴다.

- parse/source artifacts: `01-parse-result.json`, `02-source-spec.json`
- design intent artifacts: `03-...`부터 `12-...`까지 screen intent, composition plan, pattern selection 입력/요청/결과
- context artifacts: `13-design-context-bundle-selection.json`
- generation artifacts: generation skill catalog, screen-generation agent input/request/result
- validation/review artifacts: initial validation report, quality review input/request/result
- revision artifacts: revision decision, revision input/request/result
- final handoff: `final-result.json`
- final validation: `27-validation-report.json`
- pipeline side effect result: `28-pipeline-result.json`

이 구조 때문에 Open Design에서 가져올 gate는 “최종 결과만 평가”하는 방식보다 각 stage artifact에 붙는 것이 좋다. 예를 들어 state coverage는 `review-quality`에서 먼저 finding으로 남기고, 나중에 필요할 때 `@cx/validation` warning으로 승격한다.

### 3.3 현재 한계

- `review-quality` 결과는 artifact로 남지만, 현재 `revise-render-tree-if-invalid`의 trigger는 `validationReport.ok`뿐이다.
- quality finding만으로 revision을 요청하는 deterministic next-action helper는 아직 없다.
- context bundle id/version은 현재 agent input에 없다.
- screen intent의 missing decision이나 clarification-needed action은 아직 pipeline decision으로 연결되지 않는다.
- RenderTree skeleton first 개념은 prompt 규칙에는 일부 존재하지만, 별도 skeleton artifact로 분리되어 있지는 않다.

## 4. 현재 Orchestration 사용 인터페이스

`@cx/orchestration`은 실행 가능한 workflow가 아니라 pipeline stage가 사용할 입력을 만드는 순수 helper 패키지다. 파일을 읽지 않고, Claude를 실행하지 않고, validation rule을 판정하지 않는다.

현재 public export 기준 주요 helper:

| Helper                                                                                            | 입력                                                          | 반환                          | 현재 사용 stage                      |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------- | ------------------------------------ |
| `buildScreenIntentAgentInput(sourceSpec)`                                                         | `SourceSpec`                                                  | `ScreenIntentAgentInput`      | `derive-screen-intent`               |
| `buildCompositionPlanAgentInput({ sourceSpec, screenIntent, layerCandidates })`                   | source + upstream intent + candidates                         | `CompositionPlanAgentInput`   | `plan-composition`                   |
| `buildPatternLayerCandidates({ sourceSpec, resolver })`                                           | source + layout resolver adapter                              | `PatternLayerCandidate[]`     | `plan-composition`, `select-pattern` |
| `buildPatternSelectionAgentInput({ sourceSpec, layerCandidates, screenIntent, compositionPlan })` | source + upstream design artifacts                            | `PatternSelectionAgentInput`  | `select-pattern`                     |
| `buildScreenGenerationAgentInput(sourceSpec, options)`                                            | source + intent/plan/selection/candidates/component contracts | `ScreenGenerationAgentInput`  | `generate-render-tree`               |
| `buildQualityReviewAgentInput(input)`                                                             | candidate + source + upstream artifacts + validation report   | `QualityReviewAgentInput`     | `review-quality`                     |
| `buildScreenRevisionAgentInput(input)`                                                            | previous candidate + validation report + upstream context     | `ScreenRevisionAgentInput`    | `revise-render-tree-if-invalid`      |
| `buildSourceReferenceCatalog(sourceSpec)`                                                         | `SourceSpec`                                                  | allowed source refs + entries | 여러 agent input context 내부        |

### 4.1 Agent Input Shape

모든 orchestration agent input은 다음 기본 shape를 따른다.

```ts
type OrchestrationAgentTaskInput = {
  query: string;
  context?: unknown;
  previousResult?: unknown;
};
```

stage별 context는 더 구체적이다.

- `ScreenIntentAgentContext`: `sourceSpec`, `sourceReferenceCatalog`, `sourceSummary`, `targetArtifact`
- `CompositionPlanAgentContext`: 위 context + `screenIntent`, `layerCandidates`
- `PatternSelectionAgentContext`: `sourceSpec`, `sourceReferenceCatalog`, `sourceSummary`, `screenIntent`, `compositionPlan`, `layerCandidates`
- `ScreenGenerationAgentContext`: pattern selection context + `componentContractCatalog`, `intermediateArtifact`, `targetArtifact`
- `QualityReviewAgentContext`: screen generation context + `candidate`, `validationReport`
- `ScreenRevisionAgentContext`: screen generation context + `previousCandidate`, `validationReport`, `previousResult`

Open Design 적용 항목은 이 context에 직접 prose를 늘리는 방식보다, 가능한 한 다음처럼 참조형 데이터로 들어가야 한다.

```ts
type DesignContextBundleRef = {
  id:
    | "layout-composition"
    | "interaction-state"
    | "visual-foundation"
    | "quality-review";
  version: string;
  reason: string;
  sourceDocs: string[];
};
```

이 타입은 아직 구현된 계약이 아니다. 도입한다면 `@cx/schema` 계약과 `@cx/orchestration` helper가 먼저 정해야 한다.

### 4.2 적용 시 인터페이스 변경 방향

Open Design 적용을 위해 추가할 수 있는 orchestration interface 후보:

```ts
type BuildDesignContextBundleRefsInput = {
  compositionPlan?: unknown;
  layerCandidates?: PatternLayerCandidate[];
  screenIntent?: unknown;
  sourceSpec: SourceSpec;
  validationReport?: unknown;
};

type DesignContextBundleSelection = {
  bundleRefs: DesignContextBundleRef[];
  rationale: string;
};
```

예상 helper:

```ts
buildDesignContextBundleRefs(input): DesignContextBundleSelection
```

소유 경계:

- helper는 bundle id와 선택 이유만 반환한다.
- helper는 `packages/agent/docs/` 파일을 읽지 않는다.
- bundle 본문 로딩은 `@cx/pipeline` artifact composition 또는 `@cx/agent` prompt asset loading 경계에서 처리한다.
- 선택 결과는 `write-artifacts`에서 별도 artifact로 남긴다.

### 4.3 Next Action Interface 보강 방향

현재 `@cx/orchestration` type에는 `OrchestrationDecision`이 있지만, screen-generation pipeline의 revision decision은 아직 validation ok 여부에 직접 묶여 있다.

Open Design의 checklist/self-critique 개념을 적용하려면 다음 helper가 필요하다.

```ts
type BuildGenerationNextActionInput = {
  initialValidationReport?: unknown;
  qualityInspection?: unknown;
  retryCount: number;
  validationReport?: unknown;
};

type GenerationNextAction =
  | { action: "write-artifacts"; reason: string }
  | {
      action: "request-revision";
      reason: string;
      target: "contract" | "quality";
    }
  | { action: "request-human-review"; reason: string }
  | { action: "stop"; reason: string };
```

예상 helper:

```ts
buildGenerationNextAction(input): GenerationNextAction
```

성공 기준:

- schema/semantic error는 contract revision으로 간다.
- quality review P0 finding은 quality revision으로 갈 수 있다.
- warning만 있거나 retry 한도를 넘으면 human review로 넘긴다.
- `@cx/validation`은 여전히 next action을 결정하지 않는다.

## 5. 바로 가져올 수 있는 것

### 5.1 State Coverage Gate

출처 성격:

- Open Design `craft/state-coverage.md`
- loading, empty, error, populated, edge 상태를 surface별 필수 상태로 다루는 craft gate

적용 위치:

- `packages/agent/docs/quality-review/checklist.md`
- 필요 시 `packages/agent/docs/screen-generation/checklist.md`
- 장기적으로 `@cx/validation`의 warning rule 후보

구체 계획:

1. `quality-review` checklist에 상태 커버리지 축을 추가한다.
2. review finding의 category 후보에 `state-coverage`를 추가한다.
3. screen-generation checklist에는 “source가 form/list/search/detail/async surface를 암시하면 상태 노드를 누락하지 않는다”를 P1로 둔다.
4. `@cx/validation`은 즉시 hard error를 내지 않는다. 먼저 `ValidationReport` warning 또는 quality finding으로 관찰한다.

성공 기준:

- quality review 결과가 populated-only 화면을 문제로 지적한다.
- form/list/search/detail 화면에서 empty/error/loading 중 필요한 상태가 누락되면 revision 후보가 생긴다.
- 상태 규칙이 `@cx/renderer`나 `@cx/table-materializer` 책임으로 들어가지 않는다.

예상 리스크:

- 모든 화면에 다섯 상태를 강제하면 단순 정적 화면이 과설계될 수 있다.
- 현재 RenderTree 계약에 상태 variant 표현이 충분하지 않으면 finding은 생기지만 자동 수정이 어려울 수 있다.
- 상태 노드가 늘어나 화면 초안의 밀도가 과해질 수 있다.

예상 화면 품질 개선:

- 빈 데이터, 에러, 로딩이 누락된 “데모 전용 화면”이 줄어든다.
- 운영성 있는 화면처럼 보이고, QA가 볼 수 있는 검수 축이 늘어난다.
- 모바일 리스트/폼 화면의 실패 상태가 더 일찍 드러난다.

### 5.2 Anti-AI-Slop Gate

출처 성격:

- Open Design `craft/anti-ai-slop.md`
- placeholder copy, source 없는 metric, generic gradient, emoji icon, default visual tell 같은 AI 생성 흔적을 막는 gate

적용 위치:

- `packages/agent/docs/screen-generation/checklist.md`
- `packages/agent/docs/quality-review/checklist.md`
- 필요 시 `docs/design/VISUAL_FOUNDATION_OBSERVATIONS.md`에 SKT SDUI 기준으로만 반영

구체 계획:

1. HTML/CSS 전용 규칙은 제외한다.
2. RenderTree에 맞는 규칙으로 번역한다.
   - source 없는 숫자 metric 금지
   - filler label, placeholder label 금지
   - source intent와 무관한 decorative component 금지
   - component catalog에 없는 icon/visual 역할 임의 발명 금지
3. quality review가 schema error와 visual/copy quality issue를 분리해 보고하게 한다.
4. 추후 `@cx/validation`에는 contract로 검출 가능한 것만 warning rule로 승격한다.

성공 기준:

- 생성 결과에 `Feature 1`, `Sample content`, 임의 성과 수치가 남지 않는다.
- quality review가 “디자인 취향”이 아니라 source fidelity와 component contract 관점으로 지적한다.
- 금지 규칙이 `@cx/tokens`나 `@cx/components`의 소유 값을 우회하지 않는다.

예상 리스크:

- source가 빈약한 경우 agent가 안전하게 쓸 copy가 부족해 화면이 건조해질 수 있다.
- 금지어 기반으로만 운영하면 false positive가 생긴다.
- SKT SDUI에서 허용되는 강조 표현까지 과도하게 막을 수 있다.

예상 화면 품질 개선:

- AI 템플릿 느낌이 줄고, source 기반의 구체적인 화면이 늘어난다.
- 검수자가 “어디가 가짜처럼 보이는지”를 구조화해 판단할 수 있다.
- 컴포넌트 catalog와 source fidelity가 더 강하게 연결된다.

### 5.3 Skill Checklist Pattern

출처 성격:

- Open Design `skills/*/references/checklist.md`
- artifact 유형별 P0/P1 acceptance gate

적용 위치:

- `packages/agent/docs/screen-generation/checklist.md`
- `packages/agent/docs/quality-review/checklist.md`
- `docs/design/SECTION_PATTERNS.md`
- `docs/design/INTERACTION_PATTERNS.md`

구체 계획:

1. Open Design의 skill 자체를 가져오지 않는다.
2. `docs/design/`의 섹션 유형을 기준으로 agent-facing checklist 묶음을 만든다.
   - form screen
   - list screen
   - detail screen
   - complete/result screen
   - bottom sheet / popup
3. checklist 상세는 `docs/design/` 정본 문서를 참조하고, `packages/agent/docs/`에는 생성/검수용 압축 규칙만 둔다.
4. `@cx/orchestration`이 SourceSpec/ScreenIntent/CompositionPlan에서 화면 유형을 보고 필요한 checklist bundle id를 agent input에 포함한다.

성공 기준:

- form 화면은 label, validation, primary CTA, error placement를 검수한다.
- list 화면은 empty/no-result/long item/secondary action 누락을 검수한다.
- detail 화면은 핵심 정보 우선순위와 bottom action 위치를 검수한다.
- checklist가 패키지 코드 안에 하드코딩되지 않고 agent 문서 자산으로 관리된다.

예상 리스크:

- checklist가 너무 많아지면 agent prompt가 길어지고 생성 일관성이 떨어질 수 있다.
- 같은 규칙이 `docs/design/`과 `packages/agent/docs/`에 중복될 수 있다.
- 화면 유형 판정이 틀리면 부적절한 gate가 적용될 수 있다.

예상 화면 품질 개선:

- 화면 유형별 기본기가 안정된다.
- 검수 결과가 “예쁘다/별로다”가 아니라 화면 역할별 결함으로 나온다.
- revision stage가 더 작고 구체적인 수정 목표를 받을 수 있다.

### 5.4 Agent Prompt Guide Section

출처 성격:

- Open Design `design-systems/*/DESIGN.md`의 `Agent Prompt Guide`
- agent가 디자인 문서를 어떻게 사용해야 하는지 한 섹션으로 정리하는 방식

적용 위치:

- `packages/agent/docs/design-context/` 후보
- 또는 기존 `packages/agent/docs/screen-generation/prompt-contract.md`의 context 요구사항

구체 계획:

1. `docs/design/` 원문은 이동하지 않는다.
2. agent가 바로 읽을 압축본만 `packages/agent/docs/design-context/`에 둔다.
3. 압축본은 원문 링크와 책임 범위를 명시한다.
4. `screen-generation` prompt contract에는 “design-context bundle이 있으면 우선 참조하되 source와 schema를 우회하지 않는다”를 추가한다.

성공 기준:

- agent prompt에 긴 디자인 원문 전체를 매번 넣지 않아도 된다.
- 압축본이 `docs/design/`의 중복 정본이 되지 않는다.
- 디자인 규칙이 schema/catalog 계약보다 우선하지 않는다.

예상 리스크:

- 압축본이 오래되면 `docs/design/`과 drift가 생긴다.
- 압축 과정에서 중요한 SKT SDUI 수치나 예외가 사라질 수 있다.

예상 화면 품질 개선:

- agent가 SKT SDUI 패턴을 더 일관되게 참고한다.
- prompt noise가 줄어 화면 구조 결정이 안정된다.
- 생성 결과의 spacing, section role, interaction rule 위반이 줄어든다.

## 6. 개념을 가져올 수 있는 것

### 6.1 Skill + Design System + Craft를 Context Bundle로 번역

Open Design 개념:

```text
Skill
-> active DESIGN.md
-> craft references
-> checklist
-> artifact generation
```

우리 적용 개념:

```text
SourceSpec
-> ScreenIntent
-> CompositionPlan
-> pattern candidates
-> design-context bundle
-> screen-generation agent input
-> RenderTree
```

구체 계획:

1. `@cx/schema`에 필요한 경우 `contextBundleRefs` 같은 참조형 필드를 추가한다.
2. `@cx/orchestration`이 SourceSpec과 ScreenIntent를 보고 필요한 bundle id를 선택한다.
3. `@cx/agent`는 선택된 bundle 문서를 읽거나 prompt artifact에 포함하는 adapter 역할만 한다.
4. `@cx/pipeline`은 사용된 bundle id와 version을 artifact로 남긴다.

성공 기준:

- 같은 SourceSpec이면 같은 후보 bundle이 선택된다.
- bundle 선택 근거가 run log나 intermediate artifact로 추적된다.
- agent가 자유롭게 design rule을 발명하는 비율이 줄어든다.

예상 리스크:

- context bundle이 늘어나면 관리해야 할 version이 많아진다.
- bundle 선택이 `@cx/orchestration` 안에서 복잡한 rule engine으로 커질 수 있다.
- bundle이 너무 강하면 특수 화면의 유연성이 줄어든다.

예상 화면 품질 개선:

- source intent, section pattern, component contract가 함께 들어가 화면의 구조적 일관성이 높아진다.
- 화면마다 다른 기준으로 생성되는 흔들림이 줄어든다.
- quality review와 generation이 같은 기준을 공유한다.

### 6.2 Discovery Form을 Screen Intent Stage로 번역

Open Design 개념:

- 첫 턴에서 사용자에게 목적, 대상, 규모, 플랫폼, 브랜드 맥락을 묻는다.

우리 적용 개념:

- 사용자 UI 질문폼보다 `derive-screen-intent` stage를 강화한다.
- SourceSpec만으로 부족한 정보는 `intentGap`으로 남긴다.

구체 계획:

1. `screen-intent` artifact에 `audience`, `primaryTask`, `successMoment`, `contentPriority`, `missingDecisions`를 명확히 둔다.
2. SourceSpec이 충분하면 질문 없이 다음 stage로 간다.
3. SourceSpec이 부족하면 pipeline result에 human review 또는 clarification-needed action을 남긴다.
4. 기본 smoke에서는 fake answer를 만들지 않고 missing decision을 artifact로 남긴다.

성공 기준:

- 화면 생성 전에 “이 화면이 왜 존재하는지”가 artifact로 남는다.
- CompositionPlan이 SourceSpec만이 아니라 ScreenIntent를 참조한다.
- 애매한 입력에서 agent가 임의 화면을 완성하지 않고 gap을 보고한다.

예상 리스크:

- clarification-needed가 잦으면 생성 속도가 느려질 수 있다.
- 제품 초기 단계에서는 모든 missing decision을 사람이 답하기 부담스러울 수 있다.

예상 화면 품질 개선:

- CTA, 정보 우선순위, region 배치가 화면 목적과 더 잘 맞는다.
- 상세/목록/폼/완료 화면의 역할 혼동이 줄어든다.
- 검수자가 화면 목적 대비 품질을 평가할 수 있다.

### 6.3 Visual Direction Library를 Pattern Candidate Library로 번역

Open Design 개념:

- 5개 visual direction이 palette, font, mood, layout posture를 deterministic하게 제공한다.

우리 적용 개념:

- 새 visual direction을 만들지 않는다.
- SKT SDUI 기준에서는 화면/섹션/pattern candidate를 deterministic하게 제공한다.

구체 계획:

1. `docs/design/SCREEN_PATTERN_SUMMARY.md`와 `SECTION_PATTERNS.md`를 기반으로 candidate group을 정의한다.
2. `@cx/layout-pattern-store`의 pattern id와 연결한다.
3. `@cx/orchestration`이 SourceSpec role과 ScreenIntent를 보고 candidate group을 좁힌다.
4. agent는 candidate 밖 pattern id를 발명하지 않는다.

성공 기준:

- screen-generation input에 후보 pattern provenance가 들어간다.
- RenderTree layout id가 candidate set 밖으로 나가면 validation이 잡는다.
- 패턴 선택 이유가 CompositionPlan에 남는다.

예상 리스크:

- candidate narrowing이 너무 강하면 더 나은 조합을 막을 수 있다.
- SourceSpec role이 부족하면 잘못된 candidate group이 선택될 수 있다.
- pattern catalog가 바뀌면 bundle과 validation을 함께 갱신해야 한다.

예상 화면 품질 개선:

- 레이아웃이 즉흥적으로 흔들리지 않는다.
- SKT SDUI에서 관찰된 화면 유형과 더 가까운 결과가 나온다.
- validation/revision이 layout id 단위로 명확해진다.

### 6.4 Template First를 RenderTree Skeleton First로 번역

Open Design 개념:

- seed template을 먼저 복사하고, 그 안에 내용을 채운다.

우리 적용 개념:

- HTML template 대신 `RenderTree` skeleton 또는 CompositionPlan section skeleton을 먼저 만든다.

구체 계획:

1. CompositionPlan에서 Screen, Region, Area skeleton을 확정한다.
2. pattern selection 후 skeleton을 agent input에 넣는다.
3. screen-generation은 skeleton의 region/area grouping을 유지하고 component props를 채운다.
4. revision은 전체 재작성보다 skeleton 안의 bounded edit를 우선한다.

성공 기준:

- Header, Contents, Bottom mapping이 generation 전후에 유지된다.
- area grouping이 source ref와 함께 추적된다.
- revision stage가 특정 node/area에 대한 수정 제안을 받을 수 있다.

예상 리스크:

- skeleton 품질이 낮으면 생성 결과 전체가 함께 낮아진다.
- skeleton을 너무 빨리 고정하면 더 적합한 구조로 바꾸기 어렵다.

예상 화면 품질 개선:

- bottom CTA가 scroll content에 섞이는 문제가 줄어든다.
- source area가 사라지거나 병합되는 문제가 줄어든다.
- 생성 결과가 renderer와 validation이 기대하는 구조에 더 잘 맞는다.

## 7. 실행 로드맵

### Phase 1 - 문서 gate 흡수

Status: done on 2026-05-29.

작업:

- `packages/agent/docs/quality-review/checklist.md`에 state coverage, anti-slop, source-fidelity gate를 추가한다.
- `packages/agent/docs/screen-generation/checklist.md`에 화면 유형별 P0/P1 gate를 추가한다.
- `packages/agent/docs/screen-generation/prompt-contract.md`에 design-context bundle 입력 규칙을 추가한다.

성공 기준:

- 문서만 봐도 generation과 review가 같은 gate를 공유한다.
- package boundary 문서와 충돌하지 않는다.

리스크:

- 문서 gate가 길어져 prompt artifact가 무거워질 수 있다.

예상 화면 품질:

- 단기적으로 placeholder, 임의 metric, 상태 누락 지적이 늘어난다.

### Phase 2 - Context Bundle 설계

Status: done on 2026-05-29.

작업:

- `packages/agent/docs/design-context/` 후보 구조를 만든다.
- bundle id를 `layout-composition`, `interaction-state`, `visual-foundation`, `quality-review`처럼 stage 이름과 분리한다.
- 각 bundle은 `docs/design/` 원문 링크와 agent-facing 요약만 포함한다.

성공 기준:

- agent-facing 자산이 `packages/agent/docs/`에 있고, 디자인 정본은 `docs/design/`에 남는다.
- bundle id가 stage 변경에 흔들리지 않는다.

리스크:

- 요약본과 원문 사이의 drift가 생길 수 있다.

예상 화면 품질:

- agent가 긴 디자인 문서보다 더 안정적인 핵심 규칙을 본다.

### Phase 3 - Orchestration Bundle Selection

Status: done on 2026-05-29.

작업:

- `@cx/orchestration`에 SourceSpec/ScreenIntent 기반 bundle selection helper를 추가한다.
- helper는 순수 함수로 bundle id와 선택 근거만 반환한다.
- `@cx/pipeline`은 선택 결과를 intermediate artifact로 남긴다.

성공 기준:

- `@cx/orchestration`은 파일을 읽지 않는다.
- `@cx/pipeline`은 artifact만 기록한다.
- `@cx/agent`는 실행 adapter 경계를 유지한다.

리스크:

- selection rule이 문자열 if-chain으로 커질 수 있다. 반복 key domain이 생기면 contract table 위치를 먼저 결정해야 한다.

예상 화면 품질:

- 같은 유형의 화면이 같은 기준으로 생성된다.

### Phase 4 - Schema And Validation Expansion

Status: done on 2026-05-29.

작업:

- 필요한 경우 `@cx/schema`에 context bundle ref, intent gap, state coverage hint를 추가한다.
- `@cx/validation`은 hard error보다 warning부터 시작한다.
- source ref 누락, pattern candidate 밖 layout id, 상태 coverage 누락을 구분한다.

성공 기준:

- schema는 계약만 소유하고 quality 판단을 직접 하지 않는다.
- validation은 report만 반환한다.

리스크:

- warning이 많아져 pipeline decision이 복잡해질 수 있다.

예상 화면 품질:

- 사람이 볼 수 있는 품질 debt가 artifact에 남는다.

### Phase 5 - Quality Review And Revision 연결

Status: done on 2026-05-29.

작업:

- `review-quality` 결과를 next-action helper 입력으로 넣는다.
- revision은 bounded change를 우선한다.
- repeated failure는 human review로 넘긴다.

성공 기준:

- schema validation 실패와 quality finding이 분리된다.
- revision stage가 전체 재생성보다 작은 수정 목표를 받는다.

리스크:

- quality review가 과도하게 보수적이면 revision loop가 늘어날 수 있다.

예상 화면 품질:

- 첫 결과의 시각적 완성도보다 “수정 가능한 구조적 품질”이 개선된다.

## 8. 최종 성공 기준

- 생성 전에는 ScreenIntent와 CompositionPlan이 화면 목적과 구조를 설명한다.
- 생성 중에는 agent가 지정된 pattern candidate와 design-context bundle을 벗어나지 않는다.
- 생성 후에는 validation과 quality review가 schema 문제, contract 문제, 품질 문제를 분리한다.
- 최종 `final-result.json`은 `@cx/renderer`가 바로 소비할 수 있다.
- table apply는 최종 RenderTree를 분해하는 후속 단계로만 남는다.
- 문서 정본은 중복되지 않는다.
  - `docs/design/`: SKT SDUI 디자인 패턴 정본
  - `packages/agent/docs/`: agent-facing prompt/checklist/output/context 자산
  - `@cx/schema`: DTO/schema 계약
  - `@cx/orchestration`: 순수 입력 조립
  - `@cx/pipeline`: 실행과 side effect

## 9. 적용하지 않을 것

- Open Design의 HTML artifact runtime
- iframe preview 중심의 artifact contract
- generic visual direction palette를 SKT SDUI 위에 덮는 방식
- skill registry/runtime을 별도 패키지로 도입하는 방식
- agent가 파일을 직접 읽고 쓰며 화면 구조를 확정하는 방식
- `@cx/renderer`나 `@cx/table-materializer`가 infer, validation, pattern selection을 수행하는 방식

## 10. 품질 변화 예상

적용 전:

- SourceSpec에서 바로 RenderTree로 넘어가면 화면 목적, 정보 우선순위, 상태 coverage가 암묵적이다.
- 검수 기준이 schema/contract 중심이면 “동작은 가능하지만 제품 화면답지 않은 결과”가 남을 수 있다.
- 화면 유형별 P0가 약하면 form/list/detail/bottom action의 기본기가 흔들린다.

적용 후:

- 화면 목적과 구성 이유가 intermediate artifact로 남는다.
- agent는 pattern 후보와 checklist 안에서 생성한다.
- 상태 누락, filler copy, source 없는 수치, bottom CTA 위치 같은 반복 결함이 줄어든다.
- quality review가 revision stage에 바로 쓸 수 있는 bounded finding을 만든다.
- 최종 미리보기는 더 “실사용 전 단계의 화면 후보”에 가까워진다.

## 11. 권장 우선순위

1. `quality-review` checklist에 state coverage와 anti-slop gate 추가
2. `screen-generation` checklist에 화면 유형별 P0/P1 추가
3. `design-context` bundle 초안 작성
4. `@cx/orchestration` bundle selection helper 설계
5. schema/validation warning 확장
6. review-quality 결과를 next-action helper와 revision stage에 연결
