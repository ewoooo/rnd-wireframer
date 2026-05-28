# Pipeline Runtime Restructure Plan

## 1. Purpose

This document defines the planned restructuring before adding Open Design-inspired design stages and the improved generation flow.

The goal is to make `apps/smoke` a thin pipeline consumer, move executable workflow ownership into `@cx/pipeline`, and keep `@cx/orchestration` as deterministic stage helper logic.

Implementation status as of 2026-05-28: Phase 1 through Phase 4 have landed for the current `screen-generation` smoke flow. Phase 5 is the next extension point for design-stage expansion.

## 2. Current Problem

`apps/smoke` currently sees too many package responsibilities at once.

```text
apps/smoke
-> @cx/orchestration  plan and agent input builders
-> @cx/agent          Claude and fake agent execution
-> @cx/validation     RenderTree and table-shaped validation
-> @cx/pipeline       source read and artifact write side effects
-> @cx/components     validation catalog
```

This makes `apps/smoke` act as a temporary integration orchestrator rather than a pure smoke pipeline runner.

The result is that every new stage, such as `ScreenIntent`, `CompositionPlan`, or `QualityInspection`, would force smoke to know more workflow internals.

## 3. Target Dependency Rule

The target dependency direction is:

```text
apps/smoke
-> @cx/pipeline

@cx/pipeline
-> @cx/orchestration
-> @cx/agent
-> @cx/validation
-> @cx/schema

@cx/orchestration
-> @cx/schema
```

Allowed:

- `apps/smoke` imports `@cx/pipeline`.
- `@cx/pipeline` imports deterministic helpers from `@cx/orchestration`.
- `@cx/pipeline` calls `@cx/agent`, `@cx/validation`, and side-effect helpers.
- `@cx/orchestration` imports only schema contracts and pure data types.

Forbidden:

- `apps/smoke -> @cx/orchestration`
- `apps/smoke -> @cx/agent`
- `apps/smoke -> @cx/validation`
- `apps/smoke -> @cx/components/catalog`
- `@cx/orchestration -> @cx/pipeline`
- `@cx/orchestration -> @cx/agent`
- `@cx/orchestration -> @cx/validation`
- `@cx/orchestration -> file IO`

## 4. Target Package Responsibilities

### `apps/smoke`

Role: developer-facing CLI and harness.

It should:

- parse CLI options
- call `runPipeline("screen-generation", options)`
- print a summary
- expose a thin smoke function for repeatable local runs

It should not:

- build agent inputs
- own generation step order
- call Claude or fake runners directly
- call validators directly
- create artifact write commands directly
- know component catalogs or pattern resolvers

### `@cx/pipeline`

Role: pipeline runtime plus side-effect and IO utilities.

It should own:

- `buildPipeline()`
- `runPipeline()`
- pipeline definition registry
- pipeline stage registry
- stage execution context
- stage artifact bag
- agent runtime wiring
- validation execution wiring
- source import/read helpers
- artifact export/write helpers
- run log helpers
- existing side-effect command runner

It may call:

- `@cx/orchestration` pure stage helpers
- `@cx/agent` runtime adapters
- `@cx/validation` validators
- `@cx/parser` through an adapter/helper
- `@cx/components/catalog` and layout pattern references when needed by validation or candidate resolution

### `@cx/orchestration`

Role: deterministic helper package for each pipeline stage.

It should own:

- `buildPatternSelectionAgentInput()`
- `buildScreenGenerationAgentInput()`
- `buildScreenRevisionAgentInput()`
- future `buildScreenIntentAgentInput()`
- future `buildCompositionPlanAgentInput()`
- future `buildQualityReviewAgentInput()`
- future `decideGenerationNextAction()`

It should not own:

- `buildGenerationPlan()`
- executable stage order
- pipeline runtime state
- Claude execution
- validation execution
- side effects
- file reads or writes

## 5. Generation Plan Migration

Current concept:

```text
@cx/orchestration.buildGenerationPlan()
-> apps/smoke plan executor table
```

Target concept:

```text
@cx/pipeline.screenGenerationPipelineDefinition
-> @cx/pipeline.buildPipeline()
-> @cx/pipeline.runPipeline()
```

Current stages should first move without behavior changes:

```text
read-source
parse-source
select-pattern
generate-render-tree
validate-render-tree
revise-render-tree-if-invalid
validate-render-tree-after-revision
write-artifacts
```

After the runtime move, generation can expand to:

```text
read-source
parse-source
derive-screen-intent
plan-composition
select-pattern
generate-render-tree
validate-render-tree
review-quality
decide-revision
write-artifacts
```

## 6. Public API Sketch

Preferred smoke-facing API:

```ts
import { runPipeline } from "@cx/pipeline";

await runPipeline("screen-generation", {
	agentMode: "fake",
	outDir: "tmp/generation-runs/example",
	runId: "example",
	source: {
		path: "data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
		type: "file",
	},
});
```

Optional build API for runtime composition:

```ts
import { buildPipeline, runPipeline } from "@cx/pipeline";

const pipeline = buildPipeline({
	id: "screen-generation",
	stages: [
		"read-source",
		"parse-source",
		"select-pattern",
		"generate-render-tree",
		"validate-render-tree",
		"write-artifacts",
	],
});

await runPipeline(pipeline, options);
```

The exact TypeScript shape can change during implementation, but the external consumer should not need to import orchestration, agent, validation, or effect internals.

## 7. Suggested `@cx/pipeline` Structure

```text
packages/pipeline/src/
  index.ts
  public/
    runtime.ts
    types.ts
    contract.ts
  runtime/
    build-pipeline.ts
    run-pipeline.ts
    registry.ts
    stage-context.ts
    stage-registry.ts
  pipelines/
    screen-generation.ts
  stages/
    read-source.ts
    parse-source.ts
    select-pattern.ts
    generate-render-tree.ts
    validate-render-tree.ts
    revise-render-tree.ts
    write-artifacts.ts
  effects/
    source-artifact-read.ts
    artifact-write.ts
    run-log-write.ts
  commands/
  runner/
  executors/
  adapters/
  testing/
```

The existing command runner can remain. The new runtime layer should use it for IO rather than replacing it.

## 8. Migration Phases

### Phase 1: Add Runtime Shell

Status: done for `screen-generation`.

Tasks:

- Add pipeline definition, stage id, stage context, and pipeline result types.
- Add `buildPipeline()` and `runPipeline()` public API.
- Add a `screen-generation` pipeline definition matching the current flow.
- Keep current smoke executor in place while the runtime shell is introduced.

Done when:

- `@cx/pipeline` can represent the current generation stage order as data.
- Existing tests still pass.

### Phase 2: Move Smoke Execution Into Pipeline

Status: done for `screen-generation`.

Tasks:

- Move the current logic from `apps/smoke/src/generation/plan-executor.ts` into pipeline stages.
- Keep stage behavior equivalent to the current smoke flow.
- Route file and artifact IO through existing pipeline side-effect helpers.
- Make fake and real agent selection a pipeline runtime option.

Done when:

- `apps/smoke` no longer imports `@cx/orchestration`, `@cx/agent`, `@cx/validation`, or catalog packages.
- `npm run smoke:pipeline -- --target ...` still writes the same class of artifacts.

### Phase 3: Thin Smoke App

Status: done for generation smoke.

Tasks:

- Reduce `apps/smoke` to CLI option parsing, `runPipeline("screen-generation", options)`, and summary formatting.
- Preserve `runGenerationSmoke()` as a compatibility wrapper if needed, but implement it through `runPipeline()`.
- Update `apps/smoke/README.md`.

Done when:

- Smoke exposes only pipeline-level concepts.
- New generation stages can be added without editing smoke executor tables.

### Phase 4: Shrink Orchestration

Status: done for generation plan ownership.

Tasks:

- Move `GENERATION_PLAN_STEP` and `buildGenerationPlan()` concepts to pipeline stage definitions.
- Keep orchestration agent input builders.
- Add a deprecation window or direct removal depending on test impact.
- Update `packages/orchestration/README.md`.

Done when:

- `@cx/orchestration` has no executable plan ownership.
- `@cx/orchestration` imports only schema and pure type contracts.

### Phase 5: Prepare Design-Stage Expansion

Status: next.

Tasks:

- Add placeholder pipeline stages for future `derive-screen-intent`, `plan-composition`, `review-quality`, and `decide-revision`, or document where they will be inserted.
- Do not implement Open Design absorption in this restructuring phase.

Done when:

- Adding the next stages requires only new schema contracts, orchestration helpers, and pipeline stage registration.

## 9. Validation Commands

Run after each phase:

```bash
npx tsc --noEmit --pretty false
npx vitest run packages/pipeline/src/__tests__ packages/orchestration/src/__tests__ packages/parser/src/__tests__ packages/validation/src/__tests__
npx biome check apps/smoke packages/pipeline packages/orchestration docs/development/PIPELINE_RUNTIME_RESTRUCTURE_PLAN.md
npm run smoke:pipeline -- --target 'data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md' --run-id pipeline-runtime-restructure-check --out-dir tmp/generation-runs/pipeline-runtime-restructure-check
```

If `--use-ai` is available in the local environment, run one real AI smoke only after fake smoke passes:

```bash
npm run smoke:pipeline -- --target 'data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md' --run-id pipeline-runtime-restructure-real-ai-check --out-dir tmp/generation-runs/pipeline-runtime-restructure-real-ai-check --use-ai
```

## 10. Handoff Prompt For Implementation Session

The original restructuring handoff was:

```markdown
Implement the pipeline runtime restructure described in docs/development/PIPELINE_RUNTIME_RESTRUCTURE_PLAN.md.

Start with Phase 1 and Phase 2 only:
- add buildPipeline/runPipeline runtime APIs to @cx/pipeline
- move the current screen generation smoke plan execution into @cx/pipeline stages without changing generation behavior
- keep @cx/orchestration as deterministic stage helper logic only
- make apps/smoke call @cx/pipeline and stop importing orchestration/agent/validation/catalog internals

Do not add ScreenIntent, CompositionPlan, Open Design absorption, or quality review yet. This session is only the runtime boundary cleanup.
```

## 11. Follow-Up After Restructure

After this restructure, continue with the generation improvement plan:

```text
SourceSpec
-> ScreenIntent
-> CompositionPlan
-> PatternSelection
-> RenderTreeCandidate
-> ContractValidation
-> QualityInspection
-> RevisionDecision
-> Preview / Versioned Artifact
```

At that point, Open Design absorption can proceed in parallel through:

- generation skill structure
- SKT SDUI quality rubric
- stage-specific checklists
- Claude review stage
- design-stage artifacts
