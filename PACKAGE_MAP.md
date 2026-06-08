# RND Screen Generator Package Map

## 1. Document Scope

This document tracks active package responsibilities, public surfaces, and package relationships.

Agent operation follows [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md), repository layout follows [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md), and screen inference execution architecture follows [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md).

Package-specific API examples belong in each `packages/*/README.md`. This document keeps only responsibility boundaries.

## 2. Target Screen Inference Relationship

```text
Client App
-> /api/inference
-> Job Store
-> Worker
-> @cx/inference worker
-> @cx/inference pipeline
-> Execution Engines
   -> @cx/agent Claude SDK adapter
   -> deterministic functions
-> Knowledge Base
   -> @cx/components catalog
   -> @cx/layout catalog
   -> @cx/agent prompt templates / skill docs
-> Job Store artifacts/events
-> @cx/renderer preview
```

The target architecture has five first-class boundaries, implemented first inside `@cx/inference`:

| Boundary | Package direction |
|---|---|
| Contracts | `@cx/inference` |
| Durable state | `@cx/inference` stores |
| Runtime execution | `@cx/inference` worker/pipeline |
| Screen-specific pipeline | `@cx/inference` pipeline |
| Claude execution | `@cx/agent` |

Product-facing screen inference routes use `/api/inference/*` only. Deprecated compatibility routes are not active.

## 3. Active And Target Packages

| Package | Status | Responsibility | Does Not Own |
|---|---|---|---|
| `@cx/schema` | Active | DTO/schema contracts for SourceSpec, RenderTree, validation, agent result artifacts | file IO, Claude execution, runtime orchestration, React render |
| `@cx/adapters` | Active | Pure conversion between external representations and internal contracts | IO, DB write, AI execution, validation policy, React/Puck UI |
| `@cx/renderer` | Active | RenderTree JSON -> React render runtime | generation, validation, table projection, AI execution |
| `@cx/agent` | Active | Claude Agent SDK local-first execution engine adapter and prompt assets | workflow orchestration, final output SSOT, persistence, render |
| `@cx/validation` | Active | Pure validation reports for schema/catalog/layout contracts | retry policy, stage transition, file write |
| `@cx/components` | Active | Component implementations, component catalog, component token aliases | workflow, foundation tokens, file approval |
| `@cx/layout` | Active | Screen chrome, layout primitives, layout pattern components, layout catalog/resolver | component catalog, generation workflow |
| `@cx/tokens` | Active | Foundation/semantic token SSOT and public CSS/Tailwind entrypoints | component alias tokens, workflow |
| `@cx/inference` | Active | Job/artifact stores, pipeline context, execution engines, pipeline definitions, worker, in-memory fakes | React render, catalog ownership |

## 4. Public Surface

| Package | Public subpath |
|---|---|
| `@cx/schema` | `.` |
| `@cx/adapters` | `.`, `./markdown`, `./table`, `./puck` |
| `@cx/renderer` | `.`, `./renderer` compatibility entrypoint |
| `@cx/agent` | `.`, `./adapters`, `./claude`, `./contract`, `./tasks` |
| `@cx/validation` | `.`, `./contract`, `./types` |
| `@cx/components` | `.`, `./catalog`, `./mutations`, `./resolver`, `./types`, CSS/token subpaths |
| `@cx/layout` | `.`, `./catalog`, `./chrome`, `./components`, `./contract`, `./mutations`, `./primitives`, `./resolver`, `./style`, `./types` |
| `@cx/tokens` | `.`, `./variables.css`, `./tailwind.css` |
| `@cx/inference` | `.`, `./testing`, `./pipelines/screen-generation-v1` |

External packages must not import `src/internal/*`, implementation directories, generated artifacts, or unpublished subpaths. `@cx/schema` remains root-export only.

## 5. Relationship Rules

- Browser-facing UI consumes only `/api/*` endpoints.
- API routes are thin adapters: create/read jobs, stream events, and call `@cx/inference` worker entrypoints.
- API routes do not own store logic, pipeline execution logic, prompt assembly, or worker state transitions.
- `@cx/inference` workers own pipeline execution and write job status, steps, artifacts, and events.
- `@cx/inference` stores must have file-backed MVP implementations and in-memory fake implementations for isolated worker tests.
- Inference events must include a per-job monotonic `seq`; SSE event id uses the same `seq`.
- `@cx/agent` owns Claude execution and prompt asset packaging, not workflow decisions.
- Knowledge base packages are read-only during a run.
- Pipeline Context is run-local working memory; inspectable results must be written as artifacts or events.
- Screen inference execution, state, event, artifact, and step orchestration logic belongs in `@cx/inference`.

## 6. Web Feature Boundary

`apps/web` is the product runtime app. Feature boundaries are tracked by surface, not by package-style fragmentation.

| Feature | Location | Responsibility | Does Not Own |
|---|---|---|---|
| Workbench shell | `components/App.tsx`, `components/layout/*`, `model/workbench-view-model.ts` | selected state, rail/tab/canvas/panel composition | DB fetch implementation, Puck conversion, RenderTree materialize rules |
| Screen DB facade | `lib/screen-db-loader.ts`, `lib/screen-db-save.ts`, `app/api/screens/*` | Supabase REST row read/write and screen tree API | React UI, Puck editor shape |
| Puck editor UI | `components/puck/*`, `@cx/adapters/puck` | Puck editor UI and RenderTree/Puck adapter consumption | DB row shape, Supabase calls |
| Screen inference API | `app/api/inference/*` | source upload/list, job creation, snapshot, artifact read, SSE, apply | pipeline internals, Claude implementation |

## 7. Migration Rule

The next implementation phase starts from [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md), not from the removed stage/runtime plan documents.

Implementation order:

1. Create `@cx/inference`.
2. Add local folder contract under `.data/inference-jobs/{jobId}`.
3. Add `JobStore`/`ArtifactStore` with file-backed and memory-backed implementations.
4. Add Pipeline Context and Pipeline Step format.
5. Add minimal Worker entrypoint.
6. Add thin `POST /api/inference` and `GET /api/inference/:jobId/events` routes.
7. Keep browser-facing screen inference calls on `/api/inference/*`; do not reintroduce compatibility routes.
