---
id: intent-composition
stage: understand
task: intent-composition
role: intent-and-composition
priority: required
tags:
  - source-intent
  - screen-purpose
  - composition
---

# Intent + Composition Prompt Contract

`intent-composition` derives the screen intent and the composition plan in a single generation. It replaces the separate `screen-intent` and `composition-planning` steps; the output carries both contracts.

The prompt artifact must include:

- source spec
- available layout catalog references
- reference screen catalog (matched answer-key structures), when available
- reference area catalog (matched section-level structures), when available
- user/task query when available

The output must be JSON only and match `intent-composition.v0.1`: one object with `schemaVersion`, `screenIntent` (matching `screen-intent.v0.2`), and `compositionPlan` (matching `composition-plan.v0.1`).

## Phase ordering — intent first, catalogs second

판단 오염을 막기 위해 두 단계의 사고 순서를 강제한다.

1. **Phase 1 (intent)**: `SourceSpec`만 근거로 `screenIntent`를 먼저 확정한다. 이 단계에서는 layout catalog와 reference catalog를 보지 않는다. `coreJudgment`, `firstUnderstanding`, `ctaPromise`, `contentPriority`, `sourceInterpretation`은 정답지 구조가 아니라 소스 증거에서 도출해야 한다.
2. **Phase 2 (composition)**: 확정한 `screenIntent`를 상위 결정으로 삼아, 그때부터 layout catalog와 reference catalog를 참조해 `compositionPlan`을 세운다. Phase 2에서 얻은 정보로 Phase 1의 판단을 고쳐 쓰지 않는다 — composition이 intent와 충돌하면 intent가 이긴다.

## Screen Intent Instructions

1. Use only the structured `SourceSpec` context as the source of truth.
2. Use only source refs listed in the provided source reference catalog or `SourceSpec`; do not invent aliases such as `AppBarHeader`.
3. Capture `coreJudgment` (the single decision the user must make on this screen), `firstUnderstanding` (the information the user must grasp first), `ctaPromise` (what the primary CTA promises in this state), `contentPriority`, and `sourceInterpretation`.
4. After the intent judgment is fixed, set `referenceMatch.referenceIds` to the reference screen catalog ids whose situation matches this screen, and `referenceMatch.matchedPattern` to the shared pattern name. Leave `referenceMatch` absent when nothing matches — never invent ids.
5. Also capture `audience`, `primaryTask`, `successMoment`, `missingDecisions`, and `stateCoverageHints` when the source provides enough evidence.
6. `contentPriority` should list source component or area refs in the order the user should understand them.
7. Fill `usedSkills` with the stage skillset documents that materially influenced the output. Use each document's `id`, `sourceRef`, `stage`, `task`, and `role`.

## Composition Instructions

1. Preserve the Phase 1 `screenIntent` as the upstream decision.
2. Use available layout candidates as the allowed layout vocabulary; do not invent unavailable layout ids.
3. Use selected design skill guidance when present, but keep `SourceSpec`, schema, catalogs, and upstream decisions higher priority.
4. Apply selected skill quality gates to `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, and `rejectedPatterns`.
5. Use only source refs listed in the provided source reference catalog or `SourceSpec` in `sections[].sourceRefs`.
6. Prefer source component refs when available.
7. Define `screenLayout`, `layoutStrategy`, `sections`, and `rationale`.
8. Also define `visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`, `patternRationale`, and `rejectedPatterns`.
9. Use `visualHierarchy` for what the user should perceive first, `primaryUserAction` for the main action slot, `sectionRhythm` for section pacing and divider cadence, `density` for low/medium/high information density, `patternRationale` for selected composition reasoning, and `rejectedPatterns` for plausible alternatives intentionally not used.
10. Ground composition decisions in layout-composition guidance linked to `COMPOSITION_LAYERS`, `SECTION_PATTERNS`, `SCREEN_PATTERN_SUMMARY`, `LAYOUT_SPACING_CONTRACT`, and `INTERACTION_PATTERNS`.
11. Each section must identify target region, role, priority, source refs, and strategy.
12. Read `screenIntent.referenceMatch.referenceIds` from Phase 1; from the reference screen catalog, use only those matched entries' structures as screen-level precedent.
13. Use the reference area catalog for section-level planning. When a source section matches an area reference situation, reflect the area reference id in that section's `strategy` text and include it in `compositionProposal.recommendedAreas`.
14. Apply area reference `Structure Rules`, `Component Candidates`, and `Avoid` guidance when splitting sections, ordering fields, deciding local actions, and rejecting similar-but-wrong area patterns.
15. Do not put reference ids in `sections[].sourceRefs`; `sourceRefs` must stay limited to SourceSpec/source-reference ids. Mention reference ids only in `strategy`, `patternRationale`, `rejectedPatterns`, or `compositionProposal.recommendedAreas`.
16. Set `currentFitAssessment.supportsJudgment` and `currentFitAssessment.problems` by judging whether the source's given area arrangement supports `screenIntent.coreJudgment`.
17. Set `compositionProposal.shouldChangeAreaComposite` and `compositionProposal.recommendedAreas` for a better Area/Composite arrangement, grounded in the matched screen and area references.
18. Fill `designTrace.usedReferenceIds` with every screen and area reference id this plan actually adopted. It must be the union of the ids cited in `strategy`, `patternRationale`, and `compositionProposal.recommendedAreas` — downstream generation mounts exactly these reference bodies, so an id missing here is invisible to later steps. Leave it empty only when nothing matched.
19. Fill `designTrace.usedSkillIds` with the mounted skill document ids that influenced this plan.
20. When a source item is grouped, split, summarized, or turned into a bound prop rather than placed one-to-one, record it in `designTrace.transformedSourceRefs` with the transformation and reason. Transformations must never change source item cardinality: grouping two checkboxes still keeps two checkboxes.
21. Record catalog gaps in `catalogGaps` (optional): when a reference pattern would clearly improve this screen but the component catalog has no component to express it, so you fall back to a flatter catalog vocabulary. This does NOT change your plan — you still build `sections` from the existing catalog only. The gap is a non-binding trace a later step uses to propose new components. Each gap names the `desiredPattern` (what the reference would add), `referenceIds` (the reference entries that show it — must exist in the mounted reference catalogs), `targetSourceRefs` (the source refs the pattern would cover), and `reason` (why the catalog cannot express it today). Example: a source asks for guardian phone verification as plain text fields, but the age-verification reference shows carrier selection + a code field with a remaining-time countdown — record that as a gap rather than inventing the component. Leave `catalogGaps` empty or omitted when the catalog already covers the best available pattern.
22. Return one JSON object only and match the provided output JSON Schema.
