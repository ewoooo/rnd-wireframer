# @cx/orchestration

`@cx/orchestration`은 생성 과정의 순수한 업무 흐름을 정의하는 패키지다.

현재 MVP에서는 작은 generation plan과 `SourceSpec`을 `@cx/agent`의 `screen-generation` 입력으로 조립하는 순수 stage builder를 제공한다. state transition과 next action 결정 로직은 후속 세션에서 이 contract를 기준으로 확장한다.

## 책임

- SourceSpec, DraftCandidate, ValidationReport 같은 입력을 다음 단계 입력으로 조립한다.
- 실행 가능한 step 배열 형태의 generation plan을 만든다.
- generation step id의 정본 `GENERATION_PLAN_STEP`을 제공한다.
- screen/region/area/component 레이어 후보를 받는 pattern-selection agent input을 만든다.
- validation 실패 시 사용할 screen-revision agent input을 만든다.
- `table-generation-result` 중간 산출물과 `render-tree` preview 산출물의 agent input 경계를 정의한다.
- 생성, 검수, 미리보기, 반영 stage의 입력/출력 경계를 정의한다.
- 검증 결과를 받아 다음 액션을 순수하게 결정한다.
- `@cx/pipeline`이 실행할 side effect 명령의 의도를 데이터로 만든다.

## 두지 않는 책임

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- 검증 rule 판정
- React render
- component/layout/pattern/token 값 소유
- 승인 데이터 직접 반영

## Generation Artifact Boundary

생성 AI의 1차 출력은 `tableGenerationResult`와 `renderTree`를 함께 반환하는 것을 기준으로 한다.

- `tableGenerationResult`: `data/tables/screens.json`, `areas.json`, `components.json` 정본 구조에 맞춘 중간 산출물이다. screen, region, area, component record는 모두 `{ id, variant }` pattern ref를 가진다.
- `renderTree`: `@cx/renderer`가 즉시 preview할 수 있도록 materialize된 산출물이다. renderer는 현재 pattern을 직접 layout preset으로 소비하지 않고 `type`, `props`, `children`을 소비한다.

따라서 pattern 강제 계약은 RenderTree보다 table-shaped intermediate artifact에서 먼저 검증한다.

## Plan Boundary

`@cx/orchestration`은 generation plan 정의만 소유한다.

할 수 있는 일:

- step 순서 정의
- step kind/id 정의
- stage input contract 정의
- next action intent 반환

하지 않는 일:

- Claude 실행
- validation 실행
- 파일 읽기/쓰기
- artifact write
- side effect 실행
- local runtime state를 읽어 workflow 결정

## Public Subpaths

| Subpath | 책임 |
|---|---|
| `@cx/orchestration` | 패키지 루트 public API |
| `@cx/orchestration/contract` | 순수 orchestration boundary contract |
| `@cx/orchestration/generation` | generation plan과 SourceSpec -> screen-generation AgentTaskInput builder |
| `@cx/orchestration/types` | stage, action, transition public type surface |

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.
