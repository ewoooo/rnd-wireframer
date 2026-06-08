# Smoke Scripts

The smoke scripts are developer-facing CLI wrappers for running the
`screen-generation` inference pipeline.

They are not production runtime packages. They delegate execution to
`@cx/inference` and record local artifacts for inspection.

## Responsibility

- Run repeatable integration smoke flows.
- Provide a single public function for each smoke flow.
- Keep CLI scripts thin around `@cx/inference`.
- Record intermediate artifacts for debugging and regression checks.

## Non-Goals

- Markdown parsing rules
- validation rules
- Claude runner implementation
- renderer implementation
- catalog or token ownership
- inference step orchestration

## Programmatic Usage

Internal scripts can import `runGenerationSmoke` from `scripts/generation`.
Application and package code should not import smoke helpers.

`useAI: false` uses a fake `@cx/inference` agent runner. `useAI: true` asks
`@cx/inference` to call the local Claude runner through `@cx/agent`.

By default, generation smoke writes run artifacts to:

```text
data/runs/screen-generation/inference-jobs/<run-id>/
  job.json
  events.ndjson
  manifest.json
  steps/<step-id>/
    step.json
    inputs.json
    output-contract.json
    raw-response.json
    output.json
```

## CLI

Use the root script for the common path:

```bash
npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
```

Use `--use-ai` to call the real local Claude runner.

## Extending Generation Flow

Generation smoke executes the `screen-generation` pipeline from `@cx/inference`.
Keep the flow order in `packages/inference/src/pipelines/` and keep smoke as a
thin CLI/harness.

The moving parts are:

```text
scripts/smoke-pipeline.ts
  parses CLI options and calls scripts/generation

scripts/generation
  creates an @cx/inference runtime for local smoke runs

@cx/inference
  owns pipeline definitions, job/step/event state, artifact IO, and worker execution
```

Keep these boundaries:

- `@cx/inference` decides step order and executes inference jobs.
- `packages/agent/docs` stores prompt/checklist/output reference assets.
- `@cx/agent` runs Claude tasks.
- `@cx/validation` owns RenderTree and schema validation rules.

Avoid adding flow decisions directly inside the smoke harness. When a new AI or
validation pass changes the generation process, represent it as an inference
step first.
