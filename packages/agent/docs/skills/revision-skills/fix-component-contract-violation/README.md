---
id: fix-component-contract-violation
kind: skill
family: revision
stages:
  - revise
tasks:
  - screen-revision
role: component-contract-fix
priority: required
whenToUse: "Use when a generated component uses unsupported props, variants, or child structure."
tags:
  - component-contract
  - catalog
  - revision
---

# fix-component-contract-violation

## Revision Target

- Component node kind
- Component props
- Component children

## Fix Strategy

- Replace unsupported component surfaces with catalog-backed component contracts.
- Preserve source intent through supported props.
- Escalate to component promotion only when no existing component can represent the intent.
