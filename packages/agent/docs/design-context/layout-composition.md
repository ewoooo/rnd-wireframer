# Layout Composition Bundle

Bundle id: `layout-composition`

Source docs:

- `docs/design/COMPOSITION_LAYERS.md`
- `docs/design/SECTION_PATTERNS.md`
- `docs/design/SCREEN_PATTERN_SUMMARY.md`
- `docs/design/LAYOUT_SPACING_CONTRACT.md`

Agent-facing rules:

- Preserve the SourceSpec screen skeleton: `Screen` root, `Screen.Header`, `Screen.Contents`, `Screen.Bottom`, then source area wrappers and component nodes.
- Use `ScreenIntent` to decide why the screen exists, then use `CompositionPlan` to keep section role, target region, priority, and source refs traceable.
- Use only pattern ids from `context.patternSelection` or `context.layerCandidates`.
- Keep bottom actions in `Screen.Bottom` when the source has a bottom region or the composition plan marks a bottom-action section.
- Keep source areas grouped unless the schema/validation contract requires a renderer wrapper.
- Do not invent a new screen, region, area, or composite pattern when the candidate set is narrow.
