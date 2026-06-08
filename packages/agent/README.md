# @cx/agent

`@cx/agent`는 Claude Agent SDK 기반의 AI 실행 adapter 패키지다.

이 패키지는 화면 생성 결과의 최종 타입 계약, RenderTree 변환, DB 저장, workflow orchestration을 소유하지 않는다. 출력 DTO/schema 계약은 `@cx/schema`가 관리하고, `@cx/agent`는 해당 계약을 만족하는 결과를 Claude 실행으로 얻어오는 책임만 가진다.

Screen inference에서의 실행 엔진 위치는 [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md)를 따른다. 생성/검수 prompt checklist와 출력 규약은 [`docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs) 아래에서 패키지 내부 자산으로 관리한다.

## 책임

- 사용자 쿼리를 agent task로 분류해 실행한다.
- task별 prompt artifact를 구성한다.
- Claude Agent SDK를 local-first로 호출한다.
- 기본 생성은 새 세션으로 실행하고, 명시적 재시도/이어쓰기 흐름에서만 resume 정책을 적용한다.
- Claude 응답을 agent 실행 결과로 정규화한다.
- web 서버/API route와 CLI 스크립트가 같은 입력 형태로 실행할 수 있는 adapter를 제공한다.
- 생성/검수용 prompt contract, checklist, output 규약 문서를 패키지 내부에서 독립 관리한다.

## 패키지 책임 경계

`@cx/agent`는 AI 실행 패키지다. 외부 caller가 요청한 task를 Claude 실행 요청으로 바꾸고, Claude 응답을 agent 실행 결과로 되돌려준다.

```text
caller
  -> @cx/agent/adapters
  -> @cx/agent runtime
  -> task catalog
  -> task prompt artifact + Claude session policy
  -> Claude Agent SDK runner
```

caller는 web API route, server action, CLI script가 될 수 있다. 브라우저 client component는 이 패키지를 직접 import하지 않는다.

## 외부 사용 방법

### 권장 entrypoint

```ts
import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";
```

외부 caller는 `createAgentRuntime`으로 runtime을 만들고, `runAgentQuery`에 task kind와 사용자 query를 넘긴다.
`createClaudeRunner`는 caller가 `model`을 넘기면 그 값을 사용하고, 없으면 `CLAUDE_GENERATION_MODEL`, 그것도 없으면 agent 패키지 기본 모델 `claude-opus-4-7`을 Claude CLI `--model`로 전달한다.

```ts
const runtime = createAgentRuntime({
	runner: createClaudeRunner({
		localFirst: true,
	}),
});

const result = await runAgentQuery(runtime, {
	taskKind: "screen-generation",
	query: "가입 완료 화면을 생성해줘",
	context: {
		screenCode: "mbr-join-complete",
	},
});
```

`createClaudeRunner`의 실제 local session 연결은 `src/claude/claude-agent-sdk-runner.ts`에서 관리한다.

### Web에서 사용할 때

web 버튼은 `@cx/agent`를 직접 import하지 않는다. 버튼은 Next.js API route 또는 server action을 호출하고, 서버 쪽 코드가 `@cx/agent/adapters`를 사용한다.

```ts
// apps/web/src/app/api/agent/route.ts 같은 서버 전용 경계
import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";

const runtime = createAgentRuntime({
	runner: createClaudeRunner({ localFirst: true }),
});

export async function POST(request: Request) {
	const body = await request.json();
	const result = await runAgentQuery(runtime, {
		taskKind: body.taskKind,
		query: body.query,
		context: body.context,
		sessionId: body.sessionId,
		resume: body.resume,
	});

	return Response.json(result);
}
```

### CLI script에서 사용할 때

CLI script도 web 서버와 같은 `runAgentQuery` adapter를 사용한다.

```ts
import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import { createClaudeRunner } from "@cx/agent/claude";

const runtime = createAgentRuntime({
	runner: createClaudeRunner({ localFirst: true }),
});

const result = await runAgentQuery(runtime, {
	taskKind: "quality-review",
	query: "이 생성 후보가 디자인 패턴 문서를 지키는지 검수해줘",
	context: {
		candidatePath: "path/to/generated.json",
	},
});

console.log(JSON.stringify(result, null, 2));
```

### Public subpaths

| Subpath | 외부 사용처 | 책임 |
|---|---|---|
| `@cx/agent` | 서버/API/CLI | runtime 생성, task 실행의 root API |
| `@cx/agent/adapters` | 서버/API/CLI 권장 진입점 | web과 script가 공유하는 `runAgentQuery` 요청 shape |
| `@cx/agent/claude` | 서버/API/CLI | Claude runner 생성과 Claude 내부 판정 helper |
| `@cx/agent/contract` | 타입 참조 | agent 실행 계약 타입 |
| `@cx/agent/prompt-catalog` | inference knowledge resolver | prompt catalog SSOT object resolver |
| `@cx/agent/skill-catalog` | inference knowledge resolver | skill set SSOT object resolver |
| `@cx/agent/tasks` | 테스트/진단 | task catalog와 task definition 확인 |

`src/runtime`, `src/claude`, `src/errors` 내부 파일은 직접 import하지 않는다. 필요한 외부 표면은 위 subpath를 통해서만 공개한다.

## 두지 않는 책임

- Codex 기반 검수 runner
- OpenAI/Codex provider
- RenderTree 생성 또는 React render
- `database/tables` 저장/반영
- 제품 workflow orchestration
- 최종 출력 타입 SSOT

## 디렉토리 구조

```text
packages/agent/
  package.json
  src/
    index.ts

    contract/
      task-catalog.ts
      task-runner-contract.ts
      runtime-contract.ts

    tasks/
      screen-generation/
        index.ts
        prompt.ts
      screen-revision/
        index.ts
        prompt.ts
      quality-review/
        index.ts
        prompt.ts

    runtime/
      create-agent-runtime.ts
      run-agent-task.ts
      resolve-task-runner.ts

    claude/
      claude-agent-sdk-runner.ts
      claude-session-policy.ts
      claude-availability.ts
      claude-result-parser.ts

    prompt-catalog/
      catalog.ts

    skill-catalog/
      catalog.ts

    errors/
      agent-error.ts

    adapters/
      index.ts
      run-agent-query.ts

    __tests__/
```

## 디렉토리 책임

### `src/contract`

Agent 패키지 내부 실행 계약을 둔다.

최종 산출물의 제품 DTO/schema 계약은 `@cx/schema`가 소유한다. 이 디렉토리는 `AgentTaskKind`, `AgentTaskDefinition`, `AgentRunner`, `AgentRunResult`처럼 agent 실행 흐름 자체에 필요한 타입만 관리한다.

### `src/tasks`

사용자 쿼리 종류별 task를 둔다.

- `screen-generation`: 사용자 쿼리와 생성 컨텍스트를 받아 신규 화면 후보를 생성한다.
- `screen-revision`: 기존 후보와 피드백을 받아 수정 후보를 생성한다.
- `quality-review`: 생성 후보를 기준 문서와 계약에 따라 검수하고 hierarchy/separation/fidelity 점수를 매긴다.
- `component-proposal`: 카탈로그 밖 component/변형 후보를 비파괴 제안 아티팩트로 산출한다(확정·반영은 사람의 카탈로그 mutation으로만).

생성/검수/제안 prompt가 참조하는 design-context bundle 규칙 정본은 `docs/design-context/`에 있고, prompt 원문은 `docs/prompts/`, skill/checklist/output 규칙은 `docs/skills/`의 set 단위 참조 자산이다.

각 task는 task definition 객체와 `createPrompt`만 가진다. 세션 정책과 Claude 응답 해석은 `src/claude`가 담당한다. 런타임은 문자열 `switch`/`if` 분기 대신 task catalog를 조회해 실행한다.

### `src/runtime`

공통 실행 순서를 관리한다.

```text
task catalog 조회
-> prompt artifact 구성
-> Claude session 정책 결정
-> Claude runner 호출
-> Claude 응답 payload 반환
```

`runtime`은 특정 task의 세부 의미를 몰라야 한다. task별 차이는 `tasks`와 `contract`의 catalog에 둔다.

### `src/claude`

Claude Agent SDK와 직접 맞닿는 adapter를 둔다.

로컬 Claude 사용 가능 여부 확인, Claude Agent SDK 호출, Claude session 옵션 변환, Claude 응답 envelope 해석이 이 디렉토리의 책임이다. 다른 AI provider를 일반화하기 위한 `providers` 계층은 현재 두지 않는다.

### `src/prompt-catalog`

`packages/agent/docs/prompts`의 prompt markdown 정본을 inference에서 참조할 수 있는 `prompt-catalog` SSOT object로 내보낸다. `@cx/agent` root와 `@cx/agent/prompt-catalog` subpath가 같은 resolver를 공개한다.

### `src/skill-catalog`

`packages/agent/docs/skills`의 skill/checklist/output-contract set을 inference에서 참조할 수 있는 `skill` SSOT object로 내보낸다. 스킬은 prompt catalog와 같은 방식으로 공개하되, 세트 단위 JSON 객체 형태를 가진다.

### `src/errors`

Agent 실행 오류 타입을 둔다.

예: task catalog 누락, Claude 실행 불가, session resume 실패, 출력 parse 실패.

### `src/adapters`

패키지 외부에서 호출하기 위한 얇은 adapter를 둔다.

web 버튼은 브라우저 클라이언트에서 `@cx/agent`를 직접 호출하지 않는다. Next.js API route나 server action이 `@cx/agent/adapters`를 호출하고, 버튼은 해당 route/action을 호출한다.

CLI 스크립트도 같은 adapter를 사용한다. 이렇게 하면 web과 script가 서로 다른 요청 shape를 만들지 않는다.

## Public Surface

```ts
import { createAgentRuntime, runAgentTask } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
```

`runAgentQuery`는 web 서버/API route와 CLI 스크립트가 공유하는 외부 진입점이다.

## 호출 경계

```text
Web Button
  -> Next.js API route 또는 server action
  -> @cx/agent/adapters runAgentQuery
  -> @cx/agent runtime
  -> Claude Agent SDK

CLI Script
  -> @cx/agent/adapters runAgentQuery
  -> @cx/agent runtime
  -> Claude Agent SDK
```

## 현재 구현 메모

현재 패키지는 디렉토리와 public adapter 계약을 먼저 고정한다. Claude Agent SDK 실제 호출과 `@cx/schema` 기반 입출력 DTO는 후속 구현에서 연결한다.

## 테스트 범위

`src/__tests__`는 agent 패키지 내부에서 검증 가능한 단위만 다룬다.

- task catalog 등록 여부
- task prompt artifact 생성
- session mode와 명시적 resume 정책
- `runAgentQuery` 외부 adapter가 runtime으로 넘기는 요청 shape
- Claude local/remote availability 판정 로직
- Claude JSON 응답 parser
- prompt/skill catalog root와 subpath 공개 표면

실제 Claude Agent SDK 세션을 열거나 web 버튼부터 생성 결과까지 검증하는 e2e는 전역 테스트에서 다룬다.
