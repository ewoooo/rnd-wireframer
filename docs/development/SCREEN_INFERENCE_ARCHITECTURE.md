# Screen Inference Architecture

## 1. Document Scope

This document is the SSOT for the new screen inference execution architecture.

It replaces the previous stage/runtime documents:

- `AGENT_RUNTIME_PROTOCOL.md`
- `PIPELINE_STAGE_PROTOCOL.md`
- `PIPELINE_STEP_REFERENCE_MANIFEST_PLAN.md`
- `INFERENCE_SERVICE_STRUCTURE.md`

Package responsibility still follows [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), and repository layout follows [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md). API route surface follows [API_ENDPOINTS.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/API_ENDPOINTS.md).

## 2. Target Architecture

```mermaid
flowchart TD
  Client["Client App"]
  POST["POST /api/inference"]
  SSE["GET /api/inference/:jobId/events"]

  JobStore["Job Store"]

  Worker["Worker<br/>(Pipeline Owner)"]

  Pipeline["Inference Pipeline"]

  KB["Knowledge Base<br/>(Long-term Memory)"]

  Context["Pipeline Context<br/>(Working Memory)"]

  Engines["Execution Engines<br/>(Claude / Functions)"]

  Client --> POST
  Client --> SSE

  POST -->|Create Job| JobStore

  JobStore -->|Queue Job| Worker

  Worker -->|Run Pipeline| Pipeline

  Pipeline -->|Read| KB

  Pipeline <--> Context

  Pipeline -->|Call| Engines
  Engines -->|Result| Pipeline

  Pipeline -->|Step Result| Worker

  Worker -->|Update Status / Steps / Events| JobStore

  SSE --> JobStore
```

Detailed structure:

```mermaid
flowchart LR

  %% =========================
  %% Client
  %% =========================

  Client["Client App"]

  subgraph API["API Endpoint"]
    POST["POST /api/inference"]
    SSE["GET /api/inference/:jobId/events<br/>GET /api/inference/:jobId/steps"]
  end

  Client -->|useInference()| POST
  Client -->|useInferenceStream()| SSE

  %% =========================
  %% Job Store
  %% =========================

  subgraph JobStore["Job Store"]
    IJ["Inference Jobs"]
    IS["Inference Steps"]
    IE["Screen Inference Events"]
  end

  POST -->|Create Job| JobStore
  SSE -->|SSE Route| JobStore

  %% =========================
  %% Worker
  %% =========================

  Worker["Worker<br/>(Pipeline Owner)"]

  JobStore -->|Queue Job| Worker
  Worker -->|Write Status / Step / Event| JobStore

  %% =========================
  %% Pipeline
  %% =========================

  subgraph Pipeline["Inference Pipeline"]

    subgraph Step1["Pipeline Step"]
      S1Schema["Output Contract Schema"]
      S1Prompt["Prompt"]
      S1Refs["References (JSON)"]
    end

    subgraph Step2["Pipeline Step"]
      S2Schema["Output Contract Schema"]
      S2Prompt["Prompt"]
      S2Refs["References (JSON)"]
    end

    subgraph Step3["Pipeline Step"]
      S3Schema["Output Contract Schema"]
      S3Prompt["Prompt"]
      S3Refs["References (JSON)"]
    end

  end

  Worker -->|Run Pipeline| Pipeline
  Pipeline -->|Return Results| Worker

  %% =========================
  %% Knowledge Base
  %% =========================

  subgraph KB["Knowledge Base (Long-term Memory)"]
    Skillset["Skillset"]
    ComponentCatalog["Component Catalog"]
    LayoutCatalog["Layout Catalog"]
    PromptTemplates["Prompt Templates"]
  end

  Pipeline -->|Read| KB

  %% =========================
  %% Pipeline Context
  %% =========================

  subgraph Context["Pipeline Context (Working Memory)"]
    Artifacts1["Created Artifacts"]
    LayoutPlans["Layout Plans"]
    ComponentMap["Component Map"]
    ScreenDatas["Screen Datas"]
  end

  Pipeline <--> |Read / Write| Context

  %% =========================
  %% Execution Engines
  %% =========================

  subgraph Engines["Execution Engines"]
    Claude["API Call<br/>(Claude SDK)"]
    Function["Function"]
  end

  Pipeline -->|Call| Engines
  Engines -->|Return Result| Pipeline
```

The model has five first-class boundaries:

| Boundary | Responsibility |
|---|---|
| API Endpoint | Browser-facing job creation and SSE stream |
| Job Store | Durable jobs, steps, events (the step's artifact **files** live in `ArtifactStore`, not here) |
| Worker | Owns one pipeline run and writes observable progress |
| Inference Pipeline | Declarative step sequence and step execution contract |
| Execution Engines | Claude SDK/API calls and deterministic functions |

Each boundary has one job, and it helps to name it in a single word:

| Boundary | Role |
|---|---|
| Inference Pipeline | **실행 로직** — what to do, declaratively |
| Worker | **오케스트레이터** — drives the run, writes progress |
| Execution Engine | **실행 도구** — the tool a step calls (Claude / function) |
| Pipeline Context | **Working Memory** — run-local scratch, read/written by steps |
| Job Store | **Observable State** — durable, what the UI/reviewer inspects |

`ArtifactStore` is the underlying file-IO primitive these stores build on, not a boundary itself.

Long-term knowledge is read-only during a run. Working memory is run-local and may be read/written by pipeline steps.

## 3. Package Direction

The current `@cx/inference-nodes` and screen-generation implementation under `@cx/pipeline` are deprecated for new work. They may stay temporarily as compatibility code until Web routes and smoke scripts are migrated.

MVP starts with one new package:

| Package | Responsibility |
|---|---|
| `@cx/inference` | Job/artifact stores, pipeline context, execution engines, pipeline definitions, worker, test fakes |
| `@cx/agent` | Claude Agent SDK local-first execution engine adapter; also owns skills as SSOT and exposes `resolveSkill(id) → { content, version, … }` |
| `@cx/schema` | SourceSpec, RenderTree, validation DTO/schema contracts |
| `@cx/validation` | Pure validation reports |
| `@cx/components`, `@cx/layout-pattern-store`, `@cx/tokens` | Knowledge base catalogs and design contracts |

`@cx/inference` internal modules:

```text
packages/inference/src/
  index.ts
  contracts/    Shared types/interfaces leaf — imported by every module, imports no sibling
  stores/       JobStore, ArtifactStore, FileJobStore, FileArtifactStore, in-memory test fakes
  context/      PipelineContext over ArtifactStore context files
  engine/       Claude/function execution engine adapter boundary
  pipeline/     pipeline and step definition/execution format
  worker/       runInferenceJob and worker orchestration
```

The full file-level scaffold, dependency rules, and build order are in §15.

`apps/web` API routes are thin adapters only. They create/read jobs, stream events, and call `@cx/inference` worker entrypoints. They do not own store logic, pipeline execution logic, prompt assembly, or worker state transitions. This keeps the worker testable with an in-memory fake store.

Compatibility packages:

| Package | Status | Rule |
|---|---|---|
| `@cx/inference-nodes` | Deprecated | Do not add new screen inference logic. Move reusable builders into `@cx/inference`. |
| `@cx/pipeline` screen-generation internals | Deprecated for new architecture | Keep existing consumers working during migration. New runtime concepts belong in `@cx/inference`. |

## 4. Local MVP Storage Contract

MVP storage is local file storage, not browser `localStorage`.

Default root:

```text
.data/
  inference-jobs/
    {jobId}/
      job.json
      events.ndjson
      steps/
        01-analyze/
          step.json
          inputs.json
          references.json
          prompt.json
          raw-response.json
          output.json
        02-plan-layout/
          step.json
          inputs.json
          references.json
          prompt.json
          raw-response.json
          output.json
      context/
        screen-analysis.json
        layout-plan.json
        component-map.json
```

Folder roles:

| Path | Role |
|---|---|
| `job.json` | Current job snapshot |
| `events.ndjson` | Append-only state change log |
| `steps/*/step.json` | Current step snapshot |
| `steps/*/inputs.json` | Resolved working-memory inputs the step read (prior outputs, context, job input) |
| `steps/*/references.json` | Resolved Knowledge Base reads as JSON envelopes (source + version + content snapshot) |
| `steps/*/prompt.json` | Final assembled prompt/messages structure sent to the engine |
| `steps/*/raw-response.json` | Raw execution engine result |
| `steps/*/output.json` | Normalized step output |
| `context/*.json` | Pipeline working memory read by later steps |

All step artifacts are JSON. A Knowledge Base SSOT may itself be Markdown (e.g. a skill `.md`), but the inference artifact wraps it in a JSON **envelope** and the Markdown text lives in a JSON string field. The envelope is a point-in-time **snapshot**, never the source of truth.

Step folder names may include order prefixes for debuggability. The stable step id is stored in `step.json`; code must not infer step identity only from the folder name.

## 5. Store Interfaces

Store dependency direction:

```text
Worker
  -> JobStore
  -> ContextStore
  -> ArtifactStore
  -> Engine

JobStore
  -> ArtifactStore

ContextStore
  -> ArtifactStore

ArtifactStore
  -> File System

Engine
  independent
```

`ArtifactStore` is the low-level file IO boundary. It owns job root calculation, path normalization/safety, and text/json read/write/append primitives.

`JobStore` and `ContextStore` must use `ArtifactStore` internally instead of touching the file system directly. This keeps path calculation in one place and lets worker tests replace file IO with memory-backed stores.

`Worker` may use `ArtifactStore` directly only for generic step artifacts such as `steps/01-analyze/inputs.json`, `references.json`, `prompt.json`, `raw-response.json`, and `output.json`. Job state and working memory must go through `JobStore` and `ContextStore`.

`JobStore` owns observable job state, step snapshots, and event logs.

```ts
interface JobStore {
	createJob(input: CreateJobInput): Promise<Job>;
	getJob(jobId: string): Promise<Job>;
	updateJob(jobId: string, patch: Partial<Job>): Promise<void>;

	createStep(jobId: string, stepId: string): Promise<void>;
	updateStep(jobId: string, stepId: string, patch: Partial<Step>): Promise<void>;

	appendEvent(jobId: string, event: InferenceEvent): Promise<void>;
	listEvents(jobId: string, after?: number): Promise<InferenceEvent[]>;
}
```

`ArtifactStore` owns file-like job artifacts and the append/read primitives the other stores build on.

```ts
interface ArtifactStore {
	writeText(jobId: string, path: string, content: string): Promise<void>;
	writeJson(jobId: string, path: string, value: unknown): Promise<void>;
	appendLine(jobId: string, path: string, content: string): Promise<void>; // appends one newline-terminated line (NDJSON)
	readText(jobId: string, path: string): Promise<string>;
	readJson<T>(jobId: string, path: string): Promise<T>;
	exists(jobId: string, path: string): Promise<boolean>;
}
```

`appendLine` backs the append-only `events.ndjson`; `readText` backs `listEvents` (read the ndjson file, parse lines, filter by `seq`). `JobStore.appendEvent`/`listEvents` are implemented on top of these two.

Job, step, and create-input shapes:

```ts
type JobStatus = "queued" | "running" | "succeeded" | "failed";

type Job = {
	jobId: string;
	pipelineId: string;
	pipelineVersion: string; // pinned at creation; survives newer registrations
	status: JobStatus;
	input: unknown; // job input payload (e.g. source spec reference)
	currentStepId?: string;
	error?: { code: string; message: string };
	createdAt: string;
	updatedAt: string;
};

type CreateJobInput = {
	pipelineId: string;
	pipelineVersion: string;
	input: unknown;
};

type StepStatus = "pending" | "running" | "succeeded" | "failed";

type Step = {
	stepId: string;
	status: StepStatus;
	startedAt?: string;
	completedAt?: string;
	error?: { code: string; message: string };
};
```

MVP implementations:

| Interface | File implementation (shipped, `index.ts`) | Test implementation (`@cx/inference/testing`) |
|---|---|---|
| `JobStore` | `FileJobStore` | `MemoryJobStore` |
| `ArtifactStore` | `FileArtifactStore` | `MemoryArtifactStore` |

The `Memory*` implementations live in `testing/` and are exported via the `@cx/inference/testing` subpath, kept out of the main `index.ts` (see §16).

## 6. Event Contract

Every line in `events.ndjson` is one `InferenceEvent`.

Each event must include a monotonic `seq` assigned by `JobStore.appendEvent(...)`.

```ts
type InferenceEventType =
	| "job_started"
	| "job_completed"
	| "job_failed"
	| "step_started"
	| "step_completed"
	| "step_failed";

type InferenceEvent = {
	seq: number;
	jobId: string;
	type: InferenceEventType;
	timestamp: string;
	stepId?: string; // required for step_* events
	payload?: unknown;
};
```

Rules:

- `type` is a closed union; new event kinds are added here, not invented as free strings at call sites.
- `seq` is monotonic per job.
- `listEvents(jobId, after)` returns events with `seq > after`.
- SSE event id uses the same `seq`.
- API routes and workers must not guess sequence numbers independently; the JobStore assigns them.

## 7. Runtime Flow

```text
Client App
-> POST /api/inference
-> Job Store creates inference job
-> Worker claims queued job
-> Worker runs @cx/inference pipeline
-> Pipeline step reads Knowledge Base references
-> Pipeline step reads/writes Pipeline Context
-> Pipeline step calls an Execution Engine
-> Worker writes step status, artifacts, and events to Job Store
-> Client receives progress through SSE and reads snapshots/artifacts through API
```

The worker is the pipeline owner. API routes do not run the pipeline inline except for local development fixtures explicitly marked as dev-only.

The worker entrypoint receives all collaborators by injection, which is what makes a run testable with in-memory fakes:

```ts
type WorkerDeps = {
	jobStore: JobStore;
	artifactStore: ArtifactStore;
	createContextStore: (jobId: string) => ContextStore; // one ContextStore per job
	engines: EngineRegistry;
	knowledgeBase: KnowledgeBase;
	pipelines: PipelineRegistry;
	now: () => string; // injected clock
	newId: () => string; // injected id generator
};

/**
 * The public handle the app passes back to runInferenceJob. Treat as opaque —
 * its internal shape (WorkerDeps) is a wiring detail, not part of the public API.
 * Built by createInferenceRuntime() in production, createTestRuntime() in tests.
 */
type InferenceRuntime = WorkerDeps;

declare function runInferenceJob(jobId: string, runtime: InferenceRuntime): Promise<void>;
```

> **Partially open:** the resolution *contract* is defined in §9.1 — each Knowledge source's owner exposes a resolver API and `knowledgeBase` wraps the result in a `ReferenceEnvelope`. What remains deferred is the **per-source resolver detail** (the exact API and payload for each catalog/skillset as it is wired). `KnowledgeBase` stays a named boundary in `WorkerDeps` until those are filled in.

MVP execution model (no queue yet — `Queue Job` in the diagram is aspirational):

- `POST /api/inference` creates the job, then starts `runInferenceJob(jobId, runtime)` in-process **fire-and-forget** and returns `jobId` immediately.
- `GET /api/inference/:jobId/events` streams by **tailing** `events.ndjson`: poll `listEvents(jobId, after = lastSeq)` on an interval, emit each new event as an SSE message whose id is its `seq`, and resume from `Last-Event-ID` on reconnect.
- This assumes a single local node process. A real queue/claim and a separate worker process are deferred until after the MVP slice; deploying to a serverless runtime (where background work is killed after the response) will require that worker process.

## 8. Pipeline Context

Pipeline Context is a typed facade over `ArtifactStore` paths under `context/`.

It should provide stable helper methods for common working-memory artifacts instead of scattering string paths through step code.

Examples:

```ts
interface ContextStore {
	writeJson(key: string, value: unknown): Promise<void>;
	readJson<T>(key: string): Promise<T>; // throws if the key is missing
	tryReadJson<T>(key: string): Promise<T | null>; // null if the key is missing
}
```

```ts
await context.writeJson("screen-analysis", analysis);
const analysis = await context.readJson<ScreenAnalysis>("screen-analysis");
```

`ContextStore` is constructed per job and maps each key to `context/{key}.json` through `ArtifactStore`. The initial MVP can map keys directly with no extra schema layer.

## 9. Pipeline Step & Engine Contract

### 9.1 Step definition

Each pipeline step is data plus one execution target. A step reads from exactly two memory buckets, and they are kept as two separate **named maps** on purpose:

- `inputs` → this run's **working memory** (run-local): job input, prior step outputs, Pipeline Context keys, artifacts. These live for one run.
- `references` → the **Knowledge Base** (long-term): catalogs and skillsets that outlive any run and are read-only.

Both are named maps (`Record<string, …>`), never unnamed arrays — the developer's chosen key is how the resolved value is addressed in the prompt and on disk.

```ts
type InferenceStepDefinition = {
	id: string;
	engine: "claude" | "function";
	inputs?: Record<string, StepInputRef>;     // working memory (run-local)
	references?: Record<string, KnowledgeRef>;  // Knowledge Base (long-term)
	prompt?: PromptTemplateRef; // when engine === "claude"
	run?: FunctionRef;          // when engine === "function"
	output: OutputContract;
};

type StepInputRef =
	| { kind: "job-input"; path?: string }
	| { kind: "step-output"; stepId: string; outputName?: string }
	| { kind: "context"; key: string }
	| { kind: "artifact"; path: string }
	| { kind: "value"; value: unknown };

type KnowledgeRef = {
	source: "component-catalog" | "layout-catalog" | "skillset";
	id?: string;
	version?: string;
};

type PromptTemplateRef = { id: string; version?: string };

type FunctionRef = { id: string };

type OutputContract = {
	schema: JsonSchema;
	schemaVersion: string;
	writeToContext?: string; // also persist normalized output to context/{key}.json
};
```

Step contents:

| Field | Meaning |
|---|---|
| `id` | Stable step id stored in job events and step snapshots |
| `engine` | Execution engine dispatch key |
| `inputs` | Working-memory refs: job input, previous step outputs, Pipeline Context keys, artifacts |
| `references` | Read-only Knowledge Base refs such as skillset, component catalog, layout catalog |
| `prompt` | Prompt template reference when the step uses Claude |
| `run` | Function reference when the step is deterministic |
| `output` | Output schema/contract expected from the step |

The two resolved buckets are snapshotted to **two separate JSON files**, both keyed by the developer's declared ref name, so a step replays from its folder alone:

- `inputs.json` — resolved working memory (prior step outputs, context, job input). Plain resolved values.
- `references.json` — resolved Knowledge Base reads, each as a **JSON envelope** that records *which SSOT was read, at what version, and the content snapshot*.

```json
// inputs.json
{ "composition": { "…": "resolved working-memory value" } }
```

```json
// references.json — one envelope (or array of envelopes) per declared reference name
{
  "patternSkill": [
    {
      "id": "screen-composition",
      "source": "@cx/agent",
      "sourceRef": "skills/screen-composition",
      "format": "markdown",
      "version": "v0.1",
      "content": "# Screen Composition\n…"
    }
  ],
  "componentCatalog": {
    "id": "component-catalog",
    "source": "@cx/components",
    "sourceRef": "catalog",
    "format": "json",
    "version": "v1",
    "data": []
  }
}
```

```ts
type ReferenceEnvelope =
	| { id: string; source: string; sourceRef: string; format: "markdown"; version?: string; content: string }
	| { id: string; source: string; sourceRef: string; format: "json"; version?: string; data: unknown };
```

| Envelope field | Meaning |
|---|---|
| `id` | Stable id of the referenced item within its source |
| `source` | The SSOT owner package, e.g. `@cx/agent`, `@cx/components` |
| `sourceRef` | Logical ref inside the source (e.g. `skills/screen-composition`) — **not** a file path |
| `format` | `markdown` → text in `content`; `json` → structured payload in `data` |
| `version` | Version of the SSOT at resolution time, for later drift tracking |
| `content` / `data` | The point-in-time **snapshot**; the SSOT itself stays in the owner package |

**Resolution boundary.** `@cx/inference` never reads an owner's files directly (e.g. it must not open `packages/agent/**/*.md`). Each source owner exposes a resolver API — e.g. `@cx/agent` provides `resolveSkill(id) → { content, version, … }` — and the Knowledge resolver calls it, then wraps the result in a `ReferenceEnvelope`. This keeps the skill SSOT in `@cx/agent` (read-only from `@cx/inference`), records exactly what each job used so old jobs stay traceable even after the SSOT changes, and makes runs replayable. This partially settles the deferred item in §7: the resolution *contract* is "owner resolver API → envelope"; the per-source resolver details remain to be filled in as each Knowledge source is wired.

**Least-context principle.** A step receives only the refs it names — never the accumulated working memory. There is deliberately no wildcard or "all context" input: every working-memory read is by explicit key, every knowledge read by explicit source. Working memory (`context/*.json`) and step outputs grow on disk for replay and audit, but what a step loads into its prompt is bounded by its declared `inputs`/`references`. The declaration is the prompt's upper bound, so disk state can accumulate while prompts stay lean.

Declare the minimum a step actually needs — usually the immediately-relevant prior output plus the specific knowledge for that decision. For example, a pattern-selection step needs the previous composition output, the layout catalog, and the pattern skill — not the original source:

```ts
const selectPatternStep = defineStep({
	id: "select-pattern",
	engine: "claude",
	inputs: {
		composition: stepOutput("plan-composition", "result"),
	},
	references: {
		layoutCatalog: { source: "layout-catalog" },
		patternSkill: { source: "skillset", id: "pattern-selection" },
	},
	output: { /* … */ },
});
```

Step definitions own only their contract and required references. They do not own persistence, queueing, API response shape, or UI state.

### 9.2 Defining and selecting pipelines

The surface a developer actually edits is small: compose a step, order steps into a pipeline, register the pipeline.

```ts
const analyzeStep = defineStep({ id: "analyze", engine: "claude", /* … */ });

const screenGenerationPipeline = definePipeline({
	id: "screen-generation",
	version: "v1",
	steps: [analyzeStep, planLayoutStep /* … */], // execution order
});

const pipelineRegistry = createPipelineRegistry();
pipelineRegistry.register(screenGenerationPipeline);
```

```ts
type PipelineDefinition = {
	id: string;
	version: string; // pipelines evolve: screen-generation v1, v2, …
	steps: InferenceStepDefinition[]; // ordered
};

interface PipelineRegistry {
	register(pipeline: PipelineDefinition): void;
	get(pipelineId: string, pipelineVersion: string): PipelineDefinition; // throws if unknown
}

declare function createPipelineRegistry(): PipelineRegistry; // factory, not a global singleton
```

A pipeline is identified by `(id, version)`. The registry keys each definition under `${id}@${version}`, so `screen-generation@v1` and `screen-generation@v2` coexist. A job records both `pipelineId` and `pipelineVersion` (see §5), and the worker resolves the exact definition via `pipelineRegistry.get(job.pipelineId, job.pipelineVersion)`. Pinning the version on the job means an in-flight job keeps running the definition it started with even after a newer version is registered.

MVP ships one pipeline (`screen-generation@v1`) with a single fake step, but the container, version, and registry exist from the start so adding a pipeline or a version never requires touching the worker.

### 9.3 Execution Engine contract

`@cx/inference/engine` defines a small engine boundary. The worker is injected with a registry keyed by the step's `engine` field, so steps never reach an SDK directly and tests substitute a fake executor.

```ts
type PromptPayload = {
	messages: Array<{ role: string; content: string }>; // assembled prompt/messages structure
};

type EngineRequest = {
	prompt?: PromptPayload; // assembled messages (claude) — persisted verbatim as prompt.json
	run?: FunctionRef; // function dispatch (function)
	inputs: Record<string, unknown>; // resolved working memory (run-local)
	references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]>; // resolved Knowledge Base envelopes
};

type EngineResult = { raw: unknown };

interface Engine {
	execute(request: EngineRequest): Promise<EngineResult>;
}

type EngineRegistry = Record<"claude" | "function", Engine>;
```

The `claude` engine delegates to `@cx/agent` (Claude Agent SDK, local-first with fallback policy). The `function` engine runs a registered deterministic function by `FunctionRef.id`. `runStep` resolves `inputs`/`references` → assembles the `PromptPayload` → calls the engine (raw) → validates `raw` against `output.schema` → **returns** a `StepExecution`. It does not write files; the worker persists `inputs.json`/`references.json`/`prompt.json`/`raw-response.json`/`output.json` and applies any `writeToContext` (see §15.4).

Contract validation reuses the repo's existing JSON Schema validation (`@cx/validation`) rather than a new validator. A step whose raw result fails `output.schema` is marked `failed` and emits a failure event; it does not silently coerce.

## 10. Memory Model

| Memory | Lifetime | Examples | Rule |
|---|---|---|---|
| Knowledge Base | Long-term | skillset, component catalog, layout catalog, prompt templates | Read-only during a run |
| Pipeline Context | One run | created artifacts, layout plans, screen data | Read/write by steps through runtime APIs |
| Job Store | Durable observable state | jobs, steps, events | Written by worker/runtime only |

Pipeline Context is working memory, not the audit log. Anything the UI or reviewer must inspect is written to Job Store as an event, or to the step's artifact files via `ArtifactStore`.

## 11. API Surface

Target product-facing endpoints:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/inference` | Create a screen inference job |
| `GET` | `/api/inference/:jobId` | Read job snapshot |
| `GET` | `/api/inference/:jobId/steps` | Read step snapshots |
| `GET` | `/api/inference/:jobId/events` | SSE event stream |
| `GET` | `/api/inference/:jobId/artifacts/:artifactName` | Read allowed artifact |

Existing `/api/screen-inference/*` routes remain compatibility routes until the Web client migration is complete.

MVP starts with these API routes:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/inference` | Create a job, start worker, return `jobId` |
| `GET` | `/api/inference/:jobId/events` | Stream `events.ndjson` as SSE using event `seq` |

These routes are thin adapters over `@cx/inference`.

The other target endpoints are **deliberately out of MVP scope**: `GET /:jobId` (job snapshot), `GET /:jobId/steps` (step snapshots), and `GET /:jobId/artifacts/:artifactName`. SSE events carry enough progress for the first slice; the snapshot/steps/artifact reads land once a UI needs them.

## 12. Implementation Order

The goal of the first pass is **one vertical slice**: a single fake step that leaves a complete folder record and streams out over SSE. Bottom (persistence) to top (API).

1. Define local folder contract and folder roles.
2. Add `@cx/inference` package.
3. Implement `ArtifactStore` with `FileArtifactStore` and `MemoryArtifactStore` (incl. `appendLine`/`readText`).
4. Implement `JobStore` with `FileJobStore` and `MemoryJobStore`, built on `ArtifactStore` (`appendEvent` assigns monotonic `seq`).
5. Implement `ContextStore` over `ArtifactStore`.
6. Fix the Pipeline Step format; implement `defineStep`/`definePipeline`/`pipelineRegistry` and `runStep` with required per-step artifact files, tested against a **fake engine**.
7. Implement the Engine boundary: `Engine` interface + `EngineRegistry`; `function` engine first, `claude` engine delegating to `@cx/agent`.
8. Implement minimal Worker entrypoint `runInferenceJob(jobId, deps)` driving a one-step pipeline end-to-end against in-memory fakes.
9. Add thin `POST /api/inference` (create job, fire-and-forget worker, return `jobId`) and `GET /api/inference/:jobId/events` (tail `events.ndjson` as SSE by `seq`) routes.

## 13. Migration Rules

- Do not add new inference behavior to `@cx/inference-nodes`.
- Do not add new screen inference runtime concepts to `@cx/pipeline`.
- New contracts, stores, context, engines, pipeline, and worker code start in `@cx/inference`.
- Existing Web routes may call compatibility adapters during migration, but browser-facing UI still consumes only `/api/*`.
- Claude local-first execution remains in `@cx/agent`; fallback policy is exposed as execution engine configuration.
- `@cx/inference` resolves Knowledge only through each owner's resolver API (e.g. `@cx/agent.resolveSkill(id)`); it must never read another package's source files directly (no `packages/agent/**/*.md` reads). All step artifacts are JSON, and any Markdown SSOT is snapshotted into a `ReferenceEnvelope.content` string — a snapshot, never the SSOT.

## 14. Completion Criteria

- `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, and `API_ENDPOINTS.md` point to this document for screen inference architecture.
- Deprecated packages are marked clearly before replacement packages are introduced.
- `@cx/inference` can be created without importing current `@cx/pipeline` screen-generation internals.
- Job, step, artifact, and event shapes are stable enough for Web UI and worker implementation.

## 15. Scaffold, Dependency Rules, and Build Order

### 15.1 File scaffold

```text
packages/inference/
  package.json
  tsconfig.json
  src/
    index.ts                     # public surface: defineStep, definePipeline, pipelineRegistry,
                                 #   runInferenceJob, store factories, contract types
    contracts/
      index.ts
      ids.ts                     # JobStatus, StepStatus, InferenceEventType
      job.ts                     # Job, Step, CreateJobInput, InferenceEvent
      step.ts                    # StepInputRef, KnowledgeRef, OutputContract,
                                 #   PromptTemplateRef, FunctionRef, InferenceStepDefinition
      pipeline.ts                # PipelineDefinition
      engine.ts                  # EngineRequest, EngineResult, Engine, EngineRegistry
      stores.ts                  # ArtifactStore, JobStore, ContextStore interfaces
      worker.ts                  # WorkerDeps (internal), InferenceRuntime (public), StepRunContext, StepExecution
    stores/
      file-artifact-store.ts     # FileArtifactStore (path calc, append/read primitives)
      file-job-store.ts          # FileJobStore over an ArtifactStore
      index.ts
    context/
      context-store.ts           # createContextStore(jobId, artifactStore): ContextStore
      index.ts
    pipeline/
      define-step.ts             # defineStep()
      define-pipeline.ts         # definePipeline()
      registry.ts                # createPipelineRegistry() (register/get by id@version)
      run-step.ts                # runStep() — executes ONE step
      index.ts
    engine/
      function-engine.ts         # deterministic FunctionRef dispatch
      claude-engine.ts           # delegates to @cx/agent
      index.ts
    worker/
      run-inference-job.ts       # runInferenceJob() — the Worker
      index.ts
    testing/                     # exported as the @cx/inference/testing subpath
      memory-artifact-store.ts   # MemoryArtifactStore (build first — tests need it)
      memory-job-store.ts        # MemoryJobStore (seq assignment)
      fake-engine.ts             # createFakeEngine({ respond }) — programmable test engine
      test-runtime.ts            # createTestRuntime() — InferenceRuntime wired from the fakes
      index.ts
    __tests__/
      *.test.ts                  # per-module tests + store contract suites (import from ../testing)
```

The `Memory*` stores, the fake engine, and `createTestRuntime` live in `testing/` and are exported as a **separate `@cx/inference/testing` subpath** (mirroring the existing `pipeline/src/testing` precedent). They stay out of the main `index.ts` so production code never imports them, but `apps/web` route tests and any downstream consumer can import a memory-backed runtime from the subpath. Production still uses the `File*` stores via `createInferenceRuntime`.

`apps/web/src/app/api/inference/...` route handlers are thin adapters and live in the app, not the package.

### 15.2 Dependency rules

The package is a dependency-injection design. One leaf holds the vocabulary; concrete wiring happens once.

1. **`contracts/` is the leaf.** It contains only types/interfaces. It imports nothing from sibling modules. Every other module may import types from it freely.
2. **Cross-module collaboration is by injected interface, not by importing another module's implementation.** `FileJobStore` is constructed with an `ArtifactStore`; `createContextStore` receives an `ArtifactStore`; `runStep` receives an `EngineRegistry` and resolver functions; `runInferenceJob` receives everything via `WorkerDeps`. A module depends on the *interface* (in `contracts/`), never the concrete sibling.
3. **Wiring happens only at the composition roots.** Assembling concrete stores + engines + registry into a runtime happens in `worker/` (`createInferenceRuntime`) and `testing/` (`createTestRuntime`) — nowhere else. Steps, stores, and engines never new-up each other.
4. **Allowed runtime edges:** `worker/` and `testing/` → `pipeline/`, `engine/`, `context/`, `stores/`. `stores/`, `context/`, `engine/`, `pipeline/` → `contracts/` only (plus `engine/claude-engine` → `@cx/agent`, file impls → `node:fs`).
5. **Forbidden:** any import cycle; `stores/`/`engine/`/`pipeline/` importing `worker/` or `testing/`; importing current `@cx/pipeline` screen-generation internals or `@cx/inference-nodes`.

This is what keeps a single step and the worker testable with `Memory*` stores and a fake `Engine` — no module reaches past its injected interfaces.

### 15.3 First files to create (order)

Bottom-up so each file is testable the moment it lands:

1. `contracts/*` — the whole type vocabulary. Everything below imports from here.
2. `testing/memory-artifact-store.ts` + contract test → `stores/file-artifact-store.ts` (incl. `appendLine`/`readText`), run the same contract suite against it.
3. `testing/memory-job-store.ts` (monotonic `seq` in `appendEvent`) + contract test → `stores/file-job-store.ts` over `ArtifactStore`.
4. `context/context-store.ts` (`createContextStore` over `ArtifactStore`, incl. `tryReadJson`).
5. `pipeline/define-step.ts`, `define-pipeline.ts`, `registry.ts` — declarative surface, no execution yet.
6. `pipeline/run-step.ts` + `testing/fake-engine.ts` → this is where per-step testing finally exists.
7. `engine/function-engine.ts` → `engine/claude-engine.ts`.
8. `worker/run-inference-job.ts` — wire one fake-step pipeline end-to-end against `Memory*` stores.
9. `index.ts` exports (restricted public surface — see §15.5).
10. `apps/web` `POST /api/inference` — create job, fire-and-forget worker, return `jobId`.
11. `apps/web` `GET /api/inference/:jobId/events` — **SSE route**, last. Tail `events.ndjson` by `seq` with `Last-Event-ID` resume. This is the piece that makes the vertical slice observable end-to-end.

### 15.4 `runStep` vs `runInferenceJob`

These are two distinct altitudes and must not blur. `runStep` executes **one** step's contract; `runInferenceJob` (the Worker) orchestrates the **whole** job. The Engine sits below both as the raw tool.

```ts
// pipeline/run-step.ts — executes ONE step
type StepRunContext = {
	resolveInput: (ref: StepInputRef) => Promise<unknown>; // working memory
	resolveReference: (ref: KnowledgeRef) => Promise<unknown>; // Knowledge Base
	engines: EngineRegistry;
};

type StepExecution = {
	status: "succeeded" | "failed";
	inputs: Record<string, unknown>; // resolved working memory → inputs.json
	references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]>; // resolved knowledge → references.json
	prompt?: PromptPayload; // assembled messages → prompt.json
	raw: unknown; // engine raw result → raw-response.json
	output?: unknown; // normalized, contract-valid → output.json
	contextWrites?: Record<string, unknown>; // from output.writeToContext
	error?: { code: string; message: string };
};

declare function runStep(step: InferenceStepDefinition, ctx: StepRunContext): Promise<StepExecution>;

// worker/run-inference-job.ts — orchestrates the whole job
declare function runInferenceJob(jobId: string, runtime: InferenceRuntime): Promise<void>;
```

| Concern | `runStep` (step 실행기) | `runInferenceJob` (오케스트레이터) |
|---|---|---|
| Scope | One step | One whole job |
| Resolve `inputs`/`references` | Yes (via injected resolvers) | Builds the resolvers and binds them to this job's stores |
| Render prompt, call Engine, validate against `output.schema` | Yes | No |
| Decide step order / which step is next | No | Yes |
| Persist artifact files (`inputs.json`, `references.json`, `prompt.json`, `raw-response.json`, `output.json`) | No — returns them in `StepExecution` | Yes — writes via `ArtifactStore` |
| Apply `writeToContext` | No — reports `contextWrites` | Yes — writes via `ContextStore` |
| Job/step status transitions | No | Yes — via `JobStore` |
| Emit events with `seq` | No | Yes — via `JobStore.appendEvent` |
| Retry / error handling | Returns `status: "failed"`, never retries | Owns it: decide retry vs. mark job `failed` + emit `job_failed` + halt |
| Clock / id generation | No | Yes — injected `now`/`newId` |

Stated as the two responsibility lists:

- **`runStep`** — inputs resolve · knowledge resolve · prompt render · engine call · schema validate · output return.
- **`runInferenceJob`** — job status update · step status update · artifact write · context write · event append · retry/error handling.

So `runStep` is pure-by-injection: given resolvers and an engine registry it returns *what happened and what to persist*, touching no store and no lifecycle. `runInferenceJob` owns all writes, ordering, events, retry, and error propagation, calling `runStep` once per step. This is the same three-tier split as the role table in §2: **Engine = 실행 도구, `runStep` = step 실행, `runInferenceJob` = 오케스트레이터.**

Retry is structurally the orchestrator's concern, not the step's. The MVP may start with halt-on-error only; when retry lands, it lands in `runInferenceJob`, and `runStep` stays unaware of it (it just re-runs cleanly because it holds no state).

### 15.5 Public surface (`index.ts`)

The package exports a deliberately small surface. Stores, engines, `runStep`, resolvers, and all `File*`/`Memory*` implementations stay internal.

```ts
export type {
	Job,
	Step,
	InferenceEvent,
	PipelineDefinition,
	InferenceStepDefinition,
	Engine,
	InferenceRuntime, // opaque handle returned by createInferenceRuntime
} from "./contracts";

export {
	defineStep,
	definePipeline,
	createPipelineRegistry,
	// step-authoring helpers — keep step definitions readable
	jobInput,
	stepOutput,
	context,
	artifact,
	value,
	knowledge,
} from "./pipeline";

export {
	createInferenceRuntime, // composition root: wires file stores + engines + registry → InferenceRuntime
	runInferenceJob,
} from "./worker";
```

- **`createInferenceRuntime(config): InferenceRuntime`** is the only way the app obtains a wired runtime, and **`runInferenceJob(jobId, runtime)`** consumes it. The app treats `InferenceRuntime` as opaque — it never sees `WorkerDeps`, `stores/`, or `engine/`. Tests build a runtime from `Memory*` stores + a fake engine via `createTestRuntime()` instead (see §16).
- **Step-authoring helpers** (`jobInput`/`stepOutput`/`context`/`artifact`/`value` for `inputs`, `knowledge` for `references`) produce the `StepInputRef`/`KnowledgeRef` literals so step definitions read as data, not hand-written discriminated unions.
- **A separate `@cx/inference/testing` subpath** exports `MemoryArtifactStore`, `MemoryJobStore`, `createFakeEngine`, and `createTestRuntime`. It is test-only, kept out of the main `index.ts`, and is what `apps/web` route tests and downstream consumers import to run against a memory-backed runtime (see §16.1).

### 15.6 Structurally enforced invariants

Three invariants are not just conventions — they are enforced so a violating import fails `pnpm lint`:

| Invariant | Structural mechanism |
|---|---|
| **Pipeline doesn't know JobStore** | `pipeline/` may import only `contracts/`. `runStep` receives `resolveInput`/`resolveReference`/`engines` — never a `JobStore`/`ContextStore` instance. A step cannot read or write job state. |
| **Engine doesn't know Context** | `engine/` may import only `contracts/` (+`@cx/agent` in `claude-engine`). `EngineRequest` carries already-resolved plain `inputs`/`references` data, not a `ContextStore` handle. An engine cannot reach working memory. |
| **Only the composition roots orchestrate** | `worker/` and `testing/` are the only modules allowed to import `stores/`, `context/`, `engine/`, and `pipeline/` together. No other module imports across boundaries; wiring lives only in these two roots. |

Enforcement follows the repo's existing pattern — Biome plus a custom AST check run inside `lint` (mirroring `scripts/check-react-hooks-policy.mjs`):

- Add Biome `noRestrictedImports` per-directory rules for the obvious forbidden paths.
- Add `scripts/check-inference-boundaries.mjs` (wired into the `lint` script) that walks `packages/inference/src/**` and fails on: `pipeline/`,`engine/`,`stores/`,`context/` importing `worker/` or `testing/`; `pipeline/` importing `stores/`|`context/`; `engine/` importing `context/`|`stores/`|`pipeline/`; any module importing `@cx/pipeline` screen-generation internals or `@cx/inference-nodes`; and any import cycle.

The payoff: the testability goal holds by construction — a step and the worker are testable with `Memory*` stores and a fake `Engine` because no module can reach past its injected interfaces even by accident.

## 16. Test Strategy

Runner is **Vitest** (`vitest run`, root `vitest.config.ts`, `describe/expect/it`), matching the rest of the repo. Development is **test-driven**: for each file in the §15.3 order, the failing test is written first, then the implementation makes it green.

### 16.1 Fakes location

All test doubles live in `packages/inference/src/testing/` and are exported via the **`@cx/inference/testing` subpath** (mirroring the existing `packages/pipeline/src/testing/` precedent). This keeps them out of the main `index.ts` while letting `apps/web` route tests and downstream consumers import a memory-backed runtime:

- `MemoryArtifactStore`, `MemoryJobStore` — `Map`-backed, expose their internal map for assertions (e.g. `{ store, files }`), same idea as `createMemoryFileSystemAdapter`.
- `createFakeEngine({ respond })` — programmable engine; each test controls the `raw` it returns and can inspect `lastRequest`.
- `createTestRuntime()` — assembles an `InferenceRuntime` from the fakes (the test-side analogue of `createInferenceRuntime`).

### 16.2 Shared contract tests for stores

Each store interface has one contract suite, run against **both** implementations. This proves the `Memory*` fake behaves identically to the shipped `File*` impl, which is what makes every Memory-backed test trustworthy.

```ts
export function artifactStoreContract(make: () => ArtifactStore) {
  describe("ArtifactStore contract", () => {
    it("writeText/readText roundtrip", async () => { /* … */ });
    it("appendLine appends ndjson lines in order", async () => { /* … */ });
    it("readJson throws on missing; exists reflects writes", async () => { /* … */ });
    it("scopes paths under the jobId root (rejects ../ escape)", async () => { /* … */ });
  });
}
artifactStoreContract(() => new MemoryArtifactStore());
artifactStoreContract(() => new FileArtifactStore(makeTmpRoot()));
```

The `JobStore` contract suite additionally asserts: `appendEvent` assigns a **monotonic `seq`**, `listEvents(after)` returns only `seq > after`, and events round-trip as `events.ndjson` lines.

### 16.3 Test pyramid (1:1 with the §15.3 build order)

| Level | Target | Key assertions |
|---|---|---|
| L1 | `ArtifactStore` (Memory + File, shared suite) | roundtrip, `appendLine` order, path scoping |
| L1 | `JobStore` (Memory + File, shared suite) | CRUD, **monotonic `seq`**, `listEvents(after)` |
| L1 | `ContextStore` | `writeJson`/`readJson`, `tryReadJson` → `null` when missing |
| L2 | `defineStep`/`definePipeline`/`createPipelineRegistry` | shapes; `get(id, version)`; throws on unknown; v1/v2 coexist |
| **L3** | **`runStep`** | fake engine + stub resolvers: resolve → render → engine call → **schema validate (fail ⇒ `status:"failed"`, no coercion)** → returns `StepExecution`. **Zero IO.** |
| L4 | `runInferenceJob` (slice) | Memory + fake, 1-step pipeline: status transitions, **event order + `seq`**, 5 artifact files written, `writeToContext` applied, failure ⇒ halt + `job_failed` |
| L5 | engines | `function-engine` dispatch; `claude-engine` delegates to a mocked `@cx/agent` |
| L6 | API routes | `POST` ⇒ job created + `jobId` returned; SSE ⇒ events streamed by `seq` with `Last-Event-ID` resume |

### 16.4 Slice-1 acceptance test (definition of done)

A fake single-step pipeline driven through `runInferenceJob` must produce:

- `job.json` with `status: "succeeded"`
- `events.ndjson` = `[job_started, step_started, step_completed, job_completed]` with `seq` `1,2,3,4`
- `steps/01-<id>/` containing all six JSON files (`step.json`, `inputs.json`, `references.json`, `prompt.json`, `raw-response.json`, `output.json`)
- an SSE consumer receiving those four events in order

When this passes, vertical slice 1 is complete.
