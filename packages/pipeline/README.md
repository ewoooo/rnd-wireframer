# @cx/pipeline

`@cx/pipeline` is the compatibility runtime for the current `screen-generation` flow.

The target screen inference architecture is [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md). New inference runtime concepts should go to `@cx/inference`.

## Current Responsibility

- Run the existing `screen-generation` compatibility pipeline.
- Read source artifacts through approved adapters.
- Write versioned artifacts, run logs, status, and events.
- Execute approved side effect commands.
- Bridge current `@cx/inference-nodes`, `@cx/agent`, and `@cx/validation` code while migration is in progress.

## Deprecated For New Work

Do not add new screen inference runtime concepts here. In particular:

- no new generic job/step/event/artifact contract ownership
- no new worker model
- no new long-term/working memory model
- no new screen-specific inference behavior unless needed to keep compatibility routes working

## Public Subpaths

| Subpath | Responsibility |
|---|---|
| `@cx/pipeline` | compatibility root API |
| `@cx/pipeline/adapters` | Node adapter factory |
| `@cx/pipeline/commands` | side effect command types and helpers |
| `@cx/pipeline/contract` | side effect boundary contract |
| `@cx/pipeline/parser` | compatibility Markdown parse facade |
| `@cx/pipeline/runner` | side effect command runner |
| `@cx/pipeline/runtime` | compatibility pipeline runtime |
| `@cx/pipeline/testing` | test fixtures |
| `@cx/pipeline/types` | public compatibility types |

`src/internal/*` and screen-generation internals are not public import surfaces.
