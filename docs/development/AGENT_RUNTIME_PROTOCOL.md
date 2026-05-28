# Agent Runtime Protocol

## 1. 문서 책임

이 문서는 `@cx/agent`의 실행 계약과 세션 규칙을 정의한다.

제품 방향은 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 패키지 관계망은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 저장소 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다.

이 문서는 prompt 문구 원문이나 품질 체크리스트 본문을 소유하지 않는다. 생성/검수 참조 자산의 정본은 [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs) 아래에서 관리한다.

## 2. 목적

`@cx/agent`는 Claude Agent SDK를 local-first로 호출하는 실행 adapter다.

- task 입력을 Claude 실행 요청으로 변환한다.
- 새 세션/재개 세션 정책을 일관되게 적용한다.
- Claude 응답을 pipeline과 caller가 소비할 수 있는 정규 결과로 되돌린다.

## 3. 경계

```text
caller
-> @cx/agent/adapters
-> @cx/agent runtime
-> @cx/agent task catalog
-> Claude Agent SDK runner
-> AgentRunResult
```

경계 규칙:

- `@cx/orchestration`은 stage 입력을 조립하지만 Claude를 실행하지 않는다.
- `@cx/pipeline`은 stage 순서와 실행을 소유하지만 prompt 원문과 세션 정책은 소유하지 않는다.
- `@cx/schema`는 DTO/schema 계약 SSOT이고, agent 런타임 정책은 소유하지 않는다.
- `@cx/validation`은 결과 정합성 검증을 수행할 수 있지만 agent 실행 자체는 소유하지 않는다.

## 4. 외부 진입점

현재 외부 caller는 `runAgentQuery()` shape를 기준으로 `@cx/agent`를 사용한다.

```ts
type AgentQueryRequest = {
  taskKind: AgentTaskKind;
  query: string;
  context?: unknown;
  previousResult?: unknown;
  sessionId?: string;
  resume?: boolean;
};
```

규칙:

- caller는 문자열 query와 구조화된 context만 넘긴다.
- caller는 prompt artifact를 직접 조립하지 않는다.
- caller는 `resume: true`일 때만 기존 세션 재개 의도를 전달한다.

## 5. 내부 실행 계약

런타임 내부의 핵심 실행 계약은 다음 shape를 기준으로 한다.

```ts
type AgentRunRequest = {
  taskKind: AgentTaskKind;
  input: AgentTaskInput;
  session?: {
    mode?: "new" | "resume";
    sessionId?: string;
    reason?: string;
  };
};

type AgentRunResult = {
  taskKind: AgentTaskKind;
  session: {
    mode: "new" | "resume";
    sessionId?: string;
  };
  payload: unknown;
};
```

## 6. 세션 정책

- 기본 생성 요청은 항상 새 세션으로 실행한다.
- 기존 세션 재개는 명시적 재시도, 검수 반영, 이어쓰기 흐름에서만 허용한다.
- caller가 `resume`을 보내지 않은 경우 `session.mode`는 `new`로 해석한다.
- `resume` 요청에 `sessionId`가 없으면 런타임 오류로 취급한다.

정책 소유 경계:

- 정책 정의와 mode 해석은 `@cx/agent`가 소유한다.
- 어떤 시점에 재개를 요청할지에 대한 workflow 결정은 `@cx/pipeline` 또는 상위 caller가 소유한다.

## 7. Task 종류

현재 문서 기준 task 종류:

- `screen-intent`
- `composition-planning`
- `pattern-selection`
- `screen-generation`
- `screen-revision`
- `quality-review`

규칙:

- task 추가/삭제 시 `@cx/agent` task catalog와 이 문서를 함께 갱신한다.
- task별 prompt/checklist/output 예시는 [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs) 아래에서 분리 관리한다.

## 8. Prompt/Reference 자산 경계

생성/검수용 참조 자산은 `@cx/agent` 내부에서 독립 관리한다.

```text
packages/agent/docs/
  README.md
  session-policy.md
  screen-generation/
  quality-review/
```

운영 규칙:

- prompt 코드와 품질 기준 문서를 섞지 않는다.
- 변경 가능한 문장형 규칙, checklist, 예시 출력 규약은 코드 바깥 문서 자산으로 유지한다.
- smoke/pipeline 실험도 생성/검수 문장형 자산이 필요하면 `packages/agent/docs/` 정본을 참조한다.

## 9. Local-First 실행 규칙

- Claude 로컬 실행을 우선 시도한다.
- 로컬 실행이 없거나 실패한 경우에만 fallback 경로를 고려한다.
- fallback 여부와 방식은 `@cx/agent` runner 구현이 소유하지만, fallback 허용 여부는 상위 제품 정책과 일치해야 한다.

## 10. 검증 기준

- `runAgentQuery()` 요청 shape와 문서가 일치한다.
- `AgentRunRequest`/`AgentRunResult` 설명이 현재 runtime contract와 충돌하지 않는다.
- 세션 정책이 새 세션 기본, 명시적 resume 제한 원칙과 충돌하지 않는다.
- 참조 자산 위치가 `packages/agent/docs/` 기준과 일치한다.
