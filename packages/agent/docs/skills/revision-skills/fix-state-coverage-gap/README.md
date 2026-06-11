---
id: fix-state-coverage-gap
kind: skill
family: revision
stages:
  - revise
tasks:
  - screen-revision
role: state-coverage-fix
priority: recommended
whenToUse: "Use when required states are missing from a form, list, overlay, or completion flow."
tags:
  - state-coverage
  - hooks
  - revision
---

# fix-state-coverage-gap

## Revision Target

- State-related props
- Hooks
- Conditional copy

## Fix Strategy

- Add only source-required states.
- Use structured state and hook contracts.
- Avoid inventing unsupported empty, loading, or error content.
