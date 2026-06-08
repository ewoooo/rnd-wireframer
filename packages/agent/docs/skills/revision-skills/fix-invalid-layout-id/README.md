# fix-invalid-layout-id

Use when a generated layout id is not available in the `@cx/layout` catalog.

## Revision Target

- CompositionPlan layout decision
- RenderTree area layout reference

## Fix Strategy

- Replace unsupported ids with catalog-backed layout ids.
- Preserve the original pattern rationale in trace.
- Do not introduce string switch mappings.
