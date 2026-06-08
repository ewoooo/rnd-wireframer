---
id: state-coverage-review
stage: understand
task: screen-intent
role: state-hinting
priority: recommended
tags:
  - state-coverage
  - intent
---

# state-coverage-review

Checks whether relevant UI states are covered for forms, selection flows, overlays, and completion screens.

## Inputs

- SourceSpec states or constraints
- CompositionPlan
- RenderTree hooks/state-related props
- Related design skill

## Checks

- Required, disabled, selected, error, empty, success, and loading states are represented when needed.
- State-specific copy and CTA behavior are coherent.
- Hooks use structured contracts rather than string event shortcuts.

## Outputs

- Pass/fail
- Missing state list
- Suggested state or hook revision
