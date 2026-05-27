# @cx/pipeline

`@cx/pipeline`은 생성 과정에서 발생하는 side effect를 순서대로 흘려보내는 컨베이어벨트 패키지다.

현재 MVP에서는 승인된 side effect command 배열을 순서대로 실행하고, source artifact read/versioned artifact/write log/approved artifact apply 결과를 감사 가능한 envelope로 반환한다. 외부 저장소 sync, queue/worker, 병렬 실행, 복잡한 retry 정책은 후속으로 미룬다.

`@cx/orchestration`이 순수한 단계 입력/출력 조립과 다음 액션 결정을 담당하고, `@cx/validation`이 순수 검증 결과를 반환한다. `@cx/pipeline`은 이 결과들을 받아 승인된 side effect 명령을 실행 순서대로 전달하고 결과를 회수하는 얇은 컨베이어벨트다.

## 책임

- 버전 있는 생성 산출물을 파일 시스템이나 외부 저장소에 반영한다.
- source artifact를 파일 시스템이나 외부 저장소에서 읽는다.
- catalog CRUD 결과나 agent 실행 결과를 승인된 side effect 명령으로 연결한다.
- 이미 읽힌 Markdown source를 `@cx/parser`에 전달해 MVP SourceSpec 산출물을 회수한다.
- 승인된 side effect 명령의 실행 순서와 실행 결과 envelope를 관리한다.
- CLI, 서버 action, 후속 backend bridge가 공유할 side effect 실행 경계를 제공한다.
- 실행 결과와 실패 정보를 감사 가능한 형태로 돌려준다.

## MVP 구조

```text
packages/pipeline/src/
  index.ts
  public/        외부 contract와 type surface
  commands/      pipeline이 실행 가능한 side effect command 타입과 command helper
  runner/        command 배열 실행, executor registry, result envelope
  executors/     파일 읽기, 파일 쓰기, run log 쓰기, 승인 artifact 반영
  adapters/      fs/clock/id 환경 의존성 adapter와 Node 기본 factory
  errors/        pipeline 전용 error
  testing/       memory fs와 test adapter fixture
```

`@cx/pipeline`은 실행 흐름을 관리하지만 업무 판단은 하지 않는다. plan을 실행하는 harness나 상위 adapter가 필요한 `SideEffectCommand[]`를 만들고, `@cx/pipeline`은 `runSideEffects()`로 받은 command를 순서대로 실행한다.

## Public API

```ts
import { createNodePipelineAdapters, runSideEffects } from "@cx/pipeline";

await runSideEffects({
	runId: "run-001",
	mode: "commit",
	commands,
	adapters: createNodePipelineAdapters(),
});
```

외부에 노출하는 adapter contract는 `fs`, `clock`, `id`로 제한한다. Node 환경에서는 `createNodePipelineAdapters()`를 사용하고, 테스트나 서버 특수 환경에서는 같은 contract를 직접 주입한다.

## Pipeline Boundary

`@cx/pipeline`은 이미 결정된 side effect command를 실행한다.

할 수 있는 일:

- versioned artifact write
- source artifact read
- run log write
- approved artifact apply
- file system adapter를 통한 파일 write/copy/read
- side effect 실행 결과 반환

하지 않는 일:

- generation step 순서 결정
- Claude 실행
- validation rule 판단
- retry 정책 결정
- SourceSpec 또는 RenderTree의 업무 의미 해석

즉 pipeline은 IO를 실행하지만 workflow를 결정하지 않는다.

## 두지 않는 책임

- Claude Agent SDK 실행
- 순수 stage input/output 조립
- Markdown parsing rule 소유
- 검증 rule 판정
- 비즈니스 workflow 소유
- RenderTree React render
- component/layout/pattern catalog 값 소유
- mock schema 원본 수정
- 생성/검수 계약의 SSOT

## Public Subpaths

| Subpath | 책임 |
|---|---|
| `@cx/pipeline` | 패키지 루트 public API |
| `@cx/pipeline/adapters` | Node adapter factory |
| `@cx/pipeline/commands` | side effect command 타입과 command helper |
| `@cx/pipeline/contract` | side effect boundary contract |
| `@cx/pipeline/parser` | 이미 읽힌 Markdown source를 parser로 전달하는 MVP adapter |
| `@cx/pipeline/runner` | side effect command runner |
| `@cx/pipeline/testing` | 테스트 전용 memory adapter fixture |
| `@cx/pipeline/types` | public type surface |

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.
