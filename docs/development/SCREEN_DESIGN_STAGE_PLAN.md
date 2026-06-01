# Screen Design Stage Plan

## 1. Purpose

This document defines the next generation pipeline expansion after the pipeline runtime restructure.

The goal is to stop treating RenderTree JSON as the first design artifact. The pipeline should first capture why the screen exists, compose the design decision, then revise the generated output against schema and craft quality gates.

The implementation model is:

```text
Understand -> Compose -> Revise
```

This is a logical inference layer, not a physical folder layout. Runtime artifacts stay flat under `artifacts/`; `manifest.json` and `trace.json` provide the semantic grouping.

## 2. Current Baseline

Implemented baseline as of 2026-05-28:

```text
read-source
parse-source
derive-screen-intent
plan-composition
derive-decoration-plan
select-pattern
generate-render-tree
validate-render-tree
propose-components
review-quality
revise-render-tree-if-invalid
validate-render-tree-after-revision
write-artifacts
```

The early design-stage artifacts are now explicit:

- `screen-intent`: screen purpose, primary user action, content priority, source interpretation.
- `composition-plan`: screen pattern, layout strategy, section roles, source refs, composition rationale, visual hierarchy, primary user action, section rhythm, density, pattern rationale, and rejected patterns.
- `decoration-plan`: deterministic display structure such as area split, display title, divider, and repeated item hints.
- `pattern-selection`: selected layout candidates from the allowed pattern vocabulary.
- `component-proposal`: non-destructive catalog gap proposal.

`apps/smoke` still consumes only `@cx/pipeline`. Stage helper construction stays inside `@cx/orchestration`, and executable stage order stays inside `@cx/pipeline`.

Artifact storage baseline:

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

Standalone files are result artifacts. `trace.json` consolidates agent inputs, runner requests, intermediate candidates, bundle selections, skill references, initial validation, revision decisions, and proposal validation. File names do not carry numeric stage prefixes.

## 2.1 Logical Layers

| Layer | Pipeline stages | Boundary |
|---|---|---|
| `Understand` | `read-source`, `parse-source`, `derive-screen-intent` | Interpret source meaning only. Do not choose final layout or component substitutions. |
| `Compose` | `plan-composition`, `derive-decoration-plan`, `select-pattern`, `generate-render-tree`, `propose-components` | Turn intent into screen structure, design decisions, pattern choices, RenderTree candidate, and non-binding catalog proposals. |
| `Revise` | `validate-render-tree`, `review-quality`, `revise-render-tree-if-invalid`, `validate-render-tree-after-revision`, `write-artifacts` | Validate, critique, minimally revise, and record final artifacts. |

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

Status as of 2026-06-01: first pass implemented.

- Replace generic JSON schema fallback for `screen-intent` and `composition-plan` with stricter schema documents.
- Add validation tests for required fields, section target region, section role, and schema version.
- Keep `CompositionPlan` as the central Compose artifact with design decision fields: `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, `rejectedPatterns`.
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
- Store result artifacts as standalone files and consolidate inputs, runner requests, and intermediate scaffolding into `trace.json`.

### Phase F - Layered Smoke Explorer

- Keep physical artifact files flat.
- Use `manifest.json` pointers and `trace.json` keys to group smoke details into `Understand`, `Compose`, and `Revise`.
- Do not make web/smoke infer stage order from filename prefixes.
- Show `CompositionPlan` design decision fields in the Compose panel.
- Surface quality findings by layer once validation/review reports expose layer metadata.

### Phase G - Design Skill Selection

Open Design-style skills should be absorbed as bounded Compose references, not as a parallel runtime. Start with a small catalog, prove that `CompositionPlan` improves, then expand the backlog.

Initial implementation skills:

| Skill id | Primary use | Required design docs | Done criteria |
|---|---|---|---|
| `detail-confirmation-screen` | Summary, details, and confirmation CTA screens | `COMPOSITION_LAYERS`, `SCREEN_PATTERN_SUMMARY`, `INTERACTION_PATTERNS` | Produces clearer `visualHierarchy`, bottom action intent, and rejected list/form alternatives. |
| `form-entry-screen` | Input, validation, consent, and submit flows | `SECTION_PATTERNS`, `INTERACTION_PATTERNS`, `LAYOUT_SPACING_CONTRACT` | Produces field grouping, validation rhythm, CTA placement, and density rationale. |
| `list-selection-screen` | Repeating option lists, comparison lists, and selectable rows | `SECTION_PATTERNS`, `COMPONENT_INVENTORY`, `LAYOUT_SPACING_CONTRACT` | Produces list hierarchy, row affordance, selection action, and repetition density rationale. |

Later follow-up skills:

| Skill id | Primary use | Required design docs | Why later |
|---|---|---|---|
| `main-task-screen` | Landing-like task entry or dashboard start screens | `SCREEN_PATTERN_SUMMARY`, `COMPOSITION_LAYERS`, `VISUAL_FOUNDATION_OBSERVATIONS` | Useful after baseline detail/form/list behavior is stable. |
| `completion-feedback-screen` | Completion, success, failure, pending, and receipt screens | `SECTION_PATTERNS`, `INTERACTION_PATTERNS`, `VISUAL_FOUNDATION_OBSERVATIONS` | Needs state tone and feedback variants before it can be scored well. |
| `bottom-sheet-decision` | Bottom sheet choice, confirmation, filter, and consent flows | `SECTION_PATTERNS`, `INTERACTION_PATTERNS`, `LAYOUT_SPACING_CONTRACT` | Should follow overlay state coverage and bottom action rules. |
| `empty-state-guidance` | Empty data, unavailable state, missing permission, and recovery screens | `SECTION_PATTERNS`, `INTERACTION_PATTERNS`, `VISUAL_FOUNDATION_OBSERVATIONS` | Needs source-state hints from `ScreenIntent` to avoid invented states. |
| `account-status-alert` | Dormant, eligibility, limitation, warning, and account status screens | `SECTION_PATTERNS`, `INTERACTION_PATTERNS`, `COMPONENT_INVENTORY` | Useful for MBR/state-heavy flows after quality findings expose state severity. |
| `multi-step-progress-screen` | Wizard, 가입, 신청, verification, and staged task flows | `COMPOSITION_LAYERS`, `SECTION_PATTERNS`, `INTERACTION_PATTERNS` | Requires stable cross-screen intent and progress metadata. |
| `data-summary-card-screen` | Fee, plan, product, benefit, or usage summary screens | `COMPONENT_INVENTORY`, `SCREEN_PATTERN_SUMMARY`, `LAYOUT_SPACING_CONTRACT` | Best added after component proposal can identify summary-card catalog gaps. |
| `comparison-choice-screen` | Plan comparison, option trade-off, and recommendation screens | `SECTION_PATTERNS`, `COMPONENT_INVENTORY`, `VISUAL_FOUNDATION_OBSERVATIONS` | Needs stronger separation and recommendation affordance review gates. |

Implementation boundary:

- `@cx/schema` owns the design skill reference and selection result contracts.
- `@cx/orchestration` owns pure skill selection helpers and injects selected skill refs into agent inputs.
- `@cx/agent` owns skill body, checklist, and output contract docs under `packages/agent/docs/`.
- `@cx/pipeline` records selected skill ids and rationale in `trace.json`.
- `@cx/validation` may later consume skill refs only as validation input; it does not choose skills.

Completion criteria:

- `@cx/schema` exposes a design skill selection contract with selected skill id, selection reason, applicable screen family, required design docs, and quality gates.
- `@cx/orchestration` selects a design skill from `SourceSpec`, `ScreenIntent`, and `PatternLayerCandidate[]` without file IO or runtime side effects.
- `buildCompositionPlanAgentInput()` receives selected skill refs and makes the skill rules visible to the composition prompt.
- `packages/agent/docs/` contains the initial three skill documents, each with applies-to rules, required design docs, composition rules, component/layout proposal rules, good and bad `CompositionPlan` examples, quality gates, and revision hints.
- `@cx/pipeline` records the selection result in `trace.json` and keeps result artifacts flat under `artifacts/`.
- `quality-review` can reference selected skill gates in bounded findings without mutating artifacts directly.
- Smoke explorer can show selected skill id, selection reason, required design docs, and related quality findings without inferring from filenames.

Verification criteria:

- Contract tests pass for `@cx/schema`, `@cx/orchestration`, and `@cx/pipeline`.
- Type checking passes with `npx tsc --noEmit --pretty false`.
- Biome passes for changed source and test files. Markdown-only edits may be verified by targeted text search when Markdown is ignored by the formatter/linter config.
- A smoke run using fake mode writes `trace.json.designSkillSelection`, `composition-plan.json`, `quality-review.json`, and `final-result.json`.
- `trace.json.designSkillSelection.selectedSkill.id` is one of the implemented initial skills or an explicit fallback.
- `composition-plan.json` reflects the selected skill in `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, and `rejectedPatterns`.
- `quality-review.json` findings can identify whether the root cause belongs to `understand`, `compose`, or `revise`.
- Existing smoke artifact consumers continue to resolve files through `manifest.json` pointers and `trace.json` keys.

Minimum verification command set after implementation:

```bash
npm test -- --run packages/schema/src/__tests__/public-api.test.ts packages/orchestration/src/__tests__/public-api.test.ts packages/pipeline/src/__tests__/public-api.test.ts
npx biome check <changed-source-and-test-files>
npx tsc --noEmit --pretty false
npm run smoke:pipeline -- --target '<sample-md>' --run-id '<skill-selection-check>' --artifact-store local-transient
```

## 5. Done Criteria

- `apps/smoke` still imports only `@cx/pipeline`.
- `@cx/orchestration` has no IO, Claude, validation, or executable stage-order ownership.
- `@cx/pipeline` writes all intermediate artifacts needed to inspect design decisions.
- RenderTree generation receives upstream design artifacts instead of inferring design directly from Markdown.
- Artifact consumers use manifest pointers and trace keys instead of numeric filename prefixes.
- Important decisions are recorded in `AGENTS_HISTORY.md`.
