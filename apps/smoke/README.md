# @cx/smoke

`@cx/smoke` is a developer-facing CLI wrapper for running workspace pipelines.

It is not a production runtime package. It calls `@cx/pipeline` and records pipeline artifacts for inspection.

## Responsibility

- Run repeatable integration smoke flows.
- Provide a single public function for each smoke flow.
- Keep CLI scripts thin by delegating execution to `@cx/pipeline`.
- Record intermediate artifacts for debugging and regression checks.

## Non-Goals

- Markdown parsing rules
- validation rules
- Claude runner implementation
- renderer implementation
- catalog or token ownership
- orchestration stage execution
- artifact command construction

## Public Usage

```ts
import { runGenerationSmoke } from "@cx/smoke/generation";

const result = await runGenerationSmoke(
  "data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
  {
    useAI: false,
    runId: "stable-smoke-run",
  },
);

console.log(result.summary);
```

`useAI: false` uses the fake pipeline runner. `useAI: true` asks `@cx/pipeline` to call the local Claude runner through `@cx/agent`.

By default, generation smoke writes run artifacts to:

```text
data/runs/screen-generation/<run-id>/
  manifest.json
  artifacts/
    final-result.json
```

Use `--artifact-store local-transient` for temporary debug runs, or `--out-dir`
only for the legacy direct-output override.

## CLI

Use the root script for the common path:

```bash
npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
```

Or call the app workspace directly:

```bash
npm --workspace @cx/smoke run generation -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
```

Use `--use-ai` to call the real local Claude runner.

## Apply Smoke Result To Tables

After reviewing a smoke run, merge its `final-result.json` RenderTree into
`data/tables` with the apply CLI. The CLI reads `manifest.json`, decomposes the
final RenderTree into screen, area, and component table rows, and leaves
`tableGenerationResult` as a validation/comparison-only intermediate.

Dry-run:

```bash
npm run smoke:apply-tables -- --run-dir data/runs/screen-generation/<run-id>
```

Write:

```bash
npm run smoke:apply-tables -- --run-dir data/runs/screen-generation/<run-id> --write
```

By default the command refuses runs whose validation report has errors.
Use `--allow-invalid` only after manual inspection.

## Promote Smoke Fixture

Promote a reviewed run into the web fixture folder for long-running comparison
sets:

```bash
npm run smoke:promote-fixture -- --run-dir data/runs/screen-generation/<run-id>
```

The command copies the run directory to `apps/web/fixtures/smoke-runs/<run-id>`.
Default web browsing still reads `data/runs/screen-generation`; fixtures are for
curated benchmark sets.

## Extending Generation Flow

Generation smoke executes the `screen-generation` pipeline from `@cx/pipeline`.
Keep the flow order in pipeline definitions and keep smoke as a thin CLI/harness.

The moving parts are:

```text
apps/smoke
  parses CLI options and calls @cx/pipeline

@cx/pipeline
  owns pipeline definitions, stage execution, agent/validation/IO wiring

@cx/orchestration
  provides deterministic stage helpers used by pipeline stages
```

Current flow:

```text
runPipeline("screen-generation")
-> read-source
-> parse-source
-> derive-screen-intent
-> plan-composition
-> select-pattern
-> generate-render-tree
-> validate-render-tree
-> review-quality
-> revise-render-tree-if-invalid
-> validate-render-tree
-> write-artifacts
```

During `generate-render-tree`, the pipeline loads screen-generation reference
assets from `packages/agent/docs/screen-generation/` and records them as smoke
artifacts. These assets are owned by `@cx/agent`; the smoke harness only records
the reference context used by the pipeline.

`generate-render-tree` now expects the agent payload to contain the materialized
`renderTree` consumed by `@cx/renderer`. A `tableGenerationResult` may still be
recorded as a table-shaped intermediate for validation and comparison, but it is
not the apply source of truth.

`validate-render-tree` validates the final RenderTree shape and component props.

The final generated screen artifact is always written to `final-result.json`.
That file contains the RenderTree itself, not the raw agent result envelope, and
must keep the screen render tree shape consumed by `@cx/renderer`.

To add a new generation stage:

1. Add the stage id to the pipeline stage contract in `@cx/pipeline`.
2. Add the stage to the `screen-generation` pipeline definition.
3. Add a matching pipeline stage implementation.
4. Put deterministic agent-input or next-action helper logic in `@cx/orchestration`.
5. Keep agent execution, validation calls, and IO inside `@cx/pipeline`.
6. Add or update pipeline tests and run the smoke command.

Example extension:

```text
select-pattern
-> generate-render-tree
-> validate-render-tree
-> revise-render-tree-if-invalid
-> review-quality
-> validate-render-tree
-> write-artifacts
```

Keep these boundaries:

- `@cx/pipeline` decides the stage order and executes pipeline stages.
- `@cx/orchestration` builds deterministic stage inputs and next-action data.
- `apps/smoke` calls `runPipeline("screen-generation", options)`.
- `packages/agent/docs` stores prompt/checklist/output reference assets.
- `@cx/agent` runs Claude tasks.
- `@cx/validation` owns RenderTree and table-shaped generation validation rules.
- `@cx/pipeline` reads files, writes artifacts, and writes logs.

Avoid adding flow decisions directly inside the smoke harness. When a new AI or validation pass changes the generation process, represent it as a pipeline stage first.

## Harness Boundary

`apps/smoke` executes registered pipelines for developer smoke runs.

It may:

- parse CLI options
- call `@cx/pipeline`
- format and print a summary

It must not:

- invent workflow order outside `@cx/pipeline`
- call `@cx/orchestration`, `@cx/agent`, or `@cx/validation` directly
- read or write files directly
- own parser, validation, renderer, or Claude adapter rules

File, log, artifact IO, validation execution, and agent execution wiring must be delegated to `@cx/pipeline`.
