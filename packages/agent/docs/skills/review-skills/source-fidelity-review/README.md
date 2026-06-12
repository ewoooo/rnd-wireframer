---
id: source-fidelity-review
kind: skill
family: review
stages:
  - understand
  - review
tasks:
  - screen-intent
  - quality-review
role: source-grounding
priority: required
whenToUse: "Use when checking whether generated decisions preserve source intent, facts, actions, and SOT evidence."
tags:
  - source-fidelity
  - intent
  - quality-review
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
