# Screen Design Stage Plan

## 1. Purpose

This document defines the next generation pipeline expansion after the pipeline runtime restructure.

The goal is to stop treating RenderTree JSON as the first design artifact. The pipeline should first capture why the screen exists and how it should be composed, then let later stages materialize that design decision into table-shaped output and RenderTree JSON.

## 2. Current Baseline

Implemented baseline as of 2026-05-28:

```text
read-source
parse-source
derive-screen-intent
plan-composition
select-pattern
generate-render-tree
validate-render-tree
revise-render-tree-if-invalid
validate-render-tree-after-revision
write-artifacts
```

The first two design-stage artifacts are now explicit:

- `screen-intent`: screen purpose, primary user action, content priority, source interpretation.
- `composition-plan`: screen pattern, layout strategy, section roles, source refs, composition rationale.

`apps/smoke` still consumes only `@cx/pipeline`. Stage helper construction stays inside `@cx/orchestration`, and executable stage order stays inside `@cx/pipeline`.

## 3. Absorption Direction

Open Design-inspired process should be absorbed as process and quality gates, not as runtime artifact format.

Absorb:

- discovery before generation: intent, audience, primary task, information priority.
- direction before rendering: composition strategy, section roles, layout pattern choice.
- craft rubric after generation: hierarchy, spacing, affordance, accessibility, density, source fidelity.
- reusable skill references: prompt checklists and critique criteria that can be read by agent runners.
- agent-owned reference assets: generation/review prompt contracts, checklists, and output rules versioned under `packages/agent/docs/`.

Do not absorb:

- HTML artifact runtime.
- generic design-system values that conflict with `@cx/components`, `@cx/tokens`, `@cx/layout`, or `@cx/layout-pattern-store`.
- free-form design patches that bypass schema, catalog, token, or pattern contracts.

## 4. Next Implementation Plan

### Phase A - Contract Hardening

Status as of 2026-05-28: first pass implemented.

- Replace generic JSON schema fallback for `screen-intent` and `composition-plan` with stricter schema documents.
- Add validation tests for required fields, section target region, section role, and schema version.
- Decide whether `pattern-selection` should become a schema artifact kind or remain an agent-local result.

### Phase B - Composition-Aware Generation

Status as of 2026-05-28: first pass implemented.

- Make `screen-generation` prompts require `screenIntent` and `compositionPlan` when present.
- Add validation warning when generated RenderTree ignores high-priority source refs.
- Add deterministic projection helpers from `CompositionPlan.sections` to expected screen regions.

### Phase C - Quality Review Stage

Status as of 2026-05-28: first pass implemented.

- Add `review-quality` after RenderTree validation.
- Add `buildQualityReviewAgentInput()` in `@cx/orchestration`.
- Keep review output as bounded findings and suggested operations, not direct file mutation.
- Use design docs under `docs/design/` as required review references.

### Phase D - Revision Decision

- Replace the fixed revision step with a deterministic next-action helper.
- Inputs: schema validation report, semantic validation report, quality inspection, retry count.
- Outputs: stop, request revision, request human approval, or write artifacts.

### Phase E - Real Agent Smoke

- Run fake mode first for artifact completeness.
- Run Claude local-first only after schema validation and prompt fixtures are stable.
- Store runner requests/results as versioned artifacts for every design stage.

## 5. Done Criteria

- `apps/smoke` still imports only `@cx/pipeline`.
- `@cx/orchestration` has no IO, Claude, validation, or executable stage-order ownership.
- `@cx/pipeline` writes all intermediate artifacts needed to inspect design decisions.
- RenderTree generation receives upstream design artifacts instead of inferring design directly from Markdown.
- Important decisions are recorded in `AGENTS_HISTORY.md`.
