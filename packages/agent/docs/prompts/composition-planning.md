# Composition Planning Prompt Contract

`composition-planning` derives a screen composition plan from normalized source data and screen intent.

The prompt artifact must include:

- source spec summary
- screen intent
- available layout catalog references
- selected design skill references, when available

The output must be JSON only and match `composition-plan.v0.1`.

## Instructions

1. Create a composition plan before pattern selection and RenderTree generation.
2. Preserve upstream `screenIntent` when present.
3. Use available layout candidates as the allowed layout vocabulary; do not invent unavailable layout ids.
4. Use selected design skill guidance when present, but keep `SourceSpec`, schema, catalogs, and upstream decisions higher priority.
5. Apply selected skill quality gates to `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, and `rejectedPatterns`.
6. Use only source refs listed in the provided source reference catalog or `SourceSpec` in `sections[].sourceRefs`.
7. Prefer source component refs when available.
8. Define `screenLayout`, `layoutStrategy`, `sections`, and `rationale`.
9. Also define `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, and `rejectedPatterns`.
10. Use `visualHierarchy` for what the user should perceive first, `primaryUserAction` for the main action slot, `sectionRhythm` for section pacing and divider cadence, `density` for low/medium/high information density, `patternRationale` for selected composition reasoning, and `rejectedPatterns` for plausible alternatives intentionally not used.
11. Ground composition decisions in layout-composition guidance linked to `COMPOSITION_LAYERS`, `SECTION_PATTERNS`, `SCREEN_PATTERN_SUMMARY`, `LAYOUT_SPACING_CONTRACT`, and `INTERACTION_PATTERNS`.
12. Each section must identify target region, role, priority, source refs, and strategy.
13. Return one JSON object only and match the provided output JSON Schema.
