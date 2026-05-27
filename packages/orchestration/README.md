# @cx/orchestration

`@cx/orchestration`은 생성 과정의 순수한 업무 흐름을 정의하는 패키지다.

현재 MVP에서는 `SourceSpec`을 `@cx/agent`의 `screen-generation` 입력으로 조립하는 순수 stage builder를 제공한다. state transition과 next action 결정 로직은 후속 세션에서 이 contract를 기준으로 확장한다.

## 책임

- SourceSpec, DraftCandidate, ValidationReport 같은 입력을 다음 단계 입력으로 조립한다.
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

## Public Subpaths

| Subpath | 책임 |
|---|---|
| `@cx/orchestration` | 패키지 루트 public API |
| `@cx/orchestration/contract` | 순수 orchestration boundary contract |
| `@cx/orchestration/generation` | SourceSpec -> screen-generation AgentTaskInput builder |
| `@cx/orchestration/types` | stage, action, transition public type surface |

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.
