---
id: screen-intent
stage: understand
task: screen-intent
role: intent-extraction
priority: required
tags:
  - source-intent
  - screen-purpose
---

# Screen Intent Prompt Contract

`screen-intent` derives the user's screen goal from normalized source data.

The prompt artifact must include:

- source spec
- source screen metadata
- user/task query when available

The output must be JSON only and match `screen-intent.v0.1`.

## Instructions

1. Derive the screen intent before visual composition.
2. Use only the structured `SourceSpec` context as the source of truth.
3. Use only source refs listed in the provided source reference catalog or `SourceSpec`; do not invent aliases such as `AppBarHeader`.
4. Capture `screenPurpose`, `primaryUserAction`, `contentPriority`, `sourceInterpretation`, and `rationale`.
5. Also capture `audience`, `primaryTask`, `successMoment`, `missingDecisions`, and `stateCoverageHints` when the source provides enough evidence.
6. `contentPriority` should list source component or area refs in the order the user should understand them.
7. Fill `usedSkills` with the stage skillset documents that materially influenced the output. Use each document's `id`, `sourceRef`, `stage`, `task`, and `role`.
8. Return one JSON object only and match the provided output JSON Schema.
