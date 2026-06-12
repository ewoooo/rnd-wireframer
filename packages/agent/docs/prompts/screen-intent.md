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

The output must be JSON only and match `screen-intent.v0.2`.

## Instructions

1. Derive the screen intent before visual composition.
2. Use only the structured `SourceSpec` context as the source of truth.
3. Use only source refs listed in the provided source reference catalog or `SourceSpec`; do not invent aliases such as `AppBarHeader`.
4. Capture `coreJudgment` (the single decision the user must make on this screen), `firstUnderstanding` (the information the user must grasp first), `ctaPromise` (what the primary CTA promises in this state), `contentPriority`, and `sourceInterpretation`.
5. When a reference index is provided, set `referenceMatch.referenceIds` to the ids whose situation matches this screen, and `referenceMatch.matchedPattern` to the shared pattern name. Leave `referenceMatch` absent when nothing matches — never invent ids.
6. Also capture `audience`, `primaryTask`, `successMoment`, `missingDecisions`, and `stateCoverageHints` when the source provides enough evidence.
7. `contentPriority` should list source component or area refs in the order the user should understand them.
8. Fill `usedSkills` with the stage skillset documents that materially influenced the output. Use each document's `id`, `sourceRef`, `stage`, `task`, and `role`.
9. Return one JSON object only and match the provided output JSON Schema.
