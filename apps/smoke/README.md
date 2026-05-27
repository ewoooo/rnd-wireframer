# @cx/smoke

`@cx/smoke` is a developer-facing integration app for running generation smoke flows across workspace packages.

It is not a production runtime package. It calls public package APIs and records smoke artifacts for inspection.

## Responsibility

- Run repeatable integration smoke flows.
- Provide a single public function for each smoke flow.
- Keep CLI scripts thin by moving execution harness logic here.
- Record intermediate artifacts for debugging and regression checks.

## Non-Goals

- Markdown parsing rules
- validation rules
- Claude runner implementation
- renderer implementation
- catalog or token ownership

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

`useAI: false` uses the fake smoke runner. `useAI: true` calls the local Claude runner through `@cx/agent`.

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

Generation smoke executes the small plan returned by `@cx/orchestration`.
Keep the flow order in orchestration and keep smoke as the plan executor harness.

The moving parts are:

```text
@cx/orchestration
  owns the step id contract and returns the ordered plan

apps/smoke
  binds each step id to a local executor and runs the plan

@cx/agent
  runs Claude tasks when an executor needs AI

@cx/validation
  validates generated artifacts when an executor needs validation

@cx/pipeline
  reads source artifacts and writes artifacts/logs when an executor needs side effects
```

`GENERATION_PLAN_STEP` is the step id source of truth. `buildGenerationPlan()` returns serializable plan data. `apps/smoke/src/generation/plan-executor.ts` reads that plan and executes the matching function from `generationPlanStepExecutors`.

Current flow:

```text
buildGenerationPlan()
-> generate-render-tree
-> validate-render-tree
-> revise-render-tree-if-invalid
-> validate-render-tree
-> write-artifacts
```

To add a new generation step:

1. Add the step id to `GENERATION_PLAN_STEP` in `packages/orchestration/src/public/types.ts`.
2. Add the step to `buildGenerationPlan()` in `packages/orchestration/src/public/generation.ts`.
3. Add a matching executor to `generationPlanStepExecutors` in `apps/smoke/src/generation/plan-executor.ts`.
4. If the step writes files or logs, route that work through `@cx/pipeline`.
5. Add or update orchestration tests and run the smoke command.

Example extension:

```text
generate-render-tree
-> validate-render-tree
-> revise-render-tree-if-invalid
-> review-quality
-> validate-render-tree
-> write-artifacts
```

Keep these boundaries:

- `@cx/orchestration` decides the step order and builds stage inputs.
- `apps/smoke` executes known smoke steps for local inspection.
- `@cx/agent` runs Claude tasks.
- `@cx/validation` owns validation rules.
- `@cx/pipeline` reads files, writes artifacts, and writes logs.

Avoid adding flow decisions directly inside the smoke harness. When a new AI or validation pass changes the generation process, represent it as a plan step first, then add the smoke executor for that step.

## Harness Boundary

`apps/smoke` executes the orchestration plan for developer smoke runs.

It may:

- run plan step executors
- call `@cx/agent`
- call `@cx/validation`
- create side effect commands for smoke source/artifacts

It must not:

- invent workflow order outside `@cx/orchestration`
- read or write files directly
- own parser, validation, renderer, or Claude adapter rules

File, log, and artifact IO execution must be delegated to `@cx/pipeline`.
