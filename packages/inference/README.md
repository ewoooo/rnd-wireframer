# @cx/inference

추론 런타임 + 화면 생성 파이프라인 **정의**를 소유한다.
파이프라인은 순수 선언이고, 실제 **등록**(어떤 파이프라인·함수·러너를 쓸지)은 앱이 composition root에서 주입한다.

## 흐름 한눈에

```
정의(선언)            주입(등록)                     레지스트리 빌드             조회/실행
screen-generation-v1  apps/web/.../inference-runtime  create-inference-runtime    run-inference-job
  definePipeline  →    createInferenceRuntime({   →    createPipelineRegistry  →   pipelines.get(id, version)
  (steps 배열)           pipelines: [...] })             + register(루프)            → steps 순회 실행
```

- **정의**: `src/pipelines/screen-generation-v1.ts` — `definePipeline`. 자기 자신을 등록하지 않는다.
- **등록**: `apps/web/src/server/inference-runtime.ts` — `createInferenceRuntime`에 배열로 주입.
- **레지스트리**: `src/worker/create-inference-runtime.ts` — 주입 배열을 `register()` 루프로 in-memory 레지스트리에 담음.
- **조회**: `src/worker/run-inference-job.ts` — `runtime.pipelines.get(job.pipelineId, job.pipelineVersion)`로 꺼내 `steps`를 위→아래 순회, 각 step의 `engine`으로 디스패치.

> 핵심: **steps 배열이 곧 실행 순서·진실원.** 코드 로직 수정 없이 배열만 고치면 그대로 추론된다. 단, 각 step이 가리키는 대상(아래 4종)이 실제로 존재해야 한다.

## 파이프라인 등록하는 방법

파이프라인 등록은 **앱 composition root에서 주입**으로 한다. 패키지 안에서 등록하지 않는다.

### 1) 파이프라인 정의 (패키지)

`packages/inference/src/pipelines/<name>.ts`:

```ts
import { context, definePipeline, defineStep, jobInput, outputContractRef } from "../pipeline";

export const myPipeline = definePipeline({
  id: "my-pipeline",
  version: "v1",
  steps: [
    /* defineStep(...) — 아래 "스텝 추가하는 방법" 참고 */
  ],
});
```

`package.json`의 `exports`에 subpath를 추가해 앱이 import할 수 있게 한다 (예: `"./pipelines/my-pipeline": "./src/pipelines/my-pipeline.ts"`).

### 2) 런타임에 주입 (앱)

`apps/web/src/server/inference-runtime.ts`:

```ts
import { myPipeline } from "@cx/inference/pipelines/my-pipeline";

export const inferenceRuntime = createInferenceRuntime({
  dataRoot,
  pipelines: [screenGenerationPipelineV1, myPipeline], // ← 배열에 추가
  functions: { "source-spec-mvp": buildSourceSpec },   // function 엔진 step이 쓰는 함수
  claudeRunner: createClaudeRunner({ localFirst: true }),
});
```

`createInferenceRuntime`(`src/worker/create-inference-runtime.ts`)가 이 배열을 받아
`createPipelineRegistry()` + `register()` 루프로 레지스트리를 만든다. **별도 등록 호출은 없다.**

### 3) 그 파이프라인으로 job 생성

job 생성 시 `pipelineId` / `pipelineVersion`을 정의한 값과 동일하게 박으면 레지스트리에서 조회된다:

```ts
jobStore.createJob({ pipelineId: "my-pipeline", pipelineVersion: "v1", input });
```

## 스텝 추가하는 방법

`defineStep`을 정의의 `steps` 배열에 넣는다. 순서가 곧 실행 순서다.
step이 가리키는 **4가지는 실제로 존재해야** 런타임에서 통과한다. 아니면 그 step에서 job이 실패한다.

### claude 스텝

```ts
defineStep({
  id: "02-screen-intent",
  engine: "claude",
  inputs: { sourceSpec: context("source-spec") },   // 앞 step이 writeToContext 한 키
  prompt: { id: "screen-intent" },                   // ← AgentTaskKind (@cx/agent)
  output: {
    contractRef: outputContractRef("screen-intent"), // ← output contract id (@cx/schema)
    writeToContext: "screen-intent",                 // 뒤 step이 읽을 수 있게 context에 기록
  },
});
```

### function 스텝

```ts
defineStep({
  id: "01-source-spec",
  engine: "function",
  inputs: { job: jobInput() },          // job.input 전체 (jobInput("path")로 일부만도 가능)
  run: { id: "source-spec-mvp" },       // ← 앱 functions 맵의 키
  output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
});
```

### 반드시 맞춰야 하는 4가지

| step 필드 | 무엇이어야 하나 | 소유처 / 정의 위치 |
|---|---|---|
| `prompt.id` (claude) | `AgentTaskKind` | `@cx/agent` — `src/contract/task-catalog.ts`, 런타임 맵 `src/tasks/index.ts` |
| `run.id` (function) | 주입된 `functions` 맵의 키 | 앱 — `inference-runtime.ts`의 `functions: { ... }` |
| `output.contractRef` | output contract id | `@cx/schema` — `src/inference-reference.ts` |
| `inputs`의 `context("k")` | **앞선 step이 `writeToContext: "k"`로 써둔 키** | 같은 파이프라인 내 선행 step |

### 의존성(순서) 규칙

`context("X")`로 읽으려면 그 step **앞에** `writeToContext: "X"` 한 step이 있어야 한다.
순서를 바꿔 의존성이 역전되면 빈 context를 읽는다. (예: `04-render-tree`가 `context("composition-plan")`을 읽으려면 `03-composition`이 먼저 그 키를 써야 한다.)

### 새 prompt / function / contract가 필요하면

배열만 고쳐서 되는 건 **이미 존재하는 조각의 재배열**이다. 없는 걸 새로 가리키면 먼저 그 조각을 만들어야 한다:

- 새 `prompt.id` → `@cx/agent`에 `AgentTaskDefinition` 추가 후 `agentTaskCatalog`에 등록.
- 새 `run.id` → 앱 `functions` 맵에 함수 등록.
- 새 `output.contractRef` → `@cx/schema`에 contract 추가.

## 현재 등록 가능한 값 (참조표)

**AgentTaskKind** (`prompt.id`로 쓸 수 있는 값, `@cx/agent`):
`component-proposal`, `composition-planning`, `pattern-selection`, `quality-review`,
`screen-generation`, `screen-intent`, `screen-revision`

**output contract id** (`outputContractRef(...)`, `@cx/schema`):
`source-spec`, `screen-intent`, `composition-plan`, `render-tree`, `validation-report`,
`quality-inspection`

**function id** (`run.id`, 앱 `functions` 맵 — 현재):
`source-spec-mvp`, `deterministic-validation`

**knowledge source** (`references`로 주입 가능, `src/knowledge/knowledge-base.ts`):
`component-catalog`, `layout-catalog`, `skill`(+id), `prompt-catalog`(+id), `token-catalog`
※ 현재 screen-generation@v1의 claude 스텝은 references를 쓰지 않는다 (prompt/skill은 `@cx/agent` task 정의가 소유).

## HTTP API (apps/web)

런타임을 외부에서 구동하는 엔드포인트. 라우트는 `apps/web/src/app/api/inference/`에 있고,
모두 `@/server/inference-runtime`의 단일 `inferenceRuntime`를 공유한다.
job은 항상 `screen-generation` / `v1` 파이프라인으로 생성된다 (`inference-runtime.ts:createInferenceJob`).

모든 라우트는 `runtime = "nodejs"`.

### `POST /api/inference` — job 생성

요청 본문(JSON)은 그대로 `job.input`이 된다. `01-source-spec`의 `buildSourceSpec`가 읽는 필드:
`screenCode`, `name`, `route`, `importId` (모두 선택; 없으면 기본값). 본문 파싱 실패 시 `{}`로 처리.

```bash
curl -X POST localhost:3000/api/inference \
  -H 'content-type: application/json' \
  -d '{"screenCode":"DEMO"}'
# 202 Accepted
# { "jobId": "job-xxxx-0" }
```

실행은 비동기. 응답 즉시 받고(`202`), 진행은 아래 events/steps로 추적한다.

### `GET /api/inference/{jobId}` — job 상태

```jsonc
// 200 — Job
{
  "jobId": "job-xxxx-0",
  "pipelineId": "screen-generation",
  "pipelineVersion": "v1",
  "status": "queued | running | succeeded | failed",
  "input": { /* POST 본문 */ },
  "currentStepId": "04-render-tree",   // 실행 중일 때
  "error": { "code": "...", "message": "..." },  // 실패 시
  "createdAt": "ISO", "updatedAt": "ISO"
}
// 404 — { "error": "job not found" }
```

### `GET /api/inference/{jobId}/steps` — step 스냅샷

```jsonc
// 200 — 파이프라인 step 순서대로
{
  "steps": [
    { "stepId": "01-source-spec", "status": "succeeded", "startedAt": "ISO", "completedAt": "ISO" },
    { "stepId": "02-screen-intent", "status": "running", "startedAt": "ISO" },
    { "stepId": "03-composition", "status": "pending" }  // 아직 시작 안 한 step은 stepId+status만
  ]
}
// status: pending | running | succeeded | failed
// 404 — { "error": "job not found" }
```

### `GET /api/inference/{jobId}/events` — SSE 스트림

Server-Sent Events. `Content-Type: text/event-stream`. 200ms 폴링으로 신규 이벤트를 흘려보내고,
`job_completed` 또는 `job_failed`가 나오면 스트림을 닫는다. 이벤트 없을 땐 `: keep-alive` 주석.

재연결 위치 지정: `Last-Event-ID` 헤더 또는 `?after=<seq>` 쿼리 (둘 다 없으면 0부터).

```
event: step_started
id: 3
data: {"seq":3,"jobId":"job-xxxx-0","type":"step_started","stepId":"02-screen-intent","timestamp":"ISO"}

event: job_completed
id: 12
data: {"seq":12,"jobId":"job-xxxx-0","type":"job_completed","timestamp":"ISO"}
```

이벤트 `type`: `job_started`, `step_started`, `step_completed`, `step_failed`, `job_completed`, `job_failed`.
각 이벤트는 `{ seq, jobId, type, timestamp, stepId?, payload? }` (실패 이벤트는 `payload`에 error).

```js
const es = new EventSource(`/api/inference/${jobId}/events`);
es.addEventListener("job_completed", () => es.close());
```

### `GET /api/inference/{jobId}/artifacts/{...path}` — 산출물 원본

job 데이터 디렉터리(`dataRoot/inference-jobs/<jobId>/`) 안의 파일을 그대로 반환.
`.ndjson`은 `application/x-ndjson`, 그 외 `application/json`.

```
GET /api/inference/{jobId}/artifacts/job.json
GET /api/inference/{jobId}/artifacts/events.ndjson
GET /api/inference/{jobId}/artifacts/context/render-tree.json      # step이 writeToContext 한 결과
GET /api/inference/{jobId}/artifacts/context/validation-report.json
GET /api/inference/{jobId}/artifacts/context/source.raw.md         # source file snapshot
GET /api/inference/{jobId}/artifacts/steps/04-render-tree/output.json
GET /api/inference/{jobId}/artifacts/steps/08-quality/output.json
GET /api/inference/{jobId}/artifacts/steps/04-render-tree/inputs.json
#   steps/<stepId>/ 아래: inputs, references, output-contract, prompt, raw-response, output (.json)
```

```bash
# 최종 렌더 트리만 꺼내기
curl -s localhost:3000/api/inference/$JOB/artifacts/context/render-tree.json | jq .
```

경로 이탈/미존재 시 `404 — { "error": "artifact not found or not allowed" }`.

Compatibility route는 사용하지 않는다. Web upload/list/run/apply 흐름도 `/api/inference/*` 아래에서 처리한다.

## 참고

- 파이프라인 정의 예시: `src/pipelines/screen-generation-v1.ts`
- 등록(주입) 예시: `apps/web/src/server/inference-runtime.ts`
- 경계 가드: `scripts/check-inference-boundaries.mjs` — `src/pipelines/**`는 선언만 허용(런타임/IO import 금지).
