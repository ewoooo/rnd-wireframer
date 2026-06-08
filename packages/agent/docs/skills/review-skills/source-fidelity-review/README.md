---
id: source-fidelity-review
stage: understand
task: screen-intent
role: source-grounding
priority: required
tags:
  - source-fidelity
  - intent
---

# source-fidelity-review

Checks whether the generated screen preserves source intent, source facts, required actions, and referenced SOT evidence.

## Inputs

- SourceSpec
- CompositionPlan
- RenderTree
- SOT reference ids used during Compose

## Checks

- Required source facts are not dropped.
- Invented claims, prices, eligibility, or actions are absent.
- Trace records which SOT or design skill influenced key decisions.

## Outputs

- Pass/fail
- Missing or invented source facts
- Suggested revision target
