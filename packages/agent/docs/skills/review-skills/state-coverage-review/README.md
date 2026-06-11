---
id: state-coverage-review
kind: skill
family: review
stages:
  - understand
  - review
tasks:
  - screen-intent
  - quality-review
role: state-hinting
priority: recommended
whenToUse: "Use when checking whether required UI states are represented for forms, selections, overlays, or completion flows."
tags:
  - state-coverage
  - intent
  - quality-review
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
