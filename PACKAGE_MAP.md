# RND Screen Generator Package Map

## 1. Document Scope

This document tracks active package responsibilities, public surfaces, and package relationships.

Agent operation follows [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md), repository layout follows [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md), and screen inference execution architecture follows [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md).

Package-specific API examples belong in each `packages/*/README.md`. This document keeps only responsibility boundaries.

## 2. Target Screen Inference Relationship

```text
Client App / Headless Client
-> /api/inference
-> Job Store
-> Worker
-> @cx/inference worker
-> @cx/inference pipeline
-> Execution Engines
   -> @cx/agent Claude SDK adapter
   -> deterministic functions
-> Knowledge Base
   -> @cx/external catalog (resolver read API)
   -> @cx/layout catalog (resolver read API)
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

Product-facing screen inference routes use `/api/inference/*` only. The same routes are the official headless screen-generation server surface; callers do not need to use the Web UI. Deprecated compatibility routes are not active.

## 3. Active And Target Packages

| Package | Status | Responsibility | Does Not Own |
|---|---|---|---|
| `@cx/schema` | Active | DTO/schema contracts for SourceSpec, RenderTree, validation, agent result artifacts | file IO, Claude execution, runtime orchestration, React render |
| `@cx/adapters` | Active | Pure conversion between external representations and internal contracts | IO, DB write, AI execution, validation policy, React/Puck UI |
| `@cx/renderer` | Active | RenderTree JSON -> React render runtime | generation, validation, table projection, AI execution |
| `@cx/agent` | Active | Claude Agent SDK local-first execution engine adapter and prompt assets | workflow orchestration, final output SSOT, persistence, render |
| `@cx/validation` | Active | Pure validation reports for schema/catalog/layout contracts | retry policy, stage transition, file write |
| `@cx/external` | Active | Vendored kiki component implementations, generated component catalog (`kiki.X`), resolver read API, renderer-private registry, alias canonicalization | catalog contract types (owned by `@cx/schema`), foundation tokens, runtime catalog mutation |
| `@cx/layout` | Active | Screen chrome, layout primitives, layout pattern components, generated layout catalog/registry, resolver read API, alias canonicalization | component catalog, generation workflow |
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
| `@cx/external` | `.`, `./catalog` (generated), `./registry` (renderer-private), `./resolver`, `./canonicalize`, `./puck` |
| `@cx/layout` | `.`, `./catalog` (generated), `./registry`, `./resolver`, `./canonicalize`, `./primitives`, `./chrome`, `./style`, `./types` |
| `@cx/tokens` | `.`, `./variables.css`, `./tailwind.css` |
| `@cx/inference` | `.`, `./testing`, `./pipelines/screen-generation-v1` |

External packages must not import `src/internal/*`, implementation directories, generated artifacts, or unpublished subpaths. `@cx/schema` remains root-export only.

`@cx/external` and `@cx/layout` share one external-thin scaffolding: a generated `catalog.generated.ts`, a generated `registry.generated.ts`, a hand-authored `catalog.alias.ts`, a `resolver.ts` (read-only catalog lookup API), and a `canonicalize-catalog.ts` (alias↔registry integrity + write-back helper). `catalog.generated` is sealed inside its owner package — no consumer imports it directly. Consumers see only two gates: the resolver (read API) and the registry (execution surface). The registry is renderer-private. Catalog contract types live in `@cx/schema`, not in the owner packages.

## 5. Relationship Rules

- Browser-facing UI consumes only `/api/*` endpoints.
- Headless generation clients also consume only `/api/inference/*`; they must not import `apps/web/src/server/*`, `@cx/inference`, or `@cx/agent` directly.
- API routes are thin adapters: create/read jobs, stream events, and call `@cx/inference` worker entrypoints.
- API routes do not own store logic, pipeline execution logic, prompt assembly, or worker state transitions.
- `@cx/inference` workers own pipeline execution and write job status, steps, artifacts, and events.
- `@cx/inference` stores must have file-backed MVP implementations and in-memory fake implementations for isolated worker tests.
- Inference events must include a per-job monotonic `seq`; SSE event id uses the same `seq`.
- `@cx/agent` owns Claude execution and prompt asset packaging, not workflow decisions.
- Knowledge base packages are read-only during a run.
- Catalog-owning packages (`@cx/external`, `@cx/layout`) expose metadata only through their `resolver` and execution only through their `registry`; no consumer reaches `catalog.generated` directly. `@cx/validation` and `@cx/renderer` read the same prop-contract through the same resolver, so "validation passed ⇒ renderable" holds by shared data, not by type coincidence.
- Node-type and region vocabulary has a single source in `@cx/schema` (`RENDER_TREE_NODE_TYPE`); `@cx/layout` and `@cx/renderer` re-expose it rather than hardcoding literals. Component catalog keys and `node.type` are namespaced `kiki.X`; the renderer strips the `kiki.` prefix to resolve a registry export (this is a prefix rule, not alias resolution).
- Alias resolution (input → canonical) is centralized at the persist boundary via `canonicalizeRenderTree` write-back (apply route, tree save, one-shot migration), so DB-loaded trees are always canonical and downstream matcher/validator/renderer see canonical only.
- Pipeline Context is run-local working memory; inspectable results must be written as artifacts or events.
- Screen inference execution, state, event, artifact, and step orchestration logic belongs in `@cx/inference`.

## 6. Web Feature Boundary

`apps/web` is the product runtime app and the current in-process screen-generation server. Feature boundaries are tracked by surface, not by package-style fragmentation.

| Feature | Location | Responsibility | Does Not Own |
|---|---|---|---|
| Workbench shell | `components/App.tsx`, `components/layout/*`, `model/workbench-view-model.ts` | selected state, rail/tab/canvas/panel composition | DB fetch implementation, Puck conversion, RenderTree materialize rules |
| Screen DB facade | `lib/screen-db-loader.ts`, `lib/screen-db-save.ts`, `app/api/screens/*` | Supabase REST row read/write and screen tree API | React UI, Puck editor shape |
| Puck editor UI | `components/puck/*`, `@cx/adapters/puck` | Puck editor UI and RenderTree/Puck adapter consumption | DB row shape, Supabase calls |
| Screen inference frontend | `feature/inference-new-screen/*` | new-screen upload/run/review UI, browser API client, UI-local run selection state | API route implementation, pipeline internals, Claude implementation |
| Screen inference API | `app/api/inference/*` | source upload/list, job creation, snapshot, artifact read, SSE, apply; official headless generation server surface | pipeline internals, Claude implementation, standalone server ownership |

## 7. Migration Rule

The next implementation phase starts from [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md), not from the removed stage/runtime plan documents.

Implementation order:

1. Create `@cx/inference`.
2. Add local folder contract under `.data/inference-jobs/{jobId}`.
3. Add `JobStore`/`ArtifactStore` with file-backed and memory-backed implementations.
4. Add Pipeline Context and Pipeline Step format.
5. Add minimal Worker entrypoint.
6. Add thin `POST /api/inference` and `GET /api/inference/:jobId/events` routes.
7. Keep browser-facing and headless screen inference calls on `/api/inference/*`; do not reintroduce compatibility routes or add a separate server app until deployment requirements force that split.
