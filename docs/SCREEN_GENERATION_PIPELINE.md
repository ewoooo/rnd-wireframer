# 화면 추론 파이프라인 (screen-generation)

이 문서는 `screen-generation` 파이프라인의 13단계를 각 단계의 **입력 구성·프롬프트(query)·출력(schema)·참조 문서** 기준으로 설명한다. 정본 소스는 아래와 같다.

- 오케스트레이션: `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts`
- 입력/프롬프트 구성: `packages/orchestration/src/public/agent-inputs.ts`
- 번들 선택: `packages/orchestration/src/public/design-context.ts`
- agent task(시스템 프롬프트): `packages/agent/src/tasks/<task>/prompt.ts`
- agent runner: `packages/agent/src/claude/claude-agent-sdk-runner.ts`
- design-context 규칙 본문: `packages/agent/docs/design-context/*.md`
- 디자인 정본: `docs/design/*.md`
- 출력 스키마: `@cx/schema` (`SCHEMA_VERSION`)
- 아티팩트 기록: `packages/pipeline/src/pipelines/screen-generation/artifact-commands.ts`

---

## 1. 오케스트레이션 모델

`runScreenGenerationPipeline`은 단일 `state` 객체에 단계별 산출물을 누적하며 **순차 실행**한다.

- **parse 실패 단락**: `parse-source` 결과가 `ok=false`면 `write-artifacts`를 제외한 모든 단계를 건너뛴다. 잘못된 입력으로 AI를 호출하지 않는다.
- **agentMode 분기**: 각 AI 단계는 `claude-local-first`(실제 `createClaudeRunner`) 또는 `fake`(결정적 스텁, `createFake*`)로 실행된다. smoke의 `--use-ai` 여부가 이를 결정한다.
- 단계 구성: **IO/순수 6개 + AI 호출 6개 + 조건부 revision 1개** = 화면당 최대 7회 AI 호출.

### 실행 단계 순서

```
read-source → parse-source → derive-screen-intent → plan-composition
→ derive-decoration-plan → select-pattern → generate-render-tree
→ validate-render-tree → propose-components → review-quality
→ revise-render-tree-if-invalid → validate-render-tree-after-revision
→ write-artifacts
```

### 추론 레이어

세부 stage는 유지하되, 사람이 읽는 추론 모델은 아래 3개 레이어로 접는다.

```text
Understand -> Compose -> Revise
```

| 레이어 | 포함 stage | 목적 | 주요 결과 |
|---|---|---|---|
| `Understand` | `read-source`, `parse-source`, `derive-screen-intent` | SourceSpec을 정규화하고 화면 목적·사용자 행동·정보 우선순위를 이해한다. | `source-spec.json`, `screen-intent.json` |
| `Compose` | `plan-composition`, `derive-decoration-plan`, `select-pattern`, `generate-render-tree`, `propose-components` | 이해한 의도를 화면 구조·섹션 리듬·패턴·RenderTree 후보로 설계한다. | `composition-plan.json`, `decoration-plan.json`, `pattern-selection.json`, `agent-result.json`, `component-proposal.json` |
| `Revise` | `validate-render-tree`, `review-quality`, `revise-render-tree-if-invalid`, `validate-render-tree-after-revision`, `write-artifacts` | schema/계약/품질을 검증하고 필요한 경우 최소 수정한 뒤 최종 산출물을 기록한다. | `validation-report.json`, `quality-review.json`, `final-result.json`, `pipeline-result.json` |

물리 파일은 `<runId>/artifacts/` 아래 flat하게 유지한다. 레이어는 폴더명이 아니라 `manifest.json`과 `trace.json`이 해석하는 **논리 그룹**이다. 따라서 파일명을 stage 순서 번호에 의존하지 않고, web/smoke는 manifest 포인터와 trace key로 탐색한다.

### 결정성 (runner 호출 형태)

실제 호출은 `claude-agent-sdk-runner.ts`에서 다음 플래그로 이뤄진다.

```
claude --print --output-format json --no-session-persistence \
       --tools "" --system-prompt <task system> --model <model> <user query>
```

`--tools ""`로 도구를 비활성화해 추론을 결정적으로 유지한다. agent task의 system 프롬프트는 짧고(예: `"You are the Claude generation agent for RND Screen Generator."`), 실제 지시·context는 전부 `agent-inputs.ts`가 만든 `query`/`context`에 담긴다.

---

## 2. 공통 입력 빌딩 블록

모든 AI 단계의 `context`는 아래 공통 요소를 공유한다(`buildScreenGenerationAgentInput`이 상위 입력의 베이스이며, revision/quality/proposal은 이를 확장한다).

| 블록 | 출처 | 역할 |
|---|---|---|
| `sourceSpec` | `parse-source` | 단일 진실원. 화면/region/area/component 구조 |
| `sourceReferenceCatalog` | `buildSourceReferenceCatalog(sourceSpec)` | 유효한 source ref vocabulary(`allowedRefs`, `entries[].props/description/notes`). 발명 방지 |
| `sourceSummary` | `createSourceSummary(sourceSpec)` | 화면 요약 |
| `componentContractCatalog` | `buildSourceComponentContractCatalog` | 사용 가능한 component type·props·composite layout 후보 |
| `layerCandidates` | `buildScreenGenerationPatternLayerCandidates` | 탐색된 screen/region/area/component **layout id 후보**. 발명 금지 vocabulary |
| `decorationPlan` | `buildDecorationPlan` (순수) | 디바이더·area 분할·displayTitle·repeatedItems 등 결정적 표시 구조 |
| `designContextBundleRefs` | `buildDesignContextBundleRefs` | 적용할 design-context 번들 **선택 결과**(id+이유) |
| `designContextBundles[].body` | `loadBundleContentsForState` | 선택된 번들의 **실제 규칙 본문**(generate/proposal/review/revise 단계만 로드) |
| `targetArtifact.jsonSchema` | `getJsonSchema(kind)` | 출력 강제 스키마 |

---

## 3. design-context 번들 선택 규칙

`buildDesignContextBundleRefs` (`design-context.ts`)는 **결정적**으로 번들을 고른다.

| 번들 id | 파일 | 항상? | 추가 조건 |
|---|---|---|---|
| `layout-composition` | `layout-composition.md` | ✅ 항상 | — |
| `visual-foundation` | `visual-foundation.md` | ✅ 항상 | — |
| `interaction-state` | `interaction-state.md` | 조건부 | sourceSpec/intent/plan에 stateful 신호(`form`,`list`,`error`,`loading`,`empty`,`search`,`select`,`validation`,`async`,`input`) 존재 시 |
| `quality-review` | `quality-review.md` | 조건부 | validation report에 issue 존재 시 |

- 번들 **ref 선택**은 순수 로직(`plan-composition`, `validate-render-tree`에서 갱신).
- 번들 **본문 로드**는 IO(`loadBundleContentsForState` → `BUNDLE_FILE_BY_ID`로 `.md` 읽기, `disableDesignContext`면 생략).
- `--no-design-context` 플래그로 본문 주입을 꺼서 A/B 비교 가능.

번들 정본 책임: `docs/design/`(원문) → `packages/agent/docs/design-context/`(압축 규칙) → `@cx/schema`(ref DTO) → `@cx/orchestration`(선택) → `@cx/pipeline`(기록).

---

## 4. 단계별 상세

각 단계: **유형 / 입력 구성 / 프롬프트 핵심 / 출력 / 참조 문서**.

### 4.1 `read-source` — IO
- **입력**: `sourcePath`, `sourceKind`.
- **동작**: side-effect `source-artifact-read`로 md 파일 읽기.
- **출력**: `sourceFile`(raw markdown). 아티팩트 없음(다음 단계 입력).

### 4.2 `parse-source` — 순수
- **입력**: `sourceFile`.
- **동작**: `runParseMarkdownSourceCommand` — md를 `SourceSpec`으로 파싱.
- **출력**: `sourceSpec`, `parseCommandResult`. 아티팩트 `source-spec.json`(결과), `parseResult`→`trace.json`.
- **참조**: 파서 규칙(`@cx/parser`).

### 4.3 `derive-screen-intent` — AI
- **입력 구성**: `sourceSpec`, `sourceReferenceCatalog`, `sourceSummary`, `targetArtifact(screen-intent)`.
- **AI 추론**: "이 화면은 무엇을 위한 화면인가?"를 판단한다. 구조만 있는 SourceSpec을 읽고 → 화면의 목적(폼/리스트/상세/완료 등), 사용자가 해야 할 핵심 행동, 성공 순간, 대상 사용자를 **해석**한다. 어떤 ref를 사용자가 먼저 이해해야 하는지 **우선순위를 매기고**(`contentPriority`), 명세에 빠진 결정(`missingDecisions`)과 상태 필요 신호(`stateCoverageHints`)를 **추론**한다. 레이아웃은 아직 결정하지 않는다 — "의미"만 잡는다.
- **프롬프트 핵심**(`buildScreenIntentAgentInput`): "SourceSpec만을 진실원으로 화면 의도를 도출." `screenPurpose`, `primaryUserAction`, `contentPriority`(이해 순서대로 ref 나열), `sourceInterpretation`, `rationale` 캡처. 증거가 있으면 `audience`, `primaryTask`, `successMoment`, `missingDecisions`, `stateCoverageHints`도. `allowedRefs` 밖 alias 발명 금지.
- **출력**: `screen-intent.v0.1` JSON 1개. 아티팩트 `screen-intent.json`(결과), input/runner-request→`trace.json`.
- **참조**: 없음(순수 SourceSpec 해석).

### 4.4 `plan-composition` — AI
- **입력 구성**: `layerCandidates`, `screenIntent`, `sourceSpec`, `sourceReferenceCatalog`, `targetArtifact(composition-plan)`.
- **AI 추론**: "이 의도를 화면에 어떻게 나눠 담을 것인가?"를 결정한다. intent를 받아 콘텐츠를 **섹션으로 분해**하고, 각 섹션을 어느 region(Header/Contents/Bottom)에 둘지, 어떤 role·priority를 줄지, 어떤 sourceRef가 묶이는지를 **배치 판단**한다. 전체 화면의 레이아웃 전략(`layoutStrategy`)을 세우고, 화면 위계·주 행동·섹션 리듬·밀도·패턴 선택/배제 이유까지 디자인 판단으로 남긴다. 구체 layout id는 아직 고르지 않는다 — "무엇을 어디에, 어떤 비중과 리듬으로"까지.
- **프롬프트 핵심**(`buildCompositionPlanAgentInput`): "pattern 선택·RenderTree 생성 전에 composition plan 작성." `screenLayout`, `layoutStrategy`, `sections`, `rationale` 정의. 디자인 판단 필드로 `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, `rejectedPatterns`를 함께 작성한다. 각 section은 `targetRegion`, `role`, `priority`, `sourceRefs`, `strategy` 식별. `layerCandidates` 밖 layout id·`allowedRefs` 밖 ref 금지.
- **출력**: `composition-plan.v0.1`. 아티팩트 `composition-plan.json`(결과), input/runner-request→`trace.json`.
- **부수효과**: 직후 `buildDesignContextBundleRefs`로 번들 선택(`trace.json`의 `designContextBundleSelection`).
- **참조**: `packages/agent/docs/design-context/layout-composition.md`가 `COMPOSITION_LAYERS`, `SECTION_PATTERNS`, `SCREEN_PATTERN_SUMMARY`, `LAYOUT_SPACING_CONTRACT`, `INTERACTION_PATTERNS`를 디자인 판단 필드의 근거 문서로 연결한다. 선택된 번들 refs는 다음 단계부터 가이드로 전달된다.

### 4.5 `derive-decoration-plan` — 순수
- **입력**: `compositionPlan`, `sourceSpec`.
- **동작**: `buildDecorationPlan` — 디바이더/패턴/area 분할/displayTitle/repeatedItems 등 **결정적 장식 배치**. 그 결과로 `layerCandidates` 재생성.
- **출력**: `decorationPlan`. 아티팩트 `decoration-plan.json`(결과), `patternLayerCandidates`→`trace.json`.
- **참조**: pattern-store(`@cx/layout-pattern-store` catalog).

### 4.6 `select-pattern` — AI
- **입력 구성**: `compositionPlan`, `decorationPlan`, `designContextBundleRefs`, `layerCandidates`, `screenIntent`, `sourceSpec`, `sourceReferenceCatalog`.
- **AI 추론**: "각 슬롯에 어떤 구체 레이아웃 패턴을 쓸 것인가?"를 고른다. plan의 섹션·decoration의 role/layoutIntent를 보고 → `layerCandidates`(허용된 layout id 집합) 안에서 screen/region/area/component 레벨별로 가장 맞는 패턴을 **선택**하고 확신도(`confidence`)와 이유를 단다. 후보 밖 id는 만들 수 없다 — "주어진 메뉴에서 고르는" 판단.
- **프롬프트 핵심**(`buildPatternSelectionAgentInput`): "후보 중 pattern layer 전략 선택." `selectedCandidates`, `confidence`, `reason`. 각 후보는 `id/level/targetRef/layout` 보존. `layerCandidates` 밖 layout id 금지. `decorationPlan`의 role·layoutIntent를 결정적 가이드로, `designContextBundleRefs`를 bounded 가이드로 사용(SourceSpec·후보 id 우선).
- **출력**: `pattern-selection.v0.1`. 아티팩트 `pattern-selection.json`(결과), input/runner-request→`trace.json`.
- **참조**: `designContextBundleRefs`(ref만, 본문 미주입).

### 4.7 `generate-render-tree` — AI · 핵심
- **입력 구성**: 공통 블록 전부 + `componentContractCatalog`, `compositionPlan`, `decorationPlan`, `patternSelection`, `screenIntent`, `designContextBundleRefs`, **`designContextBundles[].body`(규칙 본문 주입)**, `intermediateArtifact(table-generation-result)`, `targetArtifact(render-tree)`.
- **AI 추론**: 위 모든 판단(intent·composition·decoration·pattern)과 design-context 규칙 본문을 **종합해 실제 RenderTree를 합성**한다. catalog/allowedRefs/candidates 제약 안에서 — 어떤 component를 어떤 props로 놓을지, source 텍스트를 어떤 가시 label로 옮길지, 행 사이 `props.divider`/섹션 사이 `props.sectionDivider`를 켤지 말지를 **화면 맥락으로 자율 결정**하고, 상태 증거가 있으면 `display.stateRole`/`display.when` 게이팅으로 상태 coverage를 짠다. 시각 위계는 색·아이콘 발명 없이 component 선택·props로만 표현. 동시에 table-shaped 결과(`tableGenerationResult`)도 만든다. 이 단계가 "판단을 실제 화면으로 굳히는" 핵심 추론이다.
- **프롬프트 핵심**(`buildScreenGenerationAgentInput`, 가장 김): SourceSpec 진실원 + upstream(intent/composition/decoration/pattern) 가이드로 **RenderTree 생성**. 주요 규칙:
  - 스켈레톤 보존: `Screen > Screen.Header/Contents/Bottom > area.static/area.dynamic > (PageStack/layout wrapper) > components`. `type:"Area"` 노드 금지.
  - 가시 area 제목은 `decorationPlan.areas[].displayTitle` 우선. area 분할 시 분할 area를 RenderTree·table에 반영.
  - **디바이더는 area stack prop**: stack 행 구분은 `props.divider`(true=1px, `"section"`=4px), 섹션 간 구분은 leading area의 `props.sectionDivider:true`. Divider leaf 노드/raw border 금지. `designContextBundles` 규칙과 화면 맥락으로 결정.
  - **state coverage**: errorPolicy/필수 동의/disabled/loading/validation 증거가 있으면 bounded `display.stateRole`. 한 슬롯 상태 변형(특히 Bottom CTA)은 `display.when`으로 상호배타 게이팅 또는 단일 노드. 게이팅 없는 primary CTA 2개 금지.
  - **시각 위계**: catalog 안 component 선택·props로만. 색/그라데이션/아이콘 발명 금지.
  - `allowedRefs`/`componentContractCatalog`/`layerCandidates` 밖 vocabulary 금지.
  - `designContextBundles[].body`를 실제 적용 규칙으로 사용하되 **우선순위: source evidence·schema/catalog > 번들 규칙**.
  - 동시에 `tableGenerationResult`(table-generation-result.v0.1)도 생성.
- **출력**: `renderTree`(render-tree.v0.1) + `tableGenerationResult`. 아티팩트 `agent-result.json`(전체 payload), `final-result.json`(렌더 대상). input/runner-request·skill·candidates→`trace.json`.
- **참조**: 선택된 모든 번들 본문(layout-composition, visual-foundation, +조건부 interaction-state/quality-review).

### 4.8 `validate-render-tree` — 순수
- **입력**: `agentResult.payload`, `layerCandidates`, `compositionPlan`, `decorationPlan`, `screenIntent`, `sourceSpec`.
- **동작**: `createRenderTreeValidationReport` — schema/catalog/contract 위반, state coverage, `bottom-cta-state-ungated` 등 검사. `initialValidationReport`로 보관, validation 피드백 반영해 번들 refs 재선택.
- **출력**: `validationReport`. 아티팩트 `validation-report.json`(최종 결과), `initialValidationReport`→`trace.json`.
- **참조**: validation 규칙(`@cx/validation`).

### 4.9 `propose-components` — AI · 비파괴
- **입력 구성**: generation 베이스 + `candidate`(생성 트리).
- **AI 추론**: "이 화면을 짓는 동안 catalog가 부족했던 지점은 어디인가?"를 **회고적으로 분석**한다. 생성된 트리를 증거로, catalog 컴포넌트로 근사할 수밖에 없었던 부분을 찾아 → 전용 컴포넌트/변형을 제안하고, 각 제안에 source 근거·가장 가까운 catalog 매치·근거를 단다. 이번 출력엔 반영되지 않는 **비파괴 gap 분석**(catalog 진화용 신호). 자세한 순서 근거는 같은 폴더 코드/대화 참조.
- **프롬프트 핵심**(`buildComponentProposalAgentInput`): "catalog에 없지만 화면을 개선할 component/변형 제안." 각 제안은 `id`, `proposedComponentType`, `sourceEvidence`(allowedRefs ref 배열), `nearestCatalogMatch`(catalog componentType 1개), `rationale`, 선택 `suggestedProps`. **최대 5개**, 확정/적용 안 함(비파괴).
- **출력**: `component-proposal.v0.1`. 아티팩트 `component-proposal.json`(결과), input/runner-request/validation→`trace.json`. 검증은 bounded 여부만 리포트하고 **파이프라인을 실패시키지 않음**.
- **참조**: `designContextBundles[].body`(개선 가이드).

### 4.10 `review-quality` — AI · 자기비평
- **입력 구성**: generation 베이스 + `candidate`, `validationReport`.
- **AI 추론**: "생성물이 디자인적으로 좋은가?"를 **스스로 채점**한다. schema/semantic 검증을 통과한 트리를 quality-review 게이트 기준으로 다시 읽어 → source fidelity·composition 정합·시각 위계·action 명료성·접근성 위험을 **판단**하고, `hierarchy/separation/fidelity` 3축을 0–5로 점수화한다. 위반마다 bounded finding(코드·심각도·메시지·위치·제안)을 남긴다. 파일을 고치지는 않는다 — **비평만** 하고 다음 게이팅이 교정 여부를 정한다.
- **프롬프트 핵심**(`buildQualityReviewAgentInput`): schema/semantic 검증 후 디자인 품질 리뷰. source fidelity·composition 정합·시각 위계·action 명료성·접근성 위험 점검. **3축 점수(`hierarchy`/`separation`/`fidelity`, 0–5)** + 위반마다 finding(`code/severity/message/optional path/suggestion`). bounded findings만, mutate·승인·필드 발명 금지.
- **출력**: `quality-inspection.v0.1`(scores + findings). 아티팩트 `quality-review.json`(결과), input/runner-request→`trace.json`.
- **참조**: `quality-review.md` 번들 본문(게이트 기준).

### 4.11 `revise-render-tree-if-invalid` — 순수 게이팅 + 조건부 AI
- **게이팅**(`buildGenerationNextAction`): `initialValidationReport` + `qualityInspection` + `retryCount`(최대 1) + `validationReport`로 다음 행동 결정. `request-revision`이 아니면 통과.
- **AI 교정 입력**: generation 베이스 + `previousCandidate`(이전 트리, `previousResult`로도 전달) + `qualityInspection` + `validationReport`.
- **AI 추론**(교정이 트리거된 경우): "무엇을 최소로 고쳐야 유효해지는가?"를 판단한다. validation 에러와 quality P0 finding을 받아 → 이전 트리를 **제자리에서 표적 수정**한다(스켈레톤·area wrapper·upstream 가이드·유효한 구조는 보존). `required-field-missing`·`invalid-render-node` 같은 치명 오류를 먼저, invented ref/props/layout id는 catalog/allowedRefs로 교정. 전면 재작성이 아니라 "결함만 덜어내는" 보수적 추론.
- **프롬프트 핵심**(`buildScreenRevisionAgentInput`): validation report를 만족하도록 이전 트리를 **제자리 교정**. 스켈레톤·area wrapper·pattern·upstream 가이드 보존. invalid Area 노드는 제거가 아니라 area.static/area.dynamic로 치환. invented ref/props/layout id는 catalog/allowedRefs로 교정. `required-field-missing`·`invalid-render-node` 먼저, 그다음 warning. quality P0 finding도 bounded 교정. `agentResult`를 교정본으로 교체.
- **출력**: 교정된 `renderTree`(`agent-result.json`·`final-result.json` 갱신). `revisionDecision`·revision input/runner-request→`trace.json`.
- **참조**: 선택된 모든 번들 본문 + quality findings.

### 4.12 `validate-render-tree-after-revision` — 순수
- 4.8과 동일 검증기로 교정본 **재검증**. 결과를 `validationReport`에 반영.

### 4.13 `write-artifacts` — IO
- **동작**: 모든 단계 산출물 + `manifest.json`을 run 폴더에 기록(`data/runs/screen-generation/<runId>/`). web explorer가 manifest를 읽어 표시.
- **출력 파일**: 아래 아티팩트 맵 참조.

---

## 5. 출력 아티팩트 맵

`<runId>/artifacts/` 아래 기록(`artifact-commands.ts`, `ARTIFACT_FILES`). **과정별 결과물은 개별 파일, 입력·runner-request·중간 스캐폴딩은 `trace.json` 하나로 묶는다.** 소비자는 파일명을 하드코딩하지 않고 `manifest.json` 포인터로 접근한다(run당 ~36개 → 12개).

파일명에는 stage 번호를 붙이지 않는다. 순서와 레이어 의미는 `manifest.stageOrder`와 `trace` key가 담당한다.

### 결과 파일 (개별, manifest 포인터로 노출)

| 파일 | manifest 포인터 | 내용 |
|---|---|---|
| `source-spec.json` | `sourceSpec` | 파싱된 SourceSpec |
| `screen-intent.json` | `screenIntent` | intent 결과 |
| `composition-plan.json` | `compositionPlan` | composition 결과 |
| `decoration-plan.json` | `decorationPlan` | 결정적 장식 plan |
| `pattern-selection.json` | `patternSelection` | pattern 선택 결과 |
| `agent-result.json` | `agentResult` | generation 전체 payload(renderTree+table) |
| `final-result.json` | `finalResult` | 최종 RenderTree(렌더 대상) |
| `validation-report.json` | `validationReport` | 최종 검증 |
| `quality-review.json` | `qualityReview` | 3축 점수 + findings |
| `component-proposal.json` | `componentProposal` | 비파괴 제안 |
| `pipeline-result.json` | `pipelineResult` | side-effect 실행 결과 |

### 디버그 번들

| 파일 | manifest 포인터 | 내용(stage 키) |
|---|---|---|
| `trace.json` | `trace` | `parseResult`, `screenIntent/composition/patternSelection/generation/qualityReview/revision/componentProposal`의 `{input, runnerRequest}`, `patternLayerCandidates`, `designContextBundleSelection`, `generationSkillCatalog`, `renderTreeGenerationSkill`, `initialValidationReport`, `revisionDecision` |

권장 trace 레이어 해석:

| 레이어 | trace keys | 연결 결과 파일 |
|---|---|---|
| `Understand` | `parseResult`, `screenIntent` | `source-spec.json`, `screen-intent.json` |
| `Compose` | `composition`, `patternLayerCandidates`, `patternSelection`, `designContextBundleSelection`, `generation`, `generationSkillCatalog`, `renderTreeGenerationSkill`, `componentProposal` | `composition-plan.json`, `decoration-plan.json`, `pattern-selection.json`, `agent-result.json`, `component-proposal.json` |
| `Revise` | `initialValidationReport`, `qualityReview`, `revisionDecision`, `revision` | `validation-report.json`, `quality-review.json`, `final-result.json` |

### 인덱스

| 파일 | 내용 |
|---|---|
| `../manifest.json` | run 메타: 위 모든 결과 파일 포인터 + `trace` + `stageOrder`(13단계 순서) + `tags` + `summary` + `tableGenerationResult` |

---

## 6. 참조 문서 계보

| 레이어 | 위치 | 책임 |
|---|---|---|
| 디자인 정본 | `docs/design/*.md` (SECTION_PATTERNS, LAYOUT_SPACING_CONTRACT, SCREEN_PATTERN_SUMMARY, INTERACTION_PATTERNS 등) | SKT SDUI 패턴 원문 |
| agent 규칙 | `packages/agent/docs/design-context/*.md` | 프롬프트 주입용 압축 규칙(번들 본문) |
| task 계약 | `packages/agent/docs/<task>/{prompt-contract,output-contract,checklist}.md` | 단계별 입출력 계약 |
| 스키마 | `@cx/schema` `SCHEMA_VERSION` | 출력 DTO 버전 |

### SCHEMA_VERSION

```
screen-intent.v0.1 · composition-plan.v0.1 · pattern-selection.v0.1
· render-tree.v0.1 · table-generation-result.v0.1
· quality-inspection.v0.1 · component-proposal.v0.1
```

---

## 7. 요약 데이터 흐름

```
Understand
  md → SourceSpec(parse)
     → screen-intent(목적/우선순위)

Compose
  screen-intent
     → composition-plan(위계/주 행동/섹션 리듬/밀도/패턴 판단)
     → decoration-plan(디바이더/분할, 순수)
     → pattern-selection(슬롯별 layout)
     → RenderTree 생성 ← 번들 규칙 본문 주입
     → component-proposal(비파괴 catalog gap 분석)

Revise
  RenderTree
     → validate(스키마/계약/state/CTA)
     → quality-review(3축 점수+findings)
     → next-action 게이팅 → (필요 시) 1회 revision → 재검증
     → write flat artifacts + manifest + trace
```

핵심 원칙: **source evidence·schema/catalog > design-context 번들 규칙**. 번들은 SourceSpec·스키마·component contract·pattern 후보를 우회하지 못하고, 화면 구조·state coverage·interaction·visual foundation·review 기준을 좁히는 보조 context로만 작동한다.
