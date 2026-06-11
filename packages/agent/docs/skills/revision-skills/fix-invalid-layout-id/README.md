---
id: fix-invalid-layout-id
kind: skill
family: revision
stages:
  - revise
tasks:
  - screen-revision
role: invalid-layout-fix
priority: required
whenToUse: "Use when a generated layout id is not available in the @cx/layout catalog."
tags:
  - layout-catalog
  - invalid-id
  - revision
---

# fix-invalid-layout-id

## Revision Target

- CompositionPlan layout decision
- RenderTree area layout reference

## Fix Strategy

- Replace unsupported ids with catalog-backed layout ids.
- Preserve the original pattern rationale in trace.
- Do not introduce string switch mappings.
