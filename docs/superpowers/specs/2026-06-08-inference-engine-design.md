# Inference Engine: Claude Adapter + screen-generation@v1 Pipeline Expansion — Design

**Date:** 2026-06-08
**Branch:** `feature/inference-engine`
**Status:** Approved design (pending spec review → implementation plan)

## Goal

Turn the `@cx/inference` claude engine from a stub into a thin adapter that delegates
to `@cx/agent`, extract the inline `screen-generation@v1` pipeline into a declarative
definition owned by the package, and expand it from 1 step to 5 contract-backed steps.

## Responsibility Split (the core principle)

```
@cx/inference (run-step)
  step 실행: input / reference / outputContract 해석
  prompt ref { id } 를 그대로 전달 (messages 변환 금지)
        │  EngineRequest { prompt:{id}, inputs, references, outputContract }
        ▼
claude-engine (adapter)            ← @cx/inference 안에 있지만 도메인 지식 0
  prompt.id → taskKind, context 묶기, runAgentTask 호출, payload → { raw }
        │  AgentRunRequest { taskKind, input:{ query, context } }
        ▼
@cx/agent
  taskKind 해석(screen-generation/quality-review/…) → 프롬프트 조립 → Claude 실행
  local-first/fallback 정책 소유 (resolveClaudeAvailability)
```

- `@cx/inference`: generic runtime. Knows steps, contracts, stores. Knows nothing about
  Claude or how prompts are built.
- `claude-engine`: the adapter between the two. No domain mapping table.
- `@cx/agent`: owns taskKind resolution, prompt composition (task definitions), Claude
  execution, and the local-first/fallback policy.

## Findings That Shaped This Design

Verified against the codebase before designing:

1. **Output contracts already exist.** `resolveOutputContractForInference(id)` resolves
   every `GenerationArtifactKind` in `JSON_SCHEMA_BY_ARTIFACT_KIND`, which includes
   `source-spec, screen-intent, composition-plan, render-tree, quality-inspection`. So
   `outputContractRef("screen-intent")` etc. work today. The "low-risk expansion" premise holds.

2. **`InferenceStepDefinition` already supports the declarative shape.** It already has
   `prompt?: { id; version? }` and `references?: Record<string, KnowledgeRef>`.

3. **`@cx/agent` owns prompt/skill composition.** Each `AgentTaskKind` has a task
   definition (`tasks/screen-intent/prompt.ts`, …) whose `createPrompt(input)` builds the
   system + user prompt. `input.query` becomes the user message; `input.context` rides in
   metadata; the claude runner concatenates them for the `claude` CLI.

4. **`screen-intent` / `composition-planning` have NO skill/prompt-catalog knowledge docs.**
   `@cx/agent` knowledge ids are only: skill = `{component-proposal, quality-review,
   screen-generation, + 3 design-skill docs}`, prompt-catalog = `{component-proposal,
   quality-review, screen-generation}`. `knowledge("skill","screen-intent")` would throw.
   **Decision:** claude steps carry NO `references` in MVP (option A). Upstream data flows
   via `inputs` only. The `references` mechanism overlaps with @cx/agent's task-owned
   prompts and would be dead wiring here.

5. **`run-step.ts` currently ignores `prompt.id`.** It builds a `PromptPayload{messages}`
   by JSON-dumping inputs/references, so the adapter has no way to learn the taskKind.
   This is the one contract change (below).

## Decisions (confirmed)

- **`prompt.id` = `AgentTaskKind`, identity mapping.** The step declares `prompt:{id:"screen-generation"}`
  and the adapter uses it directly as the taskKind. Unknown kinds throw inside
  `@cx/agent` (`resolveTaskDefinition`). No mapping table lives in the generic engine.
- **`EngineRequest.prompt` becomes the ref `{ id }`** (was `PromptPayload{messages}`).
  `run-step.ts` passes `step.prompt` through verbatim.
- **claude steps have empty `references`** (finding 4).
- **Pipeline definition lives in the package** at `packages/inference/src/pipelines/`,
  as pure declaration. `apps/web` is a thin composition root that injects the concrete
  runner + functions.

## File Structure

```
packages/inference/src/
  contracts/
    engine.ts            # MODIFY: EngineRequest.prompt: PromptTemplateRef (was PromptPayload)
  pipeline/
    run-step.ts          # MODIFY: pass step.prompt ref through; drop messages JSON-dump
  engine/
    claude-engine.ts     # MODIFY: stub → adapter delegating to @cx/agent (takes AgentRuntime)
  worker/
    create-inference-runtime.ts  # MODIFY: accept pipelines[] + claudeRunner; wire claude engine
  pipelines/
    screen-generation-v1.ts      # CREATE: declarative 5-step definition

apps/web/src/server/
  inference-runtime.ts   # MODIFY: import screenGenerationPipelineV1, inject createClaudeRunner

scripts/
  check-inference-boundaries.mjs # MODIFY: add pipelines/** rules
```

## Component Designs

### Contract change — `EngineRequest.prompt`

```ts
// contracts/engine.ts
export type EngineRequest = {
  prompt?: PromptTemplateRef;   // was: PromptPayload { messages }
  run?: FunctionRef;
  inputs: Record<string, unknown>;
  references: Record<string, KnowledgeValue | KnowledgeValue[]>;
  outputContract: OutputContractValue;
};
```

`PromptPayload` is removed from the EngineRequest path. No engine consumed it before
(function ignores it, claude was a stub), so this is safe.

### `run-step.ts` change

```ts
// before:
const prompt = step.prompt
  ? { messages: [{ role: "user", content: JSON.stringify({ inputs, references }) }] }
  : undefined;
// after:
const prompt = step.prompt;   // pass the ref { id } through unchanged
```

`StepExecution.prompt` then persists the ref + (separately persisted) resolved
inputs/references as the step request record. The fully composed Claude prompt is owned
by `@cx/agent` and is not round-tripped into artifacts in MVP.

### `claude-engine.ts` adapter

```ts
import { runAgentTask, type AgentRuntime, type AgentTaskKind } from "@cx/agent";
import type { Engine } from "../contracts";

export function createClaudeEngine(agentRuntime: AgentRuntime): Engine {
  return {
    async execute({ prompt, inputs, references, outputContract }) {
      if (!prompt?.id) throw new Error("claude engine requires step.prompt.id (AgentTaskKind)");
      const result = await runAgentTask(agentRuntime, {
        taskKind: prompt.id as AgentTaskKind,
        input: {
          query: `Produce ${outputContract.data.dtoName} (${outputContract.id}) from the provided context.`,
          context: { inputs, references, jsonSchema: outputContract.data.jsonSchema },
        },
      });
      return { raw: result.payload };
    },
  };
}
```

### `screen-generation-v1.ts` — declarative pipeline

Pure declaration. `prompt.id` = taskKind, `output.contractRef` = schema id (distinct
identifiers). claude steps carry no `references`.

| step | engine | run.id / prompt.id | output contract | writeToContext |
|---|---|---|---|---|
| `01-source-spec` | function | `run:"source-spec-mvp"` | `source-spec` | `source-spec` |
| `02-screen-intent` | claude | `prompt:"screen-intent"` | `screen-intent` | `screen-intent` |
| `03-composition` | claude | `prompt:"composition-planning"` | `composition-plan` | `composition-plan` |
| `04-render-tree` | claude | `prompt:"screen-generation"` | `render-tree` | `render-tree` |
| `05-quality` | claude | `prompt:"quality-review"` | `quality-inspection` | `quality-inspection` |

Each claude step's `inputs` pull upstream results from context, e.g.
`02` reads `context("source-spec")`, `03` reads `context("screen-intent")`, etc.

```ts
export const screenGenerationPipelineV1 = definePipeline({
  id: "screen-generation",
  version: "v1",
  steps: [
    defineStep({
      id: "01-source-spec",
      engine: "function",
      inputs: { job: jobInput() },
      run: { id: "source-spec-mvp" },
      output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
    }),
    defineStep({
      id: "02-screen-intent",
      engine: "claude",
      inputs: { sourceSpec: context("source-spec") },
      prompt: { id: "screen-intent" },
      output: { contractRef: outputContractRef("screen-intent"), writeToContext: "screen-intent" },
    }),
    defineStep({
      id: "03-composition",
      engine: "claude",
      inputs: { sourceSpec: context("source-spec"), screenIntent: context("screen-intent") },
      prompt: { id: "composition-planning" },
      output: { contractRef: outputContractRef("composition-plan"), writeToContext: "composition-plan" },
    }),
    defineStep({
      id: "04-render-tree",
      engine: "claude",
      inputs: { compositionPlan: context("composition-plan"), screenIntent: context("screen-intent") },
      prompt: { id: "screen-generation" },
      output: { contractRef: outputContractRef("render-tree"), writeToContext: "render-tree" },
    }),
    defineStep({
      id: "05-quality",
      engine: "claude",
      inputs: { renderTree: context("render-tree"), compositionPlan: context("composition-plan") },
      prompt: { id: "quality-review" },
      output: { contractRef: outputContractRef("quality-inspection"), writeToContext: "quality-inspection" },
    }),
  ],
});
```

Forbidden in this file: `createClaudeRunner(...)`, `readFile(...)`, node-pipeline
adapters, `apps/*` import, `@cx/pipeline` import, `@cx/inference-nodes` import.

### `create-inference-runtime.ts` change

```ts
export function createInferenceRuntime(config: {
  pipelines?: InferencePipelineDefinition[];   // array → registry built internally
  dataRoot?: string;
  functions?: Record<string, InferenceFunction>;
  claudeRunner?: AgentRunner;                   // injected; wrapped via createAgentRuntime
  knowledgeBase?: KnowledgeBase;
  now?: () => string;
  newId?: () => string;
}): InferenceRuntime {
  // ...
  const agentRuntime = createAgentRuntime({ runner: config.claudeRunner });
  // engines: { function: createFunctionEngine(...), claude: createClaudeEngine(agentRuntime) }
  // pipelines: build registry from config.pipelines ?? []
}
```

Note: `claudeRunner` is an `AgentRunner` (what `createClaudeRunner` returns). The package
wraps it with `createAgentRuntime`. When no runner is given, `@cx/agent`'s default runner
throws `AgentRunnerNotConfiguredError` on use — claude steps fail loudly, the runtime
still constructs (so function-only pipelines and tests with an injected fake work).

### `apps/web/src/server/inference-runtime.ts` change

```ts
import { createClaudeRunner } from "@cx/agent";
import { createInferenceRuntime } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1"; // or package export

export const inferenceRuntime = createInferenceRuntime({
  dataRoot,
  pipelines: [screenGenerationPipelineV1],
  functions: { "source-spec-mvp": buildSourceSpec },
  claudeRunner: createClaudeRunner({ localFirst: true }),
});
```

`buildSourceSpec` stays in `apps/web` (app-level function impl). The pipeline definition
no longer lives here.

### Boundary checker (`check-inference-boundaries.mjs`)

Add rules:
- `packages/inference/src/pipeline/**` (generic authoring): may NOT import `../pipelines/**`.
- `packages/inference/src/pipelines/**` (declarative defs): may NOT import `@cx/pipeline`,
  `@cx/inference-nodes`, `apps/*`, or `node:fs`. May import the authoring helpers from
  `../pipeline` and `@cx/schema` ref helpers.
- Keep existing forbidden-import rules.

To avoid importing `AgentTaskKind` into the pipeline def, `prompt.id` stays a string
literal; the adapter performs the `as AgentTaskKind` cast at the @cx/inference→@cx/agent
boundary, where the dependency already exists.

## Error Handling

- Unknown `prompt.id` → `@cx/agent` `resolveTaskDefinition` throws → surfaces as a failed step.
- No `claudeRunner` configured + a claude step runs → `AgentRunnerNotConfiguredError`
  (this IS the @cx/agent-owned fallback for "Claude unavailable").
- Output fails its contract schema → existing `output_contract_validation_failed` path in
  `run-step.ts` (unchanged).

## Testing Strategy (TDD)

- **claude-engine adapter** — inject a fake `AgentRuntime` whose `run` returns a fixed
  `payload`. Assert: `prompt.id` flows through as `taskKind`; `context` carries
  inputs/references/jsonSchema; `result.payload` becomes `{ raw }`; missing `prompt.id`
  throws.
- **screen-generation-v1 definition** — assert the 5 steps register in order, each
  `output.contractRef` resolves, engine assignments are correct.
- **run-step** — assert `step.prompt` ref is passed to the engine unchanged (no messages).
- **end-to-end** — `createInferenceRuntime` with a fake runner that returns contract-valid
  payloads per taskKind → run the job → all 5 steps `succeeded`. Real `createClaudeRunner`
  is wired only in `apps/web` and is not exercised in tests.

## Out of Scope (future branches)

- Real prompt/skill knowledge docs for `screen-intent` / `composition-planning` in `@cx/agent`.
- Round-tripping the fully composed Claude prompt into step artifacts.
- `pattern-selection` / `screen-revision` stages.
