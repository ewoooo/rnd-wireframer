# @cx/orchestration

`@cx/orchestration`은 pipeline stage에서 쓰는 deterministic helper를 제공하는 패키지다.

현재 MVP에서는 `SourceSpec`을 screen-intent, composition-plan, pattern-selection, screen-generation, quality-review, screen-revision agent 입력으로 조립하는 순수 stage builder를 제공한다. pipeline 실행 순서와 stage runtime은 `@cx/pipeline`이 소유한다.

## 책임

- SourceSpec, DraftCandidate, ValidationReport 같은 입력을 다음 단계 입력으로 조립한다.
- screen/region/area/component 레이어 후보를 받는 pattern-selection agent input을 만든다.
- validation 실패 시 사용할 screen-revision agent input을 만든다.
- `table-generation-result` 중간 산출물과 `render-tree` preview 산출물의 agent input 경계를 정의한다.
- 생성, 검수, 미리보기, 반영 stage의 입력/출력 경계를 정의한다.
- 검증 결과를 받아 다음 액션을 순수하게 결정한다.

## 두지 않는 책임

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- 검증 rule 판정
- pipeline 실행
- pipeline stage 순서 소유
- React render
- component/layout/pattern/token 값 소유
- 승인 데이터 직접 반영

## Generation Artifact Boundary

생성 AI의 1차 출력은 `tableGenerationResult`와 `renderTree`를 함께 반환하는 것을 기준으로 한다.

- `tableGenerationResult`: `data/tables/screens.json`, `areas.json`, `components.json` 정본 구조에 맞춘 중간 산출물이다. screen, region, area, component record는 모두 `layout.<target>.<PatternName>` layout id를 가진다.
- `renderTree`: `@cx/renderer`가 즉시 preview할 수 있도록 materialize된 산출물이다. renderer는 `layout` id로 패턴 컴포넌트를 resolve하고 `type`, `props`, `children`을 소비한다.

따라서 layout id 강제 계약은 RenderTree보다 table-shaped intermediate artifact에서 먼저 검증한다.

## Runtime Boundary

`@cx/orchestration`은 pipeline runtime을 소유하지 않는다. 실행 가능한 stage 순서와 runtime context는 `@cx/pipeline`의 pipeline definition이 소유한다.

할 수 있는 일:

- stage input contract 정의
- next action intent 반환

하지 않는 일:

- stage 순서 정의
- pipeline 실행
- Claude 실행
- validation 실행
- 파일 읽기/쓰기
- artifact write
- side effect 실행
- local runtime state를 읽어 workflow 결정

## Source Layout

`src/public/`는 외부에서 사용할 수 있는 순수 helper와 타입 surface다. 파일 이름은 책임 단위다.

| 파일                          | 책임                                                            | 하지 않는 일                           |
| ----------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| `contract.ts`                 | 패키지 boundary contract 선언                                   | runtime 실행                           |
| `types.ts`                    | orchestration public DTO/type surface                           | helper 구현                            |
| `source-context.ts`           | `SourceSpec`에서 source summary와 allowed source refs 추출      | source 의미 추론, validation           |
| `pattern-layer-candidates.ts` | screen/region/area/component pattern layer 후보 조립            | pattern catalog 소유, agent 실행       |
| `agent-inputs.ts`             | stage별 agent query/context 조립                                | Claude 실행, 파일 IO, next-action 결정 |
| `design-context.ts`           | design-context bundle ref 선택                                  | bundle 파일 읽기, prompt 본문 로딩     |
| `next-action.ts`              | validation/quality summary를 deterministic next action으로 변환 | revision 실행, pipeline stage 제어     |
| `generation.ts`               | 기존 `@cx/orchestration/generation` import 호환 barrel          | 직접 구현 추가                         |

새 helper를 추가할 때는 먼저 위 표에서 책임 파일을 고른다. 맞는 파일이 없으면 `generation.ts`에 붙이지 말고 새 책임 파일이 필요한지 검토한다.

## Function Guide

### Source Context

- `buildSourceReferenceCatalog(sourceSpec)`: agent가 사용할 수 있는 source ref vocabulary를 만든다.
- `createSourceSummary(sourceSpec)`: screen code/name/route와 area/component 개수를 요약한다.
- `listSourceComponentIds(sourceSpec)`: source order 기준 component id 목록을 만든다.

### Pattern Candidates

- `buildPatternLayerCandidates({ sourceSpec, resolver })`: SourceSpec layer를 pattern candidate list로 바꾼다. resolver는 외부 catalog/layout 경계에서 주입한다.

### Agent Inputs

- `buildScreenIntentAgentInput(sourceSpec)`: 화면 목적과 우선순위를 추론하는 agent input을 만든다.
- `buildCompositionPlanAgentInput(input)`: screen intent와 candidate를 바탕으로 section plan input을 만든다.
- `buildPatternSelectionAgentInput(input)`: 허용된 layer candidate 안에서 pattern selection input을 만든다.
- `buildScreenGenerationAgentInput(sourceSpec, options)`: RenderTree/tableGenerationResult 생성 input을 만든다.
- `buildQualityReviewAgentInput(input)`: 생성 결과 검수 input을 만든다.
- `buildScreenRevisionAgentInput(input)`: validation/quality finding 기반 bounded revision input을 만든다.

### Design Context

- `buildDesignContextBundleRefs(input)`: SourceSpec/upstream artifact/validation state를 보고 필요한 design-context bundle ref만 선택한다. 문서 본문은 읽지 않는다.

### Next Action

- `buildGenerationNextAction(input)`: validation summary와 quality inspection summary를 `write-artifacts`, `request-revision`, `request-human-review`, `stop` 중 하나로 변환한다.

## Public Subpaths

| Subpath                        | 책임                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `@cx/orchestration`            | 패키지 루트 public API                                                 |
| `@cx/orchestration/contract`   | 순수 orchestration boundary contract                                   |
| `@cx/orchestration/generation` | agent input, source context, design-context, next-action helper barrel |
| `@cx/orchestration/types`      | stage, action, transition public type surface                          |

`buildComponentProposalAgentInput`은 카탈로그 밖 후보를 제시하는 비파괴 제안 입력을 조립한다. design-context bundle은 ref만 선택하고(`buildDesignContextBundleRefs`), 본문 로드/주입은 `@cx/pipeline`이 담당한다. generation/quality/revision/proposal 입력의 `context.designContextBundles[].body`로 본문이 실린다.

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.
