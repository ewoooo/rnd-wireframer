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
    source-spec.json
    screen-intent.json
    composition-plan.json
    decoration-plan.json
    pattern-selection.json
    agent-result.json
    final-result.json
    validation-report.json
    quality-review.json
    component-proposal.json
    pipeline-result.json
    trace.json
```

Use `--artifact-store local-transient` for temporary debug runs, or `--out-dir`
only for the legacy direct-output override.

Artifact result files are flat and do not use numeric stage prefixes. `trace.json`
consolidates agent inputs, runner requests, pattern candidates, design-context
bundle selection, skill references, initial validation, revision decisions, and
component proposal validation. Consumers should follow `manifest.json` pointers
instead of guessing paths from file names.

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

Use `--execution-mode step-runner` to run screen generation through the Step runner
wrapper path. The default is `stage-loop`, which keeps the legacy stage loop as
the fallback path during the Step migration.

## Push Local Tables To Supabase Render DB

Project the existing migration snapshot in `data/tables/*.json` into the
relational `render_*` Supabase read model. This is a migration utility for the
current snapshot, not the active smoke result apply path.

Dry-run:

```bash
npm run render-db:push-tables
```

Generate SQL for inspection:

```bash
npm run render-db:push-tables -- --out-file tmp/render-db-push.sql
```

Write through Supabase PostgREST:

```bash
npm run render-db:push-tables -- --write
```

The command reads Supabase URL and service-role credentials from `env.shared`
by default. It leaves the existing Puck/Web tables untouched and only refreshes
the new `render_*` tables.

Accepted smoke results should be promoted through a future direct
`final-result.json -> render_*` apply command. The old `smoke:apply-tables`
command has been retired so Web and smoke no longer write local table JSON as an
approval step.

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
-> derive-decoration-plan
-> select-pattern
-> generate-render-tree
-> validate-render-tree
-> propose-components
-> review-quality
-> revise-render-tree-if-invalid
-> validate-render-tree-after-revision
-> write-artifacts
```

For humans and smoke UI, the flow should be grouped as:

```text
Understand
  read-source
  parse-source
  derive-screen-intent

Compose
  plan-composition
  derive-decoration-plan
  select-pattern
  generate-render-tree
  propose-components

Revise
  validate-render-tree
  review-quality
  revise-render-tree-if-invalid
  validate-render-tree-after-revision
  write-artifacts
```

This grouping is logical only. The artifact directory stays flat, while
`manifest.json` and `trace.json` provide the order and debug context.

During `generate-render-tree`, the pipeline loads screen-generation reference
assets from `packages/agent/docs/screen-generation/` and records them as smoke
trace context. These assets are owned by `@cx/agent`; the smoke harness only
records the reference context used by the pipeline.

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
