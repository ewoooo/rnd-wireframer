# Interaction State Bundle

Bundle id: `interaction-state`

Source docs:

- `docs/design/INTERACTION_PATTERNS.md`
- `docs/design/SECTION_PATTERNS.md`

Agent-facing rules:

- For form surfaces, preserve labels, required/optional hints, validation placement, disabled state when implied, and the primary submit action.
- For list or search surfaces, consider populated, empty/no-result, long item, selected/filter, and secondary action states when the source implies them.
- For detail surfaces, keep information priority clear and keep the primary or bottom action reachable.
- For async surfaces, consider loading and error states when source text, component role, or screen intent implies remote data.
- Do not force loading, empty, error, populated, and edge states onto static informational screens.
- Represent state only with RenderTree-supported structure such as display state role, source-backed variants, or contract-safe nodes.
