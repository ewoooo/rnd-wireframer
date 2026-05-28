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
-> select-pattern
-> generate-render-tree
-> validate-render-tree
-> revise-render-tree-if-invalid
-> validate-render-tree
-> write-artifacts
```

During `generate-render-tree`, the pipeline loads deterministic generation skills from
`docs/development/generation-skills/*/SKILL.md` and records them as smoke
artifacts. At this stage they are catalog/reference material only; they do not
change the agent prompt, output contract, or pipeline structure.

`generate-render-tree` now expects the agent payload to contain both:

- `tableGenerationResult`: the table-shaped intermediate artifact aligned with `data/tables/`.
- `renderTree`: the materialized preview artifact consumed by `@cx/renderer`.

`validate-render-tree` validates both artifacts. RenderTree validation checks renderer shape and component props. Table generation validation checks that every screen, region, area, and component record carries a real `{ id, variant }` pattern ref from `@cx/layout-pattern-store`.

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
- `docs/development/generation-skills` stores stage prompt/reference fixtures for smoke.
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
